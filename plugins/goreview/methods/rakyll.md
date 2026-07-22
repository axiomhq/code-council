# Jaana Dogan method

Use this method for long-lived Go processes whose behavior must be understood
under production traffic. The judge rubric owns deductions; this file owns the
diagnostic thought process.

## Review sequence

1. Name the production question the changed code would force an operator to
   answer: where CPU goes, why latency grew, what retains memory, where work is
   blocked, or which request caused a failure.
2. Trace one unit of work across goroutines, queues, timers, RPCs, and storage.
   Record where its context, identity, and causal labels are preserved or lost.
3. Choose the runtime view that could answer the question: CPU or heap profile,
   allocation profile, goroutine dump, block or mutex profile, execution trace,
   runtime metrics, or request trace.
4. Imagine that view at the failure point. Check whether stack frames, labels,
   names, and boundaries identify the operation or collapse unrelated work into
   an anonymous helper or goroutine.
5. Inspect long waits and long-lived goroutines for context cancellation,
   bounded lifetime, and visibility in dumps or traces.
6. Separate diagnosis from instrumentation volume. Prefer stable labels and
   bounded cardinality that answer a question over logging every internal
   event.
7. Require profile or trace evidence before accepting a performance diagnosis;
   code shape alone may suggest the next measurement, not the bottleneck.

## Evidence to seek

- A concrete production question that current profiles, traces, metrics, or
  errors cannot answer because information is lost at a named boundary.
- Goroutine creation tied to cancellation, ownership, and an observable name or
  stack path.
- Diagnostic endpoints or capture hooks that remain available without exposing
  them beyond the intended operational boundary.
- Existing profile or trace evidence that supports a claimed bottleneck.

## Stop condition

Stop when an operator can choose one appropriate runtime view and follow a unit
of work to the responsible code without guessing. Return N/A for code that
cannot run in a long-lived or serving process.

Go references: [Diagnostics](https://go.dev/doc/diagnostics) and the
[data race detector](https://go.dev/doc/articles/race_detector).
