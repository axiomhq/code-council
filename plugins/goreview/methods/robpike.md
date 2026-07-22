# Rob Pike method

Use this method to make the simplicity lens reproducible. The judge rubric
owns deductions; this file owns the order of investigation.

## Review sequence

1. Write a concept ledger: every new type, interface, option, helper, state,
   callback, and control-flow mechanism introduced by the change.
2. Trace the main data path from input to result without leaving the changed
   package. Mark every jump through an interface, callback, registry, global,
   or reflection boundary.
3. Read one representative caller and one representative test. Decide whether
   their plain-language description matches what the implementation actually
   does.
4. Search the repository for the same operation. Prefer the existing direct
   path when the new path merely adds another vocabulary for it.
5. Run the deletion test: remove each new concept mentally and replace it with
   concrete code at the call site. Keep the concept only when the replacement
   loses real behavior or makes the data flow harder to see.
6. Run the one-file test: identify the smallest set of files a maintainer must
   read to explain the behavior. Treat avoidable cross-file control flow as
   complexity, not organization.
7. Name the smallest honest shape of the change before considering a
   deduction.

## Evidence to seek

- Concrete callers showing whether an abstraction has one real implementation
  or several demonstrated uses.
- A before-and-after concept count tied to named symbols.
- Hidden control flow visible in registration, initialization, global state,
  callbacks, or runtime type dispatch.
- Code that can be deleted while preserving the behavior requested by tests
  and callers.

## Stop condition

Stop when the main behavior can be explained as a short, explicit data flow and
every remaining concept pays for behavior that exists now. Do not request a
framework merely to make the code look uniform.
