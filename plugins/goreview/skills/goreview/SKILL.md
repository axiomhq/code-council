---
name: goreview
description: Run GoLegends' named Go judges for independent, cited deduction reviews of a working-tree diff, path, branch, or PR. Use for Go code review, named judges such as robpike/bradfitz/rsc, listing available judges, or an explicitly requested --fix run with deliberation, guarded edits, verification, and configurable re-review rounds.
---

# GoLegends

Read `../../protocol.md` and `../../review.json` completely before every run.
They own behavior and configuration; do not restate or relax them here. Do not
load `../../policy.md` for list or read-only review.

Interpret requests as:

```text
$goreview [list]
$goreview [judge...] [-- scope]
$goreview --fix [--max-rounds N] [judge...] [-- scope]
```

Load optional repository configuration from `.goreview.json` exactly as
specified by the protocol. Reject malformed configuration, unknown judges, and
invalid round values. Read every selected canonical judge file from the path in
`review.json`, then read that judge's linked `method` file. The rubric controls
deductions; the method controls investigation order. Do not load unselected
methods.

For review, spawn one read-only subagent per selected judge in parallel. Give
each the same scope plus its full canonical rubric and linked method, and no
house style or fixer policy. Require a structured result
with `applicable`, `summary`, `deductions`, and `topFix`. Every deduction has
`points`, `location`, `explanation`, `evidence`, and `change`. Calculate the
score and render the scorecard exactly as required by `protocol.md`; never let a
judge self-report its score or identity. Wait for every result and fail closed
on a missing or malformed response.

Enter fix mode only when explicitly requested. Warn before editing, acquire the
protocol's repository lock, and use one writer. Load `../../policy.md` only for
that writer; it guides implementation of the chaired plan but cannot add
findings or affect judge scores. Run the complete deliberation, chair, fix,
verification, and re-review sequence for at most the resolved `maxReviewRounds`
count. The final allowed round never edits. Always release a lock acquired by
this run after the writer returns; leave it in place if the writer never
returns.

Print each rendered scorecard once, then one overall verdict and one compact
run line with selected labels, selection provenance, review rounds, maximum,
and fix attempts. If deliberation occurred, report only its chair and resolved
disagreement count. If verified edits remain after a non-accepted run, say so
in one line. In fix mode, report fixer-policy provenance in one line. Do not
repeat findings, add a narrative postmortem, recommend next actions, or dump
raw result JSON unless asked. Never claim that a named judge personally
participated in or endorsed the review.
