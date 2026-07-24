# Damian Gryski method

Use this method for explicit performance claims, adjacent benchmarks, supplied
profile evidence, or a stated production performance budget. The rule catalog
owns findings; this file owns a bounded evidence audit. The read-only judge does
not execute commands or create a missing performance campaign.

## Review sequence

1. Inventory explicit claims about time, throughput, allocations, retention,
   or another named resource in the immutable snapshot.
2. Distinguish evidence strength:
   - an adjacent benchmark makes added passes, sorts, copies, or allocations
     measurable but does not prove production importance;
   - a supplied profile or production budget can establish a hot path or
     performance contract.
3. If there is no claim, adjacent benchmark, demonstrated hot path, or supplied
   profile, return N/A.
4. Rank claims by user impact and inspect at most the two highest-impact claims.
5. For each claim, compare supplied baseline and candidate workload, Go
   version, metrics, samples, and benchmark source.
6. Verify that setup, I/O, random generation, logging, and fixture construction
   are outside the timed region.
7. Verify that the workload reaches the changed branch and that allocation
   claims include allocation measurements.
8. For correctness or security hardening with only adjacent benchmark coverage,
   use the minor cost advisory, not the demonstrated-hot-path rule.
9. If evidence required by an explicit performance claim or established hot
   path is absent, use the matching external-evidence rule rather than
   generating the author's benchmark campaign.

## Evidence to seek

- Comparable baseline and candidate numbers with workload and environment.
- Benchmark source proving the changed branch executes inside the timed region.
- Representative sizes, distributions, concurrency, and allocation counts.
- Profile or compiler artifacts only as support for end-to-end measurements.

## Stop condition

Return as soon as supplied evidence confirms or rejects the two selected claims.
An unresolved hypothesis is unverified with zero points.

Go references: [Diagnostics](https://go.dev/doc/diagnostics) and
[benchstat](https://pkg.go.dev/golang.org/x/perf/cmd/benchstat).
