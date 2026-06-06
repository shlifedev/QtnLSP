// Tests for the pure parseErrors -> LSP Diagnostic[] conversion and for
// surfacing lexer-level unterminated string/comment errors as parse errors.

import { describe, it, expect } from 'vitest';
import { DiagnosticSeverity } from 'vscode-languageserver';
import { diagnosticsForDocument, DIAGNOSTIC_SOURCE } from '../diagnostics.js';
import { parse } from '../parser.js';
import type { QtnDocument } from '../ast.js';

function docWith(parseErrors: QtnDocument['parseErrors']): QtnDocument {
  return { uri: 'test://doc.qtn', version: 0, definitions: [], parseErrors };
}

describe('diagnosticsForDocument', () => {
  it('returns an empty array when there are no parse errors', () => {
    expect(diagnosticsForDocument(docWith([]))).toEqual([]);
  });

  it('maps each parse error to an Error-severity diagnostic with source qtn', () => {
    const range = { start: { line: 2, character: 4 }, end: { line: 2, character: 9 } };
    const diagnostics = diagnosticsForDocument(docWith([{ message: 'boom', range }]));

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]).toMatchObject({
      severity: DiagnosticSeverity.Error,
      message: 'boom',
      source: DIAGNOSTIC_SOURCE,
      range,
    });
  });

  it('preserves order and count for multiple errors', () => {
    const r = { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } };
    const diagnostics = diagnosticsForDocument(
      docWith([
        { message: 'first', range: r },
        { message: 'second', range: r },
      ]),
    );
    expect(diagnostics.map((d) => d.message)).toEqual(['first', 'second']);
  });

  it('produces diagnostics end-to-end from a real parse with a syntax error', () => {
    const doc = parse('struct Foo {', 'test://incomplete.qtn');
    const diagnostics = diagnosticsForDocument(doc);
    expect(diagnostics.length).toBeGreaterThan(0);
    expect(diagnostics.every((d) => d.severity === DiagnosticSeverity.Error)).toBe(true);
    expect(diagnostics.every((d) => d.source === DIAGNOSTIC_SOURCE)).toBe(true);
  });
});

describe('lexer-level errors surface in parseErrors', () => {
  it('reports an unterminated string literal', () => {
    const doc = parse('struct Foo { } [Header("oops]', 'test://unterminated-string.qtn');
    expect(
      doc.parseErrors.some((e) => /unterminated string/i.test(e.message)),
    ).toBe(true);
  });

  it('reports an unterminated block comment', () => {
    const doc = parse('/* never closed\nstruct Foo { }', 'test://unterminated-comment.qtn');
    expect(
      doc.parseErrors.some((e) => /unterminated block comment/i.test(e.message)),
    ).toBe(true);
  });

  it('does not report unterminated errors for well-formed input', () => {
    const doc = parse('/* fine */ struct Foo { FP x; } // "quoted"', 'test://clean.qtn');
    expect(doc.parseErrors.some((e) => /unterminated/i.test(e.message))).toBe(false);
  });
});
