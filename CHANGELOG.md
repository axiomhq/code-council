# Changelog

All notable changes to GoLegends are documented here.

## 0.3.0 — 2026-07-24

### Added

- Opt-in compact `--json` rendering for automation without snapshots, captured
  source, prompts, or rubric content.
- An executable agentic benchmark with isolated baseline, read-only review, and
  fix arms; seeded positive and negative Go changes; mutation guards; preserved
  workspaces; offline rescoring; and cost, token, time, turn, and fix metrics.
- No-spend scorer and known-good-fix self-tests, enforced in CI before live
  benchmark runs.

## 0.2.2 — 2026-07-24

### Added

- A validated `NO_CHANGE` deliberation outcome when every actionable
  fingerprint is explicitly withdrawn by its finding owner.

### Changed

- No-change deliberations skip the fixer, verifier, and re-review.
- Budget gates now reserve the initial chair, targeted consultations, and edit
  cycle separately so a no-change outcome does not require edit-cycle budget.

## 0.2.1 — 2026-07-24

### Changed

- The neutral chair now synthesizes compact cited findings directly instead of
  respawning every selected judge with full review context.
- Only owners of concretely conflicting findings are consulted, with at most
  three narrow consultations before one final chair pass.
- Chair plans and conflict notes have smaller structured-output bounds, and
  chair evidence is compacted and capped at 24 findings. Budget reservation
  reflects the cheaper common path.

## 0.2.0 — 2026-07-24

### Added

- Stable machine lens IDs while preserving every named judge identity.
- Rule-authorized `minor`, `major`, and `blocker` findings with primary and
  supporting code locations.
- Immutable diff snapshots and host, model, protocol, and review provenance.
- Dmitry Vyukov-inspired local-concurrency judge.
- Neutral deliberation chair and independent verification seat.
- Applicability coverage, finding fingerprints, severity-weight progress, and
  explicit `INSUFFICIENT_COVERAGE`, `EVIDENCE_REQUIRED`, and `OSCILLATION`
  verdicts.
- Human-labelled judge evaluation fixtures and CI gates.

### Changed

- Named judge seats now have only read/search tools.
- Major findings fail instead of passing at 8/10.
- N/A no longer counts as acceptance coverage.
- Repository-selected judges remain active in fix mode.
- The fixer reports edits; it no longer verifies its own work.
- Guest judges require a four-file profile, rubric, rules, and method package.
- Default review rounds are three, with a hard maximum of six.
- Performance findings distinguish code remediation from author-supplied
  evidence. Benchmark-covered correctness hardening is advisory unless supplied
  evidence establishes a performance claim, budget, or hot path.

## 0.1.5 — 2026-07-23

### Added

- Eleven named Go judges, cited deduction scorecards, guarded fixes, and Claude
  Code and Codex packaging around one review protocol.
