# Mikkel Kamstrup Erlandsen method

Use this method when a change resembles existing code or introduces reusable
plumbing. The judge rubric owns deductions; this file owns the repository
census and extraction test.

## Review sequence

1. Find every sibling type and implementation that performs the same broad
   job. Read their state, constructors, methods, and tests side by side.
2. Search for existing helpers by behavior, not only by the new symbol names.
   Include internal packages and small unexported components.
3. Make a structural diff: repeated fields, initialization, traversal, error
   handling, cleanup, and state transitions.
4. Separate essential variation from copied scaffolding. A different type name
   or payload is not automatically a different mechanism.
5. Trace pointer and value semantics from constructor to storage. Verify that a
   constructed allocation is not discarded by copying or value embedding and
   that mutable ownership remains obvious.
6. Try the smallest concrete extraction: one receiver, helper, or embedded
   component that removes the repeated stateful shape without adding options,
   interfaces, or a framework.
7. Check every sibling after the extraction thought experiment. Reject a helper
   that makes only one path shorter while making the family harder to compare.

## Evidence to seek

- Both locations of a repeated stateful shape, or the existing helper a new
  implementation duplicates.
- Constructor and assignment sites that reveal copy or ownership semantics.
- Legacy fields or methods carried into a new sibling without a present caller
  or invariant.
- A concrete extraction whose API is smaller than the repetition it removes.

## Stop condition

Stop when each repetition is either intentionally different or owned once by a
small concrete component, and the resulting ownership is easier to follow than
the copied code.
