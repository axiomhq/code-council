# Damian Gryski method

Use this method for explicit performance claims or changes to a demonstrated
hot path. The judge rubric owns deductions; this file owns the measurement
campaign.

## Review sequence

1. State the claim as a metric, workload, and expected direction: time,
   throughput, allocations, bytes retained, or another named resource.
2. Pin correctness before timing. Identify a reference implementation, exact
   output, property, or invariant that proves the candidate preserves behavior.
3. Confirm the benchmark or profile exercises the changed path with realistic
   input sizes, distributions, concurrency, and setup costs.
4. Establish a baseline from the closest unchanged revision under the same Go
   version, machine, benchmark binary shape, and load conditions.
5. Form one mechanism-level hypothesis from a profile or resource count. Name
   the function and the cost expected to move before reading the comparison.
6. Compare repeated before/after samples and the relevant metrics. Prefer a
   statistical A/B comparison such as `benchstat`; do not infer a win from one
   run or from source shape.
7. Audit compiler behavior only when it tests the hypothesis: escape analysis,
   bounds-check diagnostics, inlining, or disassembly are supporting evidence,
   never the result.
8. Check adjacent workload shapes for regressions and keep the change only when
   the measured win justifies its added complexity.

## Evidence to seek

- Existing bounded commands such as `go test -run=^$ -bench=<name> -benchmem
  -count=<N>` whose results can be compared without installing tools or changing
  the repository.
- Raw before/after samples, benchmark metadata, and a comparison that reports
  uncertainty rather than only the fastest number.
- CPU, heap, allocation, mutex, or block profiles that name the actual cost
  center when the claim is broader than a microbenchmark.
- A correctness test shared by baseline and candidate.

## Stop condition

Stop when the claim is confirmed or rejected by representative repeated
measurement and the mechanism agrees with the evidence. Return N/A when there
is no performance claim and no demonstrated hot path; do not manufacture a
campaign for ordinary code.

Go references: [Diagnostics](https://go.dev/doc/diagnostics),
[benchstat](https://pkg.go.dev/golang.org/x/perf/cmd/benchstat), and
[profile-guided optimization](https://go.dev/doc/pgo).
