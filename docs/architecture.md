# Architecture

GoLegends is one Go review plugin named `goreview`. It was designed around
Claude Code's Workflow runtime. The review protocol, roster, rubrics, and
scoring rules are host-neutral; orchestration is not.

Claude Code's `/goreview` command dispatches `workflow.js`. The Codex
`$goreview` skill reads the same protocol and canonical sources, then performs
the equivalent orchestration using Codex's agent model.

## Ownership

The plugin owns:

- `review.json`: identity, judge metadata, defaults, conflict priority, fixer,
  verification, and review-round limits.
- `protocol.md`: host-neutral review, deduction, deliberation, locking, fixing,
  verification, and result rules.
- `policy.md`: Go implementation guidance supplied only to the fixer after
  scoring and planning; judges never receive it.
- `judges/<label>.md`: one named judge's scope, evidence rule, deductions, and
  voice.
- `workflow.js`: Claude Workflow execution, validation, arithmetic, and
  scorecard rendering.
- `commands/goreview.md`: the primary Claude Code adapter.
- `skills/goreview/SKILL.md`: the Codex adapter to the same protocol and
  canonical sources.

## Review data flow

```text
review.json + repository config + command arguments
                         │
                         ▼
                   selected judges
                         │
                         ▼
           independent structured deductions
                         │
                         ▼
       validate evidence ─ calculate score ─ render
                         │
                         ▼
                   terminal verdict
```

A judge never reports its own identity, score, verdict, or rendered scorecard.
It receives only the review scope and its canonical rubric—not shared house
style or fixer policy. For an applicable review, the engine starts at 10 and
subtracts only deductions whose `evidence` is `cited`. Unverified observations
have zero points. The score has a floor of zero; 8 or higher passes.

## Fix data flow

```text
failing cited deductions
          │
          ▼
all selected judges deliberate
          │
          ▼
one selected chair produces a plan
          │
          ▼
one awaited fixer edits and verifies
          │
          ▼
all selected judges re-review
```

The final configured review round cannot edit. That ensures every returned
scorecard describes the tree after the latest write. The writer is awaited
without an abandonment timeout because the runtime cannot safely cancel a
write-capable agent.

## Shared sources

Claude's manifest references the canonical judge and fixer files directly. The
Codex skill reads those same sources, so host adapters never copy rubrics.
