# Example scorecard

This example illustrates GoLegends' engine-rendered output shape. The judge returns
structured deductions; the engine supplies identity, arithmetic, verdict, and
formatting.

```text
ROB PIKE — Simplicity: 7/10
Deductions:
  −2  sparse.go:set.ForEach — the wrapper creates two ways to iterate one set;
      change: embed the underlying set and delete the forwarding method  [cited]
  −1  sparse.go:set.add — Has followed by Add performs two lookups;
      change: return Add directly  [cited]
  UNVERIFIED  sparse.go:UnmarshalBinary — nil safety may depend on evaluation
      order; verify: add a direct nil-receiver test before treating this as a
      finding
Verdict: FAIL
If FAIL: collapse the wrapper and use the underlying set API directly
```

The cited deductions total three points, producing `10 − 3 = 7`. The
unverified observation is visible but contributes zero points and cannot drive
an automatic fix.
