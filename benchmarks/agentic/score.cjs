'use strict'

const { execFileSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

function allFindings(output) {
  if (!output || typeof output !== 'object') return []
  if (Array.isArray(output.findings)) return output.findings
  if (!Array.isArray(output.scores)) return []
  return output.scores.flatMap(score => Array.isArray(score.deductions) ? score.deductions : [])
}

function findingText(finding) {
  return [
    finding.ruleId,
    finding.severity,
    finding.explanation,
    finding.change,
    finding.summary,
    finding.file,
    finding.symbol,
  ].filter(Boolean).join(' ').toLowerCase()
}

function scoreReview(task, output) {
  const findings = allFindings(output)
  const expected = new Set(task.expectedRuleIds)
  const foundRules = new Set(findings.map(finding => finding.ruleId).filter(Boolean))
  const signalHit = finding => task.signals.some(signal => findingText(finding).includes(signal))
  const matched = new Set()

  for (const ruleId of expected) {
    if (foundRules.has(ruleId)) matched.add(ruleId)
  }
  if (matched.size === 0 && foundRules.size === 0 && expected.size > 0 && findings.some(signalHit)) {
    matched.add([...expected][0])
  }

  const truePositives = matched.size
  const falseNegatives = expected.size - truePositives
  const falsePositives = findings.filter(finding => {
    if (finding.ruleId && expected.has(finding.ruleId)) return false
    if (foundRules.size === 0 && signalHit(finding)) return false
    return true
  }).length

  return {
    verdict: output && output.verdict || null,
    findings: findings.length,
    expectedRules: [...expected],
    foundRules: [...foundRules],
    truePositives,
    falsePositives,
    falseNegatives,
    precision: truePositives + falsePositives === 0
      ? (expected.size === 0 ? 1 : 0)
      : truePositives / (truePositives + falsePositives),
    recall: expected.size === 0 ? 1 : truePositives / expected.size,
  }
}

function checkWorkspace(task, workspace) {
  let checksPassed = false
  let checkOutput = ''
  try {
    checkOutput = execFileSync('go', ['test', './...'], {
      cwd: workspace,
      encoding: 'utf8',
      timeout: 60_000,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    checksPassed = true
  } catch (error) {
    checkOutput = `${error.stdout || ''}${error.stderr || ''}`.slice(-4000)
  }

  const forbidden = task.forbiddenAfterFix.filter(needle =>
    Object.keys(task.changedFiles).some(file => {
      const target = path.join(workspace, file)
      return fs.existsSync(target) && fs.readFileSync(target, 'utf8').includes(needle)
    }),
  )

  return { checksPassed, forbidden, checkOutput }
}

function aggregate(cells) {
  const totals = cells.reduce((sum, cell) => {
    const score = cell.score || {}
    sum.truePositives += score.truePositives || 0
    sum.falsePositives += score.falsePositives || 0
    sum.falseNegatives += score.falseNegatives || 0
    sum.costUsd += cell.usage && cell.usage.costUsd || 0
    sum.tokens += cell.usage && cell.usage.tokens || 0
    sum.durationMs += cell.usage && cell.usage.durationMs || 0
    sum.turns += cell.usage && cell.usage.turns || 0
    sum.mutationSafe += cell.mutationSafe === true ? 1 : 0
    sum.readOnlyCells += cell.arm !== 'fix' ? 1 : 0
    sum.fixSucceeded += cell.arm === 'fix' && cell.fix && cell.fix.checksPassed &&
      cell.fix.forbidden.length === 0 ? 1 : 0
    sum.fixCells += cell.arm === 'fix' ? 1 : 0
    sum.noChange += cell.output && cell.output.verdict === 'NO_CHANGE' ? 1 : 0
    return sum
  }, {
    truePositives: 0,
    falsePositives: 0,
    falseNegatives: 0,
    costUsd: 0,
    tokens: 0,
    durationMs: 0,
    turns: 0,
    mutationSafe: 0,
    readOnlyCells: 0,
    fixSucceeded: 0,
    fixCells: 0,
    noChange: 0,
  })

  return {
    cells: cells.length,
    precision: ratio(totals.truePositives, totals.truePositives + totals.falsePositives),
    recall: ratio(totals.truePositives, totals.truePositives + totals.falseNegatives),
    readOnlyMutationSafety: ratio(totals.mutationSafe, totals.readOnlyCells),
    fixSuccessRate: ratio(totals.fixSucceeded, totals.fixCells),
    noChangeOutcomes: totals.noChange,
    costUsd: Number(totals.costUsd.toFixed(6)),
    tokens: totals.tokens,
    durationMs: totals.durationMs,
    turns: totals.turns,
    ...totals,
  }
}

function ratio(numerator, denominator) {
  return denominator === 0 ? null : numerator / denominator
}

module.exports = { aggregate, allFindings, checkWorkspace, scoreReview }
