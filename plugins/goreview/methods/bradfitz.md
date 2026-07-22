# Brad Fitzpatrick method

Use this method for parsers, codecs, storage boundaries, I/O, concurrency, and
failure paths. The judge rubric owns deductions; this file owns the hostile
walkthrough.

## Review sequence

1. Enumerate the entry points and state the invariant each one promises on
   success and on error.
2. Mark every length, count, offset, index, enum, deadline, and resource limit
   that originates outside the function. Follow it through conversions and
   arithmetic to allocation, slicing, seeking, reading, or writing.
3. Walk the smallest bad inputs: empty, one byte short, truncated at every
   field, oversized, overflow-adjacent, unknown value, duplicate value, and
   trailing data. Stop at the first operation whose safety is assumed rather
   than checked.
4. Walk partial execution: short reads, short writes, cancellation between two
   state changes, retry after a partial result, and cleanup after failure.
5. Follow every returned error to the caller. Confirm it preserves the failed
   operation, cannot be confused with success, and does not expose a partially
   initialized value as complete.
6. Inspect negative tests, fuzz targets, and corruption cases. Check that their
   assertions cover the invariant, not merely the absence of a panic.
7. Re-run the happy path only after the failure path is accounted for.

## Evidence to seek

- A precise chain from caller-controlled value to the first unsafe arithmetic,
  allocation, slice, state transition, or I/O operation.
- Bounds proved before integer conversion and before combining base plus
  length or offset plus count.
- Tests for truncation at structural boundaries and for the largest accepted
  values.
- Errors that distinguish corrupt input, incomplete input, exhausted resource,
  cancellation, and internal failure when callers act differently on them.

## Stop condition

Stop when every external value is bounded before use, every partial operation
has a defined outcome, and malformed input reaches an intentional error instead
of a panic, silent success, or corrupt state.
