// Tests for Semantic Tokens Provider

import { describe, it, expect } from 'vitest';
import { ProjectModel } from '../project-model.js';
import { handleSemanticTokensFull, tokenTypes } from '../semantic-tokens.js';

// Helper: set up a ProjectModel with given QTN source and return semantic tokens
function getTokens(source: string, uri = 'test://test.qtn') {
  const pm = new ProjectModel();
  pm.updateDocument(uri, source);

  const result = handleSemanticTokensFull(
    { textDocument: { uri } },
    pm,
  );

  return result;
}

// Helper: decode delta-encoded semantic tokens data into absolute positions
function decodeTokens(data: number[]): Array<{
  line: number;
  char: number;
  length: number;
  tokenType: number;
  tokenModifiers: number;
}> {
  const tokens: Array<{
    line: number;
    char: number;
    length: number;
    tokenType: number;
    tokenModifiers: number;
  }> = [];

  let prevLine = 0;
  let prevChar = 0;

  for (let i = 0; i < data.length; i += 5) {
    const deltaLine = data[i];
    const deltaChar = data[i + 1];
    const length = data[i + 2];
    const tokenType = data[i + 3];
    const tokenModifiers = data[i + 4];

    if (deltaLine > 0) {
      prevLine += deltaLine;
      prevChar = deltaChar;
    } else {
      prevChar += deltaChar;
    }

    tokens.push({
      line: prevLine,
      char: prevChar,
      length,
      tokenType,
      tokenModifiers,
    });
  }

  return tokens;
}

describe('Semantic Tokens Provider', () => {
  it('should emit token for user-defined enum type reference', () => {
    const source = `
enum CharacterState { Idle, Moving }
component Player {
  CharacterState State;
}`;
    const result = getTokens(source);
    expect(result).not.toBeNull();

    const tokens = decodeTokens(result!.data);
    // Should have at least 1 token for CharacterState field type
    const enumTokens = tokens.filter(t => t.tokenType === tokenTypes.indexOf('enum'));
    expect(enumTokens.length).toBeGreaterThanOrEqual(1);
    // Verify it points to "CharacterState" (length = 14)
    expect(enumTokens.some(t => t.length === 'CharacterState'.length)).toBe(true);
  });

  it('should emit token for builtin type reference', () => {
    const source = `
component Player {
  FP MoveSpeed;
}`;
    const result = getTokens(source);
    expect(result).not.toBeNull();

    const tokens = decodeTokens(result!.data);
    // FP is a builtin quantum type → SymbolKind.Class → tokenType 'class'
    expect(tokens.length).toBeGreaterThanOrEqual(1);
    const fpTokens = tokens.filter(t => t.length === 'FP'.length);
    expect(fpTokens.length).toBeGreaterThanOrEqual(1);
  });

  it('should emit token for generic type argument', () => {
    const source = `
enum CharacterState { Idle, Moving }
component Player {
  list<CharacterState> States;
}`;
    const result = getTokens(source);
    expect(result).not.toBeNull();

    const tokens = decodeTokens(result!.data);
    // Should have tokens for both 'list' (builtin collection) and 'CharacterState'
    expect(tokens.length).toBeGreaterThanOrEqual(2);

    // CharacterState should be tokenized
    const csTokens = tokens.filter(t => t.length === 'CharacterState'.length);
    expect(csTokens.length).toBeGreaterThanOrEqual(1);
  });

  it('should emit token for signal parameter types', () => {
    const source = `
signal OnDamage(FP damage, EntityRef target);
`;
    const result = getTokens(source);
    expect(result).not.toBeNull();

    const tokens = decodeTokens(result!.data);
    // Should have tokens for FP and EntityRef
    expect(tokens.length).toBeGreaterThanOrEqual(2);
  });

  it('should not emit token for unknown types', () => {
    const source = `
component Player {
  UnknownType Field;
}`;
    const result = getTokens(source);
    expect(result).not.toBeNull();

    const tokens = decodeTokens(result!.data);
    // UnknownType is not in symbol table → no token emitted
    const unknownTokens = tokens.filter(t => t.length === 'UnknownType'.length);
    expect(unknownTokens).toHaveLength(0);
  });

  it('should return empty tokens for unknown document URI', () => {
    const pm = new ProjectModel();
    const result = handleSemanticTokensFull(
      { textDocument: { uri: 'test://nonexistent.qtn' } },
      pm,
    );
    expect(result.data).toHaveLength(0);
  });

  it('should emit tokens for struct field types', () => {
    const source = `
struct Stats {
  FP Health;
  FPVector3 Position;
}`;
    const result = getTokens(source);
    expect(result).not.toBeNull();

    const tokens = decodeTokens(result!.data);
    expect(tokens.length).toBeGreaterThanOrEqual(2);
  });

  it('should emit tokens for input block field types', () => {
    const source = `
input {
  FPVector2 Move;
}`;
    const result = getTokens(source);
    expect(result).not.toBeNull();

    const tokens = decodeTokens(result!.data);
    expect(tokens.length).toBeGreaterThanOrEqual(1);
  });

  it('should emit tokens for global block field types', () => {
    const source = `
global {
  FP GameTimer;
}`;
    const result = getTokens(source);
    expect(result).not.toBeNull();

    const tokens = decodeTokens(result!.data);
    expect(tokens.length).toBeGreaterThanOrEqual(1);
  });

  it('should emit tokens for event field types', () => {
    const source = `
event MyEvent {
  FP Value;
  EntityRef Source;
}`;
    const result = getTokens(source);
    expect(result).not.toBeNull();

    const tokens = decodeTokens(result!.data);
    expect(tokens.length).toBeGreaterThanOrEqual(2);
  });

  it('should handle nameRange correctly for multiline token positions', () => {
    const source = `
component Player {
  FP Health;
  FPVector3 Position;
}`;
    const result = getTokens(source);
    expect(result).not.toBeNull();

    const tokens = decodeTokens(result!.data);
    // Tokens should be on different lines
    const lines = new Set(tokens.map(t => t.line));
    expect(lines.size).toBeGreaterThanOrEqual(2);
  });
});
