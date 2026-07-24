'use strict'

const tasks = [
  {
    id: 'simplicity-factory',
    title: 'Single-use interface and factory',
    judge: 'robpike',
    expectedRuleIds: ['simplicity.unnecessary-indirection'],
    signals: ['single-use interface', 'unnecessary indirection', 'factory'],
    prompt: 'Review the current Go diff. Focus on whether the added abstraction earns its cost.',
    baseFiles: {
      'go.mod': 'module example.com/bench\n\ngo 1.22\n',
      'worker.go': `package bench

type worker struct{}

func (worker) Run() string { return "ok" }

func Run() string {
\treturn worker{}.Run()
}
`,
      'worker_test.go': `package bench

import "testing"

func TestRun(t *testing.T) {
\tif got := Run(); got != "ok" {
\t\tt.Fatalf("Run() = %q", got)
\t}
}
`,
    },
    changedFiles: {
      'worker.go': `package bench

type runner interface {
\tRun() string
}

type worker struct{}

func (worker) Run() string { return "ok" }

func newRunner() runner {
\treturn worker{}
}

func Run() string {
\treturn newRunner().Run()
}
`,
    },
    fixedFiles: {
      'worker.go': `package bench

type worker struct{}

func (worker) Run() string { return "ok" }

func Run() string {
\treturn worker{}.Run()
}
`,
    },
    forbiddenAfterFix: ['type runner interface', 'func newRunner'],
  },
  {
    id: 'input-length',
    title: 'Unbounded length-prefixed allocation',
    judge: 'bradfitz',
    expectedRuleIds: ['input.unchecked-length'],
    signals: ['unchecked length', 'unbounded allocation', 'length prefix', 'memory exhaustion'],
    prompt: 'Review the current Go diff. Focus on hostile or malformed length-prefixed input.',
    baseFiles: {
      'go.mod': 'module example.com/bench\n\ngo 1.22\n',
      'decoder.go': `package bench

import (
\t"encoding/binary"
\t"fmt"
\t"io"
)

const maxFrame = 1 << 20

func Decode(r io.Reader) ([]byte, error) {
\tvar n uint32
\tif err := binary.Read(r, binary.BigEndian, &n); err != nil {
\t\treturn nil, fmt.Errorf("read frame length: %w", err)
\t}
\tif n > maxFrame {
\t\treturn nil, fmt.Errorf("frame too large: %d", n)
\t}
\tbuf := make([]byte, int(n))
\tif _, err := io.ReadFull(r, buf); err != nil {
\t\treturn nil, fmt.Errorf("read frame: %w", err)
\t}
\treturn buf, nil
}
`,
      'decoder_test.go': `package bench

import (
\t"bytes"
\t"encoding/binary"
\t"testing"
)

func TestDecodeRejectsOversizedFrame(t *testing.T) {
\tvar input bytes.Buffer
\tif err := binary.Write(&input, binary.BigEndian, uint32(maxFrame+1)); err != nil {
\t\tt.Fatal(err)
\t}
\tif _, err := Decode(&input); err == nil {
\t\tt.Fatal("Decode accepted an oversized frame")
\t}
}
`,
    },
    changedFiles: {
      'decoder.go': `package bench

import (
\t"encoding/binary"
\t"fmt"
\t"io"
)

const maxFrame = 1 << 20

func Decode(r io.Reader) ([]byte, error) {
\tvar n uint32
\tif err := binary.Read(r, binary.BigEndian, &n); err != nil {
\t\treturn nil, fmt.Errorf("read frame length: %w", err)
\t}
\tbuf := make([]byte, int(n))
\tif _, err := io.ReadFull(r, buf); err != nil {
\t\treturn nil, fmt.Errorf("read frame: %w", err)
\t}
\treturn buf, nil
}
`,
    },
    fixedFiles: {
      'decoder.go': `package bench

import (
\t"encoding/binary"
\t"fmt"
\t"io"
)

const maxFrame = 1 << 20

func Decode(r io.Reader) ([]byte, error) {
\tvar n uint32
\tif err := binary.Read(r, binary.BigEndian, &n); err != nil {
\t\treturn nil, fmt.Errorf("read frame length: %w", err)
\t}
\tif n > maxFrame {
\t\treturn nil, fmt.Errorf("frame too large: %d", n)
\t}
\tbuf := make([]byte, int(n))
\tif _, err := io.ReadFull(r, buf); err != nil {
\t\treturn nil, fmt.Errorf("read frame: %w", err)
\t}
\treturn buf, nil
}
`,
    },
    forbiddenAfterFix: [],
  },
  {
    id: 'lean-normalize',
    title: 'Small direct normalization helper',
    judge: 'robpike',
    expectedRuleIds: [],
    signals: [],
    prompt: 'Review the current Go diff. Do not invent a problem when the direct change is sound.',
    baseFiles: {
      'go.mod': 'module example.com/bench\n\ngo 1.22\n',
      'normalize.go': `package bench

import "strings"

func Normalize(s string) string {
\treturn strings.ToLower(s)
}
`,
      'normalize_test.go': `package bench

import "testing"

func TestNormalize(t *testing.T) {
\tif got := Normalize("  Go  "); got != "go" {
\t\tt.Fatalf("Normalize() = %q", got)
\t}
}
`,
    },
    changedFiles: {
      'normalize.go': `package bench

import "strings"

func Normalize(s string) string {
\treturn strings.TrimSpace(strings.ToLower(s))
}
`,
    },
    fixedFiles: {},
    forbiddenAfterFix: [],
  },
]

module.exports = { tasks }
