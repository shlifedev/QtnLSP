import { describe, expect, it } from 'vitest';
import { shouldSkipDirectory } from '../workspace-index.js';

describe('workspace indexing helpers', () => {
  it('skips generated and auxiliary directories', () => {
    expect(shouldSkipDirectory('.git')).toBe(true);
    expect(shouldSkipDirectory('node_modules')).toBe(true);
    expect(shouldSkipDirectory('dist')).toBe(true);
    expect(shouldSkipDirectory('out')).toBe(true);
    expect(shouldSkipDirectory('build')).toBe(true);
    expect(shouldSkipDirectory('.worktrees')).toBe(true);
  });

  it('skips Unity and IDE artifact directories regardless of casing', () => {
    expect(shouldSkipDirectory('Library')).toBe(true);
    expect(shouldSkipDirectory('Temp')).toBe(true);
    expect(shouldSkipDirectory('Logs')).toBe(true);
    expect(shouldSkipDirectory('obj')).toBe(true);
    expect(shouldSkipDirectory('bin')).toBe(true);
    expect(shouldSkipDirectory('Builds')).toBe(true);
    expect(shouldSkipDirectory('.idea')).toBe(true);
    expect(shouldSkipDirectory('.vs')).toBe(true);
    expect(shouldSkipDirectory('Build')).toBe(true);
  });

  it('does not skip ordinary source directories', () => {
    expect(shouldSkipDirectory('src')).toBe(false);
    expect(shouldSkipDirectory('shared')).toBe(false);
    expect(shouldSkipDirectory('Gameplay')).toBe(false);
  });
});
