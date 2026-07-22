# Example scorecard

This example illustrates GoLegends' engine-rendered output shape. The judge
reports its score first and the cited deductions second; the engine verifies the
arithmetic and supplies identity, verdict, and formatting.

```text
ROB PIKE — Simplicity: 7/10 — FAIL
−2  sparse.go:set.ForEach — the wrapper creates two ways to iterate one set
−1  sparse.go:set.add — Has followed by Add performs two lookups
Top fix: collapse the wrapper and use the underlying set API directly
```

The cited deductions total three points, producing `10 − 3 = 7`. The engine
rejects any judge response whose reported score does not match that calculation.
Unverified observations remain in structured results but do not appear in the
compact scorecard or drive an automatic fix.
