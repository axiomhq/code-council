# Dmitry Vyukov method

Use this method when the change affects local concurrency. The rule catalog
owns findings; this file owns the happens-before investigation.

## Review sequence

1. Inventory goroutines created or affected by the change.
2. Inventory every value accessed by more than one of those goroutines.
3. For each write, identify the mutex, atomic operation, channel operation, or
   lifecycle edge that orders every conflicting access.
4. Trace channel creation, senders, receivers, and the sole close owner.
5. Trace every goroutine to normal completion, error, cancellation, and early
   consumer exit.
6. Inspect copied structs for mutexes, atomics, `sync.Once`, and WaitGroups.
7. Inspect focused `-race` evidence supplied with the change; do not claim that
   an unexercised path is safe merely because a race run passed.

## Evidence to seek

- Both accesses participating in a race and the missing ordering edge.
- Channel send and close sites plus the owner responsible for ordering them.
- Goroutine creation and the blocking path that can outlive its owner.
- Lock acquisition sites and the state invariant the lock protects.

## Stop condition

Stop when every shared write has a demonstrable happens-before relationship,
every channel has one close owner, and every goroutine has a bounded lifetime.
