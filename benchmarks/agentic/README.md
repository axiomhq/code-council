# Agentic benchmark

This benchmark measures GoLegends as an executable workflow, not as a set of
prompt fixtures. Each cell creates a fresh Git repository, seeds a known Go
change, runs one headless Claude Code session, preserves the complete workspace,
and scores the structured result.

The three arms are:

- `baseline`: the same model reviews without GoLegends.
- `review`: `/goreview --json` runs read-only with one targeted judge.
- `fix`: `/goreview --json --fix` may edit, verify, and re-review.

Review arms are scored for rule recall, precision, and mutation safety. Fix arms
also run `go test ./...` and task-specific postconditions. The summary records
cost, tokens, elapsed model time, turns, fix success, and `NO_CHANGE` outcomes.
Every cell keeps its initial and final diff hashes, stdout, stderr, metadata,
result, and disposable workspace beneath `benchmarks/agentic/runs/`.

No model is invoked without the explicit `--live` flag:

```bash
node benchmarks/agentic/run.cjs --list
node benchmarks/agentic/run.cjs --selftest
node benchmarks/agentic/run.cjs --live --arms baseline,review --runs 3 --workers 2
node benchmarks/agentic/run.cjs --live --task input-length --arms review,fix
node benchmarks/agentic/run.cjs --rescore benchmarks/agentic/runs/<run>
```

Run `--selftest` before spending model budget. It prepares every workspace and
requires the deterministic scorer to accept known-good output and reject a
plausible bad result. `--rescore` recomputes metrics from preserved results
without invoking a model.

The isolation, preflight self-test, preserved-workspace, offline-rescoring, and
cost-accounting mechanics were inspired by Ponytail's MIT-licensed agentic
benchmark. The tasks and GoLegends scorer are original to this repository.
