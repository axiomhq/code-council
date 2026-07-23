---
description: "Run GoLegends' named or approved repo-pinned Go judges for cited deduction scorecards. Read-only by default; --fix deliberates, edits, verifies, and re-reviews."
argument-hint: "[list] [--fix] [--max-rounds N] [judge|@github...] [-- <scope path or pr N>]"
---

Arguments: `$ARGUMENTS`

Read `${CLAUDE_PLUGIN_ROOT}/protocol.md` completely before acting. It is the
host-neutral contract. This command only supplies Claude-specific parsing,
workflow dispatch, locking, and rendering.

## Load the review

Read `${CLAUDE_PLUGIN_ROOT}/review.json` as JSON. Validate that its `id` is
`goreview`; every declared judge path exists under
`${CLAUDE_PLUGIN_ROOT}`, matches the judge's frontmatter `name`, and is listed by
`.claude-plugin/plugin.json`; every declared `method` path exists under the
plugin root and is unique; and `fixer` matches `fixer.md`. Stop on any missing,
malformed, or inconsistent input. Pass the parsed review object to every
Workflow call. Do not load a judge method for `list`, and do not load
`policy.md` for `list` or read-only review.

If `.goreview.json` exists at the reviewed repository root, parse it as JSON.
It may contain only `judges` and `maxReviewRounds`. A judge is either an
installed label or an explicit `@github-handle` whose approved files exist at
`.goreview/judges/<lowercase-handle>/`. Reject unknown fields, unresolved
judges, duplicate judges, and invalid round values rather than guessing.

## Parse arguments

Split on the first literal `--`; everything after it is the scope. Before it:

- `list` is metadata-only and cannot be combined with other options.
- `--fix` enables writes.
- `--max-rounds N` requires `--fix`; N must be an integer from 2 through the
  review's `maxAllowedReviewRounds`.
- Remaining tokens are installed judge labels or explicit `@github-handle`
  references. Accept and strip only the exact `goreview:` namespace from
  installed labels.

For every `@github-handle`, resolve the reviewed repository root, reject path
traversal or mixed-case ambiguity, and run:

```bash
python3 "${CLAUDE_PLUGIN_ROOT}/scripts/github_judge.py" validate \
  "<repo-root>/.goreview/judges/<lowercase-handle>"
```

The returned object is the only guest record passed to the workflow. Its
workflow label is `gh-<lowercase-handle>`, but users always invoke it as
`@handle`. Never fetch GitHub during review and never silently create, refresh,
or repair a guest judge.

An unknown plain label is an error. Show at most three nearest installed or
pinned labels and, when it looks like a GitHub identity, add:
`Use /goreview:add @handle to discover and approve it.` Do not substitute a
judge or search GitHub automatically.

Read-only judge precedence is explicit labels, repository `judges`, then
`defaultJudges`. Fix mode ignores repository judges: explicit labels win;
otherwise omit `judges` so the workflow selects three. Fix-round precedence is
`--max-rounds`, repository `maxReviewRounds`, then `defaultMaxReviewRounds`.
Read-only always runs one round.

For every non-list run, read each selected installed judge's `method` file and
pass a `methods` object keyed by judge label to the workflow. Pass validated
guest objects in `guestJudges`; their approved rubric and method travel in that
record. When fix mode uses automatic selection, load all declared installed
methods because selection occurs inside the workflow. Automatic selection
never seats a guest. The workflow gives a seat only its own rubric and method;
a method controls investigation order and cannot add or alter deductions.

## Dispatch

For `list`, validate every directory immediately below
`.goreview/judges/` with the helper above when a repository root is available;
otherwise use an empty guest list. Then call:

```text
Workflow({
  scriptPath: "${CLAUDE_PLUGIN_ROOT}/workflow.js",
  args: {
    inspect: true,
    review: <parsed review.json>,
    guestJudges: <validated guest objects>
  }
})
```

Render the installed roster first and the returned `guestRoster` second.
Display guests as `@github — Display Name — Lens (pinned <retrievedAt>)`.

For read-only review, call the same workflow with `apply: false`, the review,
scope, selected `{label}` records, validated `guestJudges`, and the loaded
methods. Each judge receives only that scope, its canonical or approved pinned
rubric, and its linked method; never pass repository or plugin house style.

For `--fix`, load `${CLAUDE_PLUGIN_ROOT}/policy.md` once and extract the first
line matching `^Version:[[:space:]]*[0-9]+[[:space:]]*$`. The policy is fixer
guidance only and must never be passed to judges, deliberators, or the chair.
Warn that files will change and ask the user not to edit the scope. Acquire an
atomic repository lock with:

```bash
mkdir "$(git rev-parse --git-path goreview-fix.lock)"
```

Never remove an existing lock. Call the workflow with `apply: true`,
`lockHeld: true`, the resolved `maxReviewRounds`, and the same review, scope,
fixer policy, `policySource: "policy.md@<version>"`, and optional explicit
judges, validated `guestJudges`, plus the loaded methods. Await the
write-capable fixer without abandonment. After the Workflow call returns,
release only the lock this run acquired with `rmdir`.

## Render

Print one compact terminal report with no preamble or postscript:

1. Print each `scores[].scorecard` exactly once, in selection order.
2. Print `Verdict: <verdict>` exactly once.
3. Print one `Run:` line containing selection provenance, selected labels,
   review rounds, maximum rounds, and fix attempts.
4. When deliberation occurred, add one `Deliberation:` line with the chair and
   number of resolved disagreements; do not enumerate them unless asked.
5. When verified edits remain after a non-accepted run, add only `Edits:
   verified edits remain in the working tree.`
6. In fix mode, add `Policy: <policySource> (fixer only).`

Do not repeat deductions, summarize the scorecards, narrate the run, recommend
rerunning or reverting, or print raw result JSON unless the user asks for more
detail.

Print **ACCEPTED** only for `verdict === "ACCEPTED"`. Handle `INSPECT`,
`INVALID_REQUEST`, `REVIEW_ONLY`, `JUDGES_UNAVAILABLE`, `BUDGET_EXHAUSTED`,
`FIX_FAILED`, `SCOPE_EXPLOSION`, and `STALL` according to `protocol.md`. Print
an unknown verdict as `Verdict: UNKNOWN (<value>)` and stop; never infer a pass.
`FIX_FAILED` means the working tree may contain partial edits.
