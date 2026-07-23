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
- `judges/guest.md`: one generic read-only seat for approved repository-pinned
  judges.
- `methods/<label>.md`: that judge's applicability check, investigation
  sequence, evidence bar, and stop condition.
- `scripts/github_judge.py`: bounded GitHub public-metadata discovery and
  deterministic validation of repository-pinned judge files.
- `workflow.js`: Claude Workflow execution, validation, arithmetic, and
  scorecard rendering.
- `commands/goreview.md`: the primary Claude Code adapter.
- `commands/add.md`: explicit guest discovery, draft approval, and pinning.
- `skills/goreview/SKILL.md`: the Codex adapter to the same protocol and
  canonical sources.

## Review data flow

```text
review.json + repository config + approved pinned guests + command arguments
                         │
                         ▼
                   selected judges
                         │
                         ▼
       linked/approved rubric + selected method only
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

A judge reports its score first, followed by the deductions that explain it. It
never reports its identity, verdict, or rendered scorecard. The engine repeats
the deduction arithmetic and rejects a mismatched score before deriving the
verdict. A judge receives only the review scope, its canonical or approved
pinned rubric, and its linked methodology—not shared house style or fixer
policy. The method determines how the judge investigates; only the rubric can
authorize deductions. Unverified observations have zero points. Scores have a
floor of zero; 8 or higher passes.

Guest discovery is separate from review. An explicit `@handle` fetches bounded
public metadata, produces a draft for human approval, and pins the source URLs,
repository revisions, and retrieval time beside the approved rubric. Review
never performs a network lookup, refreshes a guest, or auto-selects one.

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

Claude's manifest references the canonical judges, generic guest, and fixer
files directly. The Claude command and Codex skill resolve installed methods
through `review.json` and repository-pinned guests through their validated
directory, so host adapters never copy rubrics or methodologies.
