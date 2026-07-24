#!/usr/bin/env node
'use strict'

const { spawn } = require('node:child_process')
const crypto = require('node:crypto')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { aggregate, checkWorkspace, scoreReview } = require('./score.cjs')
const { tasks } = require('./tasks.cjs')

const root = path.resolve(__dirname, '..', '..')
const pluginRoot = path.join(root, 'plugins', 'goreview')
const runsRoot = path.join(__dirname, 'runs')
const validArms = new Set(['baseline', 'review', 'fix'])

const baselineSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['verdict', 'findings', 'summary'],
  properties: {
    verdict: { enum: ['PASS', 'FAIL'] },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['severity', 'file', 'symbol', 'explanation', 'change'],
        properties: {
          severity: { enum: ['minor', 'major', 'blocker'] },
          file: { type: 'string' },
          symbol: { type: 'string' },
          explanation: { type: 'string' },
          change: { type: 'string' },
        },
      },
    },
    summary: { type: 'string' },
  },
}

function usage() {
  return `GoLegends agentic benchmark

No model is invoked unless --live is present.

  node benchmarks/agentic/run.cjs --list
  node benchmarks/agentic/run.cjs --selftest
  node benchmarks/agentic/run.cjs --live --arms baseline,review --runs 1
  node benchmarks/agentic/run.cjs --live --task input-length --arms review,fix
  node benchmarks/agentic/run.cjs --rescore benchmarks/agentic/runs/<run>

Options:
  --task ID          Run one task (repeatable)
  --arms LIST        baseline,review,fix (default: baseline,review)
  --runs N           Replicates per task/arm (default: 1)
  --workers N        Concurrent Claude processes (default: 1)
  --model NAME       Claude model selector (default: sonnet)
  --timeout SEC      Per-cell timeout (default: 900)
  --max-budget USD   Per-cell Claude budget (default: 5)
`
}

function parseArgs(argv) {
  const options = {
    arms: ['baseline', 'review'],
    runs: 1,
    workers: 1,
    model: 'sonnet',
    timeoutMs: 900_000,
    maxBudgetUsd: 5,
    taskIds: [],
  }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (['--help', '-h', '--list', '--selftest', '--live'].includes(arg)) {
      options[arg.slice(2).replace('-', '') || 'help'] = true
    } else if (arg === '--rescore') {
      options.rescore = argv[++i]
    } else if (arg === '--task') {
      options.taskIds.push(argv[++i])
    } else if (arg === '--arms') {
      options.arms = argv[++i].split(',').filter(Boolean)
    } else if (arg === '--runs') {
      options.runs = positiveInteger(argv[++i], '--runs')
    } else if (arg === '--workers') {
      options.workers = positiveInteger(argv[++i], '--workers')
    } else if (arg === '--model') {
      options.model = argv[++i]
    } else if (arg === '--timeout') {
      options.timeoutMs = positiveInteger(argv[++i], '--timeout') * 1000
    } else if (arg === '--max-budget') {
      options.maxBudgetUsd = Number(argv[++i])
      if (!(options.maxBudgetUsd > 0)) throw new Error('--max-budget must be positive')
    } else {
      throw new Error(`unknown argument: ${arg}`)
    }
  }
  return options
}

function positiveInteger(value, flag) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`${flag} must be a positive integer`)
  return parsed
}

function selectTasks(ids) {
  if (ids.length === 0) return tasks
  const selected = ids.map(id => tasks.find(task => task.id === id))
  const missing = ids.filter((id, index) => !selected[index])
  if (missing.length) throw new Error(`unknown task: ${missing.join(', ')}`)
  return selected
}

function validateArms(arms) {
  const invalid = arms.filter(arm => !validArms.has(arm))
  if (invalid.length) throw new Error(`unknown arm: ${invalid.join(', ')}`)
  return [...new Set(arms)]
}

function writeFiles(directory, files) {
  for (const [relative, content] of Object.entries(files)) {
    const target = path.join(directory, relative)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, content)
  }
}

function git(workspace, args) {
  const { execFileSync } = require('node:child_process')
  return execFileSync('git', args, {
    cwd: workspace,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

function prepareWorkspace(task, workspace) {
  fs.mkdirSync(workspace, { recursive: true })
  writeFiles(workspace, task.baseFiles)
  git(workspace, ['init', '-q'])
  git(workspace, ['config', 'user.name', 'GoLegends Benchmark'])
  git(workspace, ['config', 'user.email', 'benchmark@example.invalid'])
  git(workspace, ['add', '.'])
  git(workspace, ['commit', '-qm', 'benchmark base'])
  writeFiles(workspace, task.changedFiles)
  return diffHash(workspace)
}

function diffHash(workspace) {
  const unstaged = git(workspace, ['diff', '--no-ext-diff', '--binary'])
  const staged = git(workspace, ['diff', '--cached', '--no-ext-diff', '--binary'])
  return crypto.createHash('sha256').update(unstaged).update('\0').update(staged).digest('hex')
}

function commandFor(cell, options) {
  const common = [
    '-p',
    '--output-format', 'json',
    '--model', options.model,
    '--max-budget-usd', String(options.maxBudgetUsd),
    '--permission-mode', 'bypassPermissions',
    '--setting-sources', 'project,local',
    '--strict-mcp-config',
    '--no-session-persistence',
  ]
  if (cell.arm !== 'fix') {
    common.push('--tools', 'Read,Grep,Glob,Bash', '--disallowed-tools', 'Edit,Write,NotebookEdit')
  }

  if (cell.arm === 'baseline') {
    common.push('--json-schema', JSON.stringify(baselineSchema))
    return {
      command: 'claude',
      args: [...common, [
        cell.task.prompt,
        'Inspect the working-tree diff and relevant files. Do not edit anything.',
        'Return only the requested structured review.',
      ].join('\n')],
    }
  }

  common.push('--plugin-dir', pluginRoot)
  const fix = cell.arm === 'fix' ? '--fix --max-rounds 3 ' : ''
  return {
    command: 'claude',
    args: [...common, `/goreview --json ${fix}${cell.task.judge} -- .`],
  }
}

function spawnCellProcess(command, args, cwd, timeoutMs, stdoutPath, stderrPath) {
  return new Promise(resolve => {
    const started = Date.now()
    const stdoutFd = fs.openSync(stdoutPath, 'w')
    const stderrFd = fs.openSync(stderrPath, 'w')
    const child = spawn(command, args, {
      cwd,
      detached: process.platform !== 'win32',
      env: { ...process.env, CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1' },
      // Files avoid inherited stdout pipes keeping the parent hung after a
      // timed-out process tree has been terminated.
      stdio: ['ignore', stdoutFd, stderrFd],
    })
    let timedOut = false
    let finished = false
    const finish = result => {
      if (finished) return
      finished = true
      clearTimeout(timer)
      fs.closeSync(stdoutFd)
      fs.closeSync(stderrFd)
      resolve({
        ...result,
        stdout: fs.readFileSync(stdoutPath, 'utf8'),
        stderr: fs.readFileSync(stderrPath, 'utf8'),
        timedOut,
        durationMs: Date.now() - started,
      })
    }
    const timer = setTimeout(() => {
      timedOut = true
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'])
      } else {
        try { process.kill(-child.pid, 'SIGTERM') } catch {}
        setTimeout(() => {
          try { process.kill(-child.pid, 'SIGKILL') } catch {}
        }, 5000).unref()
      }
    }, timeoutMs)
    child.on('error', error => finish({ exitCode: null, error: error.message }))
    child.on('exit', exitCode => finish({ exitCode }))
  })
}

function parseClaudeOutput(stdout) {
  const envelope = JSON.parse(stdout)
  const rawResult = envelope.structured_output ?? envelope.result
  const result = typeof rawResult === 'string' ? rawResult.trim() : rawResult
  const output = typeof result === 'string' ? parseEmbeddedJson(result) : result
  const usage = envelope.usage || {}
  return {
    envelope,
    output,
    usage: {
      costUsd: Number(envelope.total_cost_usd || 0),
      durationMs: Number(envelope.duration_ms || 0),
      turns: Number(envelope.num_turns || 0),
      tokens: Number(usage.input_tokens || 0) + Number(usage.output_tokens || 0) +
        Number(usage.cache_creation_input_tokens || 0) + Number(usage.cache_read_input_tokens || 0),
    },
  }
}

function parseEmbeddedJson(value) {
  try {
    return JSON.parse(value)
  } catch {}
  const fenced = value.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced) return JSON.parse(fenced[1])
  const start = value.indexOf('{')
  const end = value.lastIndexOf('}')
  if (start !== -1 && end > start) return JSON.parse(value.slice(start, end + 1))
  throw new Error('Claude result did not contain a JSON object')
}

async function runCell(cell, options, runDirectory) {
  const cellDirectory = path.join(runDirectory, cell.task.id, cell.arm, String(cell.run))
  const workspace = path.join(cellDirectory, 'workspace')
  fs.mkdirSync(cellDirectory, { recursive: true })
  const initialDiffHash = prepareWorkspace(cell.task, workspace)
  const invocation = commandFor(cell, options)
  const metadata = {
    schemaVersion: 1,
    task: cell.task.id,
    arm: cell.arm,
    run: cell.run,
    judge: cell.task.judge,
    expectedRuleIds: cell.task.expectedRuleIds,
    initialDiffHash,
    command: invocation.command,
    args: invocation.args,
    startedAt: new Date().toISOString(),
  }
  fs.writeFileSync(path.join(cellDirectory, 'metadata.json'), JSON.stringify(metadata, null, 2) + '\n')
  const stdoutPath = path.join(cellDirectory, 'stdout.json')
  const stderrPath = path.join(cellDirectory, 'stderr.txt')
  const processResult = await spawnCellProcess(
    invocation.command,
    invocation.args,
    workspace,
    options.timeoutMs,
    stdoutPath,
    stderrPath,
  )

  const finalDiffHash = diffHash(workspace)
  let parsed = null
  let parseError = null
  try {
    parsed = parseClaudeOutput(processResult.stdout)
  } catch (error) {
    parseError = error.message
  }
  const result = {
    ...metadata,
    process: {
      exitCode: processResult.exitCode,
      timedOut: processResult.timedOut,
      durationMs: processResult.durationMs,
      error: processResult.error || null,
    },
    finalDiffHash,
    mutationSafe: cell.arm === 'fix' ? null : finalDiffHash === initialDiffHash,
    output: parsed && parsed.output,
    usage: parsed && parsed.usage,
    parseError,
  }
  result.score = scoreReview(cell.task, result.output)
  if (cell.arm === 'fix') result.fix = checkWorkspace(cell.task, workspace)
  fs.writeFileSync(path.join(cellDirectory, 'result.json'), JSON.stringify(result, null, 2) + '\n')
  return result
}

async function workerPool(items, workers, operation) {
  const results = new Array(items.length)
  let next = 0
  async function worker() {
    while (next < items.length) {
      const index = next++
      results[index] = await operation(items[index])
    }
  }
  await Promise.all(Array.from({ length: Math.min(workers, items.length) }, worker))
  return results
}

function selftest() {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'goreview-benchmark-'))
  try {
    for (const task of tasks) {
      const workspace = path.join(temp, task.id)
      const hash = prepareWorkspace(task, workspace)
      if (!/^[a-f0-9]{64}$/.test(hash)) throw new Error(`${task.id}: invalid diff hash`)
      if (!git(workspace, ['status', '--porcelain']).trim()) throw new Error(`${task.id}: seed has no diff`)
      writeFiles(workspace, task.fixedFiles)
      const referenceFix = checkWorkspace(task, workspace)
      if (!referenceFix.checksPassed || referenceFix.forbidden.length) {
        throw new Error(`${task.id}: known-good fix reference failed`)
      }
    }

    const positive = scoreReview(tasks[0], {
      verdict: 'REVIEW_ONLY',
      scores: [{ deductions: [{ ruleId: 'simplicity.unnecessary-indirection' }] }],
    })
    if (positive.truePositives !== 1 || positive.falsePositives !== 0 || positive.falseNegatives !== 0) {
      throw new Error('known-good scorer reference failed')
    }
    const bad = scoreReview(tasks[0], {
      verdict: 'REVIEW_ONLY',
      scores: [{ deductions: [{ ruleId: 'unrelated.invented', explanation: 'A cosmetic preference.' }] }],
    })
    if (bad.truePositives !== 0 || bad.falsePositives !== 1 || bad.falseNegatives !== 1) {
      throw new Error('known-bad scorer reference was not rejected')
    }
    const clean = scoreReview(tasks[2], { verdict: 'ACCEPTED', scores: [{ deductions: [] }] })
    if (clean.precision !== 1 || clean.recall !== 1) throw new Error('clean reference failed')
    return { ok: true, tasks: tasks.map(task => task.id), scorerReferences: 3 }
  } finally {
    fs.rmSync(temp, { recursive: true, force: true })
  }
}

function findResults(directory) {
  const results = []
  function visit(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const target = path.join(current, entry.name)
      if (entry.isDirectory()) visit(target)
      else if (entry.name === 'result.json') results.push(JSON.parse(fs.readFileSync(target, 'utf8')))
    }
  }
  visit(directory)
  return results
}

function rescore(directory) {
  const absolute = path.resolve(directory)
  const cells = findResults(absolute).map(cell => {
    const task = tasks.find(candidate => candidate.id === cell.task)
    if (!task) throw new Error(`result references unknown task ${cell.task}`)
    cell.score = scoreReview(task, cell.output)
    return cell
  })
  const summary = aggregate(cells)
  fs.writeFileSync(path.join(absolute, 'summary.json'), JSON.stringify(summary, null, 2) + '\n')
  return summary
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.help || process.argv.length === 2) {
    process.stdout.write(usage())
    return
  }
  if (options.list) {
    for (const task of tasks) {
      process.stdout.write(`${task.id}\t${task.judge}\t${task.expectedRuleIds.join(',') || 'clean'}\n`)
    }
    return
  }
  if (options.selftest) {
    process.stdout.write(JSON.stringify(selftest(), null, 2) + '\n')
    return
  }
  if (options.rescore) {
    process.stdout.write(JSON.stringify(rescore(options.rescore), null, 2) + '\n')
    return
  }
  if (!options.live) throw new Error('refusing to invoke Claude without --live')

  const selected = selectTasks(options.taskIds)
  const arms = validateArms(options.arms)
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const runDirectory = path.join(runsRoot, timestamp)
  fs.mkdirSync(runDirectory, { recursive: true })
  const cells = selected.flatMap(task => arms.flatMap(arm =>
    Array.from({ length: options.runs }, (_, index) => ({ task, arm, run: index + 1 })),
  ))
  const manifest = {
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    model: options.model,
    arms,
    runs: options.runs,
    workers: options.workers,
    taskIds: selected.map(task => task.id),
  }
  fs.writeFileSync(path.join(runDirectory, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
  const results = await workerPool(cells, options.workers, async cell => {
    process.stderr.write(`running ${cell.task.id}/${cell.arm}/${cell.run}\n`)
    return runCell(cell, options, runDirectory)
  })
  const summary = aggregate(results)
  fs.writeFileSync(path.join(runDirectory, 'summary.json'), JSON.stringify(summary, null, 2) + '\n')
  process.stdout.write(JSON.stringify({ runDirectory, summary }, null, 2) + '\n')
}

if (require.main === module) {
  main().catch(error => {
    process.stderr.write(`error: ${error.message}\n`)
    process.exitCode = 1
  })
}

module.exports = { commandFor, parseClaudeOutput, selftest }
