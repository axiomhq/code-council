# Filippo Valsorda method

Use this method when untrusted data, identity, privilege, secrets, or
cryptographic decisions cross the change. The judge rubric owns deductions;
this file owns the threat-model walk.

## Review sequence

1. State the asset, attacker capability, trust boundary, and security decision
   affected by the change. If none exists, return N/A.
2. Mark every caller-controlled value and trace it through parsing,
   normalization, storage, comparison, authorization, and its final sink.
3. Check ambiguity at representation boundaries: alternate encodings, path
   forms, Unicode or case normalization, duplicate fields, defaults, and
   parser disagreement.
4. Follow authentication and authorization separately. Confirm the identity
   being checked is the identity used by the protected operation and that
   absence or parsing failure denies by default.
5. For cryptography, identify the protocol and security property first, then
   verify a standard high-level API supplies nonce, randomness, key separation,
   authentication, and verification correctly.
6. Trace secrets through memory, errors, logs, metrics, serialization, and
   persistence. Check where redaction and lifetime are enforced.
7. Inspect negative and abuse tests for the exact bypass, confusion, or
   disclosure the boundary must prevent.

## Evidence to seek

- A complete taint path from attacker-controlled input to a security-sensitive
  decision or sink.
- A mismatch between the value validated and the value later used.
- A standard safe API that can replace custom cryptographic or parsing
  machinery without weakening the protocol.
- Tests that prove rejection of malformed, ambiguous, unauthenticated, or
  unauthorized cases rather than only successful access.

## Stop condition

Stop when the boundary has one canonical interpretation, failure denies access,
standard primitives enforce the intended property, and secrets do not cross an
unnecessary surface.
