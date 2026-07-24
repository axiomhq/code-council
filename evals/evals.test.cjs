const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')

const root = path.resolve(__dirname, '..')
const pluginRoot = path.join(root, 'plugins', 'goreview')
const readJSON = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'))
const config = readJSON('plugins/goreview/review.json')
const corpus = readJSON('evals/cases.json')
const metrics = readJSON('evals/metrics.json')

test('the human-labelled corpus covers four decision types for every named judge', () => {
  assert.equal(corpus.schemaVersion, 1)
  assert.equal(corpus.cases.length, config.judges.length)
  assert.deepEqual(
    corpus.cases.map(entry => entry.judge).sort(),
    config.judges.map(judge => judge.label).sort(),
  )

  const judges = new Map(config.judges.map(judge => [judge.label, judge]))
  for (const entry of corpus.cases) {
    const judge = judges.get(entry.judge)
    const ruleIDs = new Set(judge.rules.map(rule => rule.id))

    assert.equal(entry.positive.applicable, true)
    assert.equal(entry.positive.mustFind.length > 0, true)
    assert.equal(entry.negative.applicable, true)
    assert.equal(entry.negative.mustNotFind.length > 0, true)
    assert.equal(entry.applicability.applicable, false)
    assert.equal(entry.crossLens.applicable, false)
    assert.equal(judges.has(entry.crossLens.deferTo), true)
    assert.notEqual(entry.crossLens.deferTo, entry.judge)

    for (const decision of ['positive', 'negative', 'applicability', 'crossLens']) {
      assert.equal(typeof entry[decision].description, 'string')
      assert.equal(entry[decision].description.length > 20, true)
      assert.match(entry[decision].patch, /^[+-]/m)
    }
    for (const ruleID of entry.positive.mustFind) assert.equal(ruleIDs.has(ruleID), true)
    for (const ruleID of entry.negative.mustNotFind) assert.equal(ruleIDs.has(ruleID), true)
  }
})

test('metric targets are explicit probabilities and include quality, stability, and fix outcomes', () => {
  assert.equal(metrics.schemaVersion, 1)
  assert.deepEqual(Object.keys(metrics.targets).sort(), [
    'crossLensDeferralAccuracy',
    'deductionPrecision',
    'deductionRecall',
    'duplicateFindingRateMaximum',
    'fixSuccessRate',
    'notApplicableAccuracy',
    'repeatRunStability',
  ])
  for (const value of Object.values(metrics.targets)) {
    assert.equal(typeof value, 'number')
    assert.equal(value > 0 && value <= 1, true)
  }
})

test('every expected rule remains present in its rubric', () => {
  for (const entry of corpus.cases) {
    const judge = config.judges.find(candidate => candidate.label === entry.judge)
    const rubric = fs.readFileSync(path.join(pluginRoot, judge.path), 'utf8')
    for (const ruleID of [...entry.positive.mustFind, ...entry.negative.mustNotFind]) {
      assert.equal(rubric.includes(`\`${ruleID}\``), true)
    }
  }
})

test('Damian distinguishes benchmark-covered correctness cost from a demonstrated hot path', () => {
  const entry = corpus.cases.find(candidate => candidate.judge === 'dgryski')
  const judge = config.judges.find(candidate => candidate.label === 'dgryski')
  const rules = new Map(judge.rules.map(rule => [rule.id, rule]))

  assert.equal(entry.advisory.applicable, true)
  assert.equal(entry.advisory.expectedVerdict, 'PASS')
  assert.deepEqual(entry.advisory.mustFind, ['performance.cost-unquantified'])
  assert.deepEqual(entry.advisory.mustNotFind, ['performance.hotpath-work-unmeasured'])
  assert.deepEqual(rules.get('performance.cost-unquantified'), {
    id: 'performance.cost-unquantified',
    severity: 'minor',
    remediation: 'external-evidence',
  })
})
