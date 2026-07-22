# Tomás Senart method

Use this method for serving paths, queues, pools, fan-out, and work proportional
to caller-controlled input. The judge rubric owns deductions; this file owns
the overload model.

## Review sequence

1. Name the unit of offered work and trace it through admission, queues,
   concurrency limits, dependencies, and completion.
2. Inventory every finite resource it consumes: goroutines, memory, buffers,
   connections, file descriptors, CPU, locks, and downstream capacity.
3. Express the amplification factor: work, allocations, retries, fan-out, and
   retained memory per admitted unit and per worst-case input.
4. Find every queue and wait. Record its bound, timeout, cancellation path, and
   behavior when full.
5. Increase offered load past capacity on paper. Check whether the system
   rejects early, blocks callers, sheds optional work, or keeps accepting until
   latency and memory diverge.
6. Follow retries across layers. Confirm one layer owns the retry budget and
   that attempts cannot multiply across fan-out or downstream failure.
7. Inspect load evidence across concurrency levels and input shapes, including
   tail latency and the resource that saturates first.

## Evidence to seek

- The exact unbounded queue, goroutine creation site, input-sized allocation,
  or retry loop on the request path.
- A concurrency or capacity limit paired with explicit full behavior.
- Benchmarks or load tests that hold offered load constant and report more than
  average latency.
- Cancellation reaching blocked work and downstream calls after the caller no
  longer needs the result.

## Stop condition

Stop when the first saturation resource is named, admitted work is bounded by
its capacity, and overload degrades through an explicit policy rather than
accumulating hidden work. Return N/A when no load-sensitive path changed.
