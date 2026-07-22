# Armon Dadgar method

Use this method when correctness spans processes, nodes, time, or durable state.
The judge rubric owns deductions; this file owns the invariant and interleaving
analysis.

## Review sequence

1. Name the actors, durable records, messages, clocks, leases, and external
   side effects involved in the change.
2. Write the safety invariant before reading the happy path: what must never be
   true even during failure?
3. Derive the state machine. List states, transitions, the authority for each
   transition, and which state is durable before an external effect occurs.
4. Replay the operation with message loss, duplication, reordering, delay,
   process restart, stale reads, partition, and clock movement where relevant.
5. Crash after every durable write and every external side effect. Determine
   what retry or recovery observes and whether the effect is lost or repeated.
6. Inspect fencing, compare-and-swap, epochs, idempotency keys, deduplication,
   quorum rules, and lease expiry as mechanisms that prove the invariant—not
   as labels that imply it.
7. Separate safety from liveness. A path that avoids corruption by waiting
   forever still needs a bounded recovery story.

## Evidence to seek

- A concrete interleaving, with named states and operations, that violates or
  preserves the invariant.
- Durable ordering around irreversible or externally visible effects.
- Monotonic epochs or fencing tokens where an old leader or worker can resume.
- Tests that control scheduling, restart, duplication, or stale observations
  instead of relying on timing luck.

## Stop condition

Stop when the invariant survives every relevant single failure and retry has a
defined effect. Return N/A when the change never crosses a process, persistence,
or coordination boundary.
