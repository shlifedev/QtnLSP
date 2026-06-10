// Tests for the context-aware completion handler.
// Each case forces a specific completion context via cursor position and
// asserts the returned labels match the source-of-truth keyword/type lists.

import { describe, it, expect } from 'vitest';
import { handleCompletion } from '../completion.js';
import {
  TOP_LEVEL_KEYWORDS,
  IMPORT_SUB_KEYWORDS,
  ENUM_BASE_TYPES,
  ATTRIBUTES,
} from '../builtins.js';
import { setupDocument, pos } from './helpers.js';

function complete(source: string, line: number, character: number): string[] {
  const { projectModel, documents, uri } = setupDocument(source);
  return handleCompletion(
    { textDocument: { uri }, position: pos(line, character) },
    projectModel,
    documents,
  ).map((item) => item.label);
}

describe('Completion handler', () => {
  it('top-level context offers declaration keywords', () => {
    const labels = complete('', 0, 0);
    expect(labels).toEqual(expect.arrayContaining(TOP_LEVEL_KEYWORDS));
  });

  it('field-type context offers builtin and user-defined types', () => {
    const source = `enum Weapon { Sword }
component Player {

}`;
    const labels = complete(source, 2, 0);
    expect(labels).toEqual(expect.arrayContaining(['FP', 'int', 'Weapon']));
  });

  it('attribute context offers attribute names', () => {
    const labels = complete('[', 0, 1);
    expect(labels).toEqual(expect.arrayContaining(ATTRIBUTES.map((a) => a.name)));
  });

  it('import context offers import sub-keywords', () => {
    const labels = complete('import Weapon', 0, 'import Weapon'.length);
    expect(labels).toEqual(expect.arrayContaining(IMPORT_SUB_KEYWORDS));
    expect(labels).toContain('component');
  });

  it('enum-base context offers integer base types', () => {
    const labels = complete('enum Color :', 0, 'enum Color :'.length);
    expect(labels).toEqual(expect.arrayContaining(ENUM_BASE_TYPES));
  });

  it('generic argument context offers types', () => {
    const source = `component Player {
  list<
}`;
    const labels = complete(source, 1, 7);
    expect(labels).toEqual(expect.arrayContaining(['FP', 'int']));
  });

  it('does not offer completions inside comments or strings', () => {
    expect(complete('// comp', 0, '// comp'.length)).toEqual([]);
    expect(complete('/* comp', 0, '/* comp'.length)).toEqual([]);
    expect(complete('"comp', 0, '"comp'.length)).toEqual([]);
  });
});

describe('input block detection', () => {
  it('offers button inside an input block', () => {
    const source = `input {

}`;
    const labels = complete(source, 1, 0);
    expect(labels).toContain('button');
  });

  it('does not offer button inside a component', () => {
    const source = `component Player {

}`;
    const labels = complete(source, 1, 0);
    expect(labels).not.toContain('button');
  });

  it('offers button in an unclosed input block while typing', () => {
    const source = `input {
  FPVector2 Move;
`;
    const labels = complete(source, 2, 0);
    expect(labels).toContain('button');
  });

  it('is not fooled by "input {" inside a line comment', () => {
    const source = `component Player {
  // input {

}`;
    const labels = complete(source, 2, 2);
    expect(labels).not.toContain('button');
  });

  it('is not fooled by "input {" inside a block comment', () => {
    const source = `/* input { */
component Player {

}`;
    const labels = complete(source, 2, 2);
    expect(labels).not.toContain('button');
  });

  it('is not fooled by braces inside strings', () => {
    const source = `component Player {
  [Tooltip("input {")]

}`;
    const labels = complete(source, 2, 2);
    expect(labels).not.toContain('button');
  });
});
