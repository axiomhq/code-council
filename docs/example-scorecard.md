# Example scorecard

This example illustrates GoLegends' engine-rendered output shape. The judge
reports its score first and the cited deductions second; the engine verifies
the rule, severity, primary excerpt, and arithmetic before supplying identity,
verdict, and formatting.

```text
ROB PIKE — Simplicity: 7/10 — FAIL
−3 MAJOR  sparse.go:41:set.ForEach — the wrapper creates two ways to iterate one set
Top fix: collapse the wrapper and use the underlying set API directly
```

The cited major deduction costs three points, producing `10 − 3 = 7`, and major
severity fails independently of the numerical threshold. The engine rejects
unauthorized rules, severity changes, mismatched excerpts, and score mismatch.
Unverified observations remain in structured results but do not appear in the
compact scorecard or drive an automatic fix.
