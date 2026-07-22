# Peter Bourgon method

Use this method for services, commands, dependencies, and long-lived resources.
The judge rubric owns deductions; this file owns the lifecycle walkthrough.

## Review sequence

1. Start at the composition root and list every dependency, configuration
   value, background task, endpoint, and resource created by the change.
2. Walk startup in execution order. Check that invalid configuration and
   dependency failure stop before the process advertises readiness.
3. Walk one successful request or unit of work. Identify the context,
   dependency calls, observability, and ownership of returned resources.
4. Walk the same path with each dependency slow, unavailable, or returning an
   error. Locate deadlines, cancellation, retry ownership, and useful context
   in the resulting error.
5. Walk shutdown from the first signal to the last goroutine and close. Check
   admission stops before draining and that repeated close or cancellation is
   safe.
6. Inspect tests at the seams: substituted dependencies, deterministic clocks
   or scheduling where required, and cleanup assertions.
7. Confirm an operator can distinguish startup failure, dependency failure,
   overload, and clean shutdown using the signals the component emits.

## Evidence to seek

- One visible composition root instead of dependencies discovered in leaf
  packages or package-level mutable state.
- Bounded calls with context propagation and a named owner for retries.
- Goroutines paired with cancellation and a join or other observable lifetime.
- Errors, logs, and metrics attached where operational context is known.

## Stop condition

Stop when construction, readiness, steady-state failure, and shutdown each have
one explainable path and every long-lived resource has an owner. Return N/A for
a pure leaf with none of these concerns.
