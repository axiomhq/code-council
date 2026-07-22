# Russ Cox method

Use this method when a change creates or alters something other code or stored
data must depend on. The judge rubric owns deductions; this file owns the
contract analysis.

## Review sequence

1. Inventory the contracts: exported functions and types, interfaces, command
   behavior, configuration, wire formats, disk formats, ordering, and error
   semantics.
2. For each changed contract, write one sentence describing what callers can
   rely on today. Separate that promise from incidental implementation detail.
3. Build the compatibility matrix that applies: old caller/new library,
   new caller/old library, old writer/new reader, new writer/old reader, and
   mixed-version processes.
4. Trace unknown fields, missing fields, zero values, version markers,
   ordering, and defaults. Verify that one deterministic rule decides each.
5. Search for every consumer and persisted sample. Check whether a local edit
   has silently changed behavior at a distant boundary.
6. Identify the next plausible evolution and ask whether it can be added
   without reinterpreting existing data or breaking existing callers.
7. Confirm the tests pin the promise rather than the current implementation.

## Evidence to seek

- A named public or persisted contract and the exact old/new behavior.
- Compatibility tests or fixtures that cross versions, not only round-trip the
  same implementation against itself.
- Deterministic ordering where output can be compared, hashed, cached, or
  persisted.
- Explicit ownership of defaulting and version selection rather than ambient
  global or build-time state.

## Stop condition

Stop when the current promise is clear, old and new participants have defined
behavior, and the next extension has somewhere unambiguous to go. Return N/A
when no external or persisted contract changed.
