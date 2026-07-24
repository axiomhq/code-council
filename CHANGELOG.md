# Changelog

All notable changes to GoLegends are documented here.

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
