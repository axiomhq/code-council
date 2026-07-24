'use strict'

const assert = require('node:assert/strict')
const childProcess = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')

const root = path.resolve(__dirname, '..')
const run = path.join(root, 'benchmarks', 'agentic', 'run.cjs')
const { commandFor, parseClaudeOutput } = require('../benchmarks/agentic/run.cjs')
const { scoreReview } = require('../benchmarks/agentic/score.cjs')
const { tasks } = require('../benchmarks/agentic/tasks.cjs')

test('agentic benchmark scorer self-tests without model spend', () => {
  const result = JSON.parse(childProcess.execFileSync(process.execPath, [run, '--selftest'], {
    cwd: root,
    encoding: 'utf8',
  }))
  assert.equal(result.ok, true)
  assert.deepEqual(result.tasks, tasks.map(task => task.id))
})

test('agentic benchmark refuses live sessions without explicit consent', () => {
  const result = childProcess.spawnSync(process.execPath, [run, '--task', tasks[0].id], {
    cwd: root,
    encoding: 'utf8',
  })
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /without --live/)
})

test('baseline excludes installed plugins and review loads only this plugin', () => {
  const options = { model: 'sonnet', maxBudgetUsd: 5 }
  const baseline = commandFor({ task: tasks[0], arm: 'baseline' }, options)
  const review = commandFor({ task: tasks[0], arm: 'review' }, options)
  assert.equal(baseline.args.includes('--plugin-dir'), false)
  assert.equal(baseline.args.includes('--strict-mcp-config'), true)
  assert.equal(review.args.includes('--plugin-dir'), true)
  assert.match(review.args.at(-1), /^\/goreview --json /)
})

test('Claude structured output and usage are preserved', () => {
  const parsed = parseClaudeOutput(JSON.stringify({
    structured_output: { verdict: 'PASS', findings: [], summary: 'Clean.' },
    total_cost_usd: 0.01,
    duration_ms: 123,
    num_turns: 2,
    usage: { input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 20 },
  }))
  assert.equal(parsed.output.verdict, 'PASS')
  assert.deepEqual(parsed.usage, { costUsd: 0.01, durationMs: 123, turns: 2, tokens: 35 })
})

test('agentic benchmark identifies expected and invented findings', () => {
  const task = tasks[0]
  const score = scoreReview(task, {
    scores: [{
      deductions: [
        { ruleId: task.expectedRuleIds[0] },
        { ruleId: 'invented.preference', explanation: 'Cosmetic naming preference.' },
      ],
    }],
  })
  assert.equal(score.truePositives, 1)
  assert.equal(score.falsePositives, 1)
  assert.equal(score.falseNegatives, 0)
})

test('machine rendering is opt-in and excludes raw snapshots', () => {
  const command = fs.readFileSync(path.join(root, 'plugins', 'goreview', 'commands', 'goreview.md'), 'utf8')
  const skill = fs.readFileSync(path.join(root, 'plugins', 'goreview', 'skills', 'goreview', 'SKILL.md'), 'utf8')
  const protocol = fs.readFileSync(path.join(root, 'plugins', 'goreview', 'protocol.md'), 'utf8')
  for (const source of [command, skill, protocol]) {
    assert.match(source, /--json/)
    assert.match(source, /withdrawnFingerprints/)
    assert.match(source, /must not include.*snapshot/is)
  }
})
