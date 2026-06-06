import { describe, expect, it } from 'vitest';
import { parse } from '../parser.js';
import { SymbolTable } from '../symbol-table.js';

describe('SymbolTable fuzzySearch cache invalidation', () => {
  it('should include newly added symbols after addFromDocument', () => {
    const table = new SymbolTable();

    const docA = parse(
      `
      struct Player {
        int hp;
      }
      `,
      'test://a.qtn'
    );
    table.addFromDocument(docA);

    const before = table.fuzzySearch('pla').map(symbol => symbol.name);
    expect(before).toContain('Player');
    expect(before).not.toContain('Planet');

    const docB = parse(
      `
      struct Planet {
        int size;
      }
      `,
      'test://b.qtn'
    );
    table.addFromDocument(docB);

    const after = table.fuzzySearch('pla').map(symbol => symbol.name);
    expect(after).toEqual(expect.arrayContaining(['Player', 'Planet']));
  });

  it('should clear stale search entries after buildFromDocument', () => {
    const table = new SymbolTable();

    const oldDoc = parse(
      `
      struct LegacyType {
        int value;
      }
      `,
      'test://legacy.qtn'
    );
    table.addFromDocument(oldDoc);
    expect(table.fuzzySearch('legacy').map(symbol => symbol.name)).toContain('LegacyType');

    const newDoc = parse(
      `
      struct CurrentType {
        int value;
      }
      `,
      'test://current.qtn'
    );
    table.buildFromDocument(newDoc);

    const legacyResults = table.fuzzySearch('legacy').map(symbol => symbol.name);
    const currentResults = table.fuzzySearch('current').map(symbol => symbol.name);
    expect(legacyResults).not.toContain('LegacyType');
    expect(currentResults).toContain('CurrentType');
  });
});
