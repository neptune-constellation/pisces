import { describe, it, expect } from 'vitest';
import { searchEntries } from '../../src/search/fuzzy.js';
import type { PaletteEntry } from '../../src/config/loader.js';

/**
 * Helper to create a test palette entry with minimal fields.
 */
function makeEntry(
  label: string,
  searchText: string,
  category: PaletteEntry['category'] = 'directory',
): PaletteEntry {
  return {
    label,
    description: '/test/path',
    directory: '/test/path',
    agentCommand: null,
    agentArgs: [],
    searchText,
    category,
  };
}

describe('searchEntries', () => {
  const entries: PaletteEntry[] = [
    makeEntry('dir1', 'dir1 a', 'directory'),
    makeEntry('dir2', 'dir2 b', 'directory'),
    makeEntry('dir3', 'dir3 c', 'directory'),
    makeEntry('dir1 + crush', 'dir1 a crush cs', 'combo'),
    makeEntry('dir1 + opencode', 'dir1 a opencode oc', 'combo'),
    makeEntry('dir2 + crush', 'dir2 b crush cs', 'combo'),
    makeEntry('crush', 'crush cs', 'agent'),
    makeEntry('opencode', 'opencode oc', 'agent'),
  ];

  it('returns all entries for an empty query', () => {
    const results = searchEntries('', entries);
    expect(results).toEqual(entries);
  });

  it('filters by a single character', () => {
    const results = searchEntries('a', entries);
    // 'a' matches: dir1 (key 'a'), dir1+crush, dir1+opencode = 3 entries
    expect(results).toHaveLength(3);
    expect(results.every((r) => r.searchText.includes('a'))).toBe(true);
  });

  it('filters with character-by-character AND behavior', () => {
    const results = searchEntries('ao', entries);
    // Entries with BOTH 'a' AND 'o': dir1+opencode only
    // (dir1 has 'a' but no 'o'; opencode has 'o' — only the combo has both)
    expect(results).toHaveLength(1);
    expect(results[0]!.label).toBe('dir1 + opencode');
  });

  it('is case insensitive', () => {
    const upperResults = searchEntries('A', entries);
    const lowerResults = searchEntries('a', entries);
    expect(upperResults).toEqual(lowerResults);
  });

  it('returns empty array when no entries match', () => {
    const results = searchEntries('xyz', entries);
    expect(results).toEqual([]);
  });

  it('sorts directories before combos before agents when scores are similar', () => {
    // 'c' matches: dir3 (directory), dir1+crush (combo), dir2+crush (combo),
    // dir1+opencode (combo), crush (agent), opencode (agent)
    const results = searchEntries('c', entries);
    const categories = results.map((r) => r.category);
    // directory entries should come before agent entries
    const dirIndex = categories.indexOf('directory');
    const agentIndex = categories.indexOf('agent');
    expect(dirIndex).not.toBe(-1);
    expect(agentIndex).not.toBe(-1);
    expect(dirIndex).toBeLessThan(agentIndex);
  });

  it('matches against agent name', () => {
    const results = searchEntries('crush', entries);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.searchText.includes('crush'))).toBe(true);
  });

  it('matches against agent key', () => {
    const results = searchEntries('cs', entries);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.searchText.includes('cs'))).toBe(true);
  });

  it('prevents duplicate entries in results', () => {
    const results = searchEntries('dir1', entries);
    const labels = results.map((r) => r.label);
    const uniqueLabels = new Set(labels);
    expect(labels.length).toBe(uniqueLabels.size);
  });
});
