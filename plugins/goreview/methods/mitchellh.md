# Mitchell Hashimoto method

Use this method for package seams, component construction, dependencies, and
extension points. The judge rubric owns deductions; this file owns the boundary
walk.

## Review sequence

1. Draw the component graph from the composition root: constructors, owned
   resources, dependencies, callbacks, and shutdown edges.
2. Label every edge with who creates, configures, starts, closes, cancels, and
   replaces the value that crosses it.
3. Separate policy from mechanism. Move caller choices such as timeouts,
   retries, naming, and tuning to the edge where the caller has the context to
   choose them.
4. Follow each abstraction down one layer until its concrete mechanism is
   visible. Check whether the boundary hides complexity or merely makes it
   harder to find.
5. Test a real second consumer on paper using an existing sibling, command, or
   test. List every application-specific package or global it would have to
   import.
6. Inspect extension points from the outside: can a new implementation be
   supplied without editing the core, type-asserting back to a concrete type,
   or adopting an internal representation?
7. Prefer the smallest boundary that makes ownership and replacement explicit.

## Evidence to seek

- Constructor and cleanup call sites that prove resource ownership.
- Imports or exported types that leak application or transport details across
  the proposed seam.
- A demonstrated second consumer, not a hypothetical demand for flexibility.
- Policy values fixed below the layer that has enough information to choose
  them.

## Stop condition

Stop when construction and lifetime can be followed from one composition edge,
the core has no accidental application dependency, and extension does not
require modification of that core.
