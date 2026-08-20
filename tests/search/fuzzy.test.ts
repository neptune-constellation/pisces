import { describe, it, expect } from 'vitest';
import { searchEntries } from '../../src/search/fuzzy.js';
import type { PaletteEntry } from '../../src/config/loader.js';

/**
 * Helper to create a test palette entry with minimal fields.
 */
function makeEntry(
  label: string,
  category: PaletteEntry['category'],
  locationKeys: string[],
  agentKeys: string[],
): PaletteEntry {
  return {
    label,
    description: '/test/path',
    directory: '/test/path',
    agentCommand: agentKeys[0] ? `cmd-${agentKeys[0]}` : null,
    agentArgs: [],
    locationKeys,
    agentKeys,
    category,
  };
}

describe('searchEntries', () => {
  // Simulates a config with:
  //   locations: [{ key: 'a' }, { key: 'b' }, { key: 'c' }]
  //   agents:    [{ key: 'cs' }, { key: 'oc' }]
  const entries: PaletteEntry[] = [
    makeEntry('dir-a', 'directory', ['a'], []),
    makeEntry('dir-b', 'directory', ['b'], []),
    makeEntry('dir-c', 'directory', ['c'], []),
    makeEntry('dir-a + crush', 'combo', ['a'], ['cs']),
    makeEntry('dir-a + opencode', 'combo', ['a'], ['oc']),
    makeEntry('dir-b + crush', 'combo', ['b'], ['cs']),
    makeEntry('dir-b + opencode', 'combo', ['b'], ['oc']),
    makeEntry('dir-c + crush', 'combo', ['c'], ['cs']),
    makeEntry('dir-c + opencode', 'combo', ['c'], ['oc']),
    makeEntry('crush', 'agent', [], ['cs']),
    makeEntry('opencode', 'agent', [], ['oc']),
  ];

  it('returns all entries for an empty query', () => {
    const results = searchEntries('', entries);
    expect(results).toEqual(entries);
  });

  it('matches a location key — shows directory + all combos', () => {
    const results = searchEntries('b', entries);
    // dir-b + dir-b+crush + dir-b+opencode = 3 entries
    expect(results).toHaveLength(3);
    expect(results.every((r) => r.locationKeys.includes('b'))).toBe(true);
  });

  it('matches location key + agent key prefix', () => {
    const results = searchEntries('bo', entries);
    // dir-b + opencode (agent key 'oc' starts with 'o')
    expect(results).toHaveLength(1);
    expect(results[0]!.label).toBe('dir-b + opencode');
  });

  it('matches location key + full agent key', () => {
    const results = searchEntries('boc', entries);
    // Exact match: dir-b + opencode
    expect(results).toHaveLength(1);
    expect(results[0]!.label).toBe('dir-b + opencode');
    expect(results[0]!.locationKeys).toEqual(['b']);
    expect(results[0]!.agentKeys).toEqual(['oc']);
  });

  it('matches agent key only when no location key matches', () => {
    const results = searchEntries('oc', entries);
    // Only agent-only entry for opencode
    expect(results).toHaveLength(1);
    expect(results[0]!.category).toBe('agent');
    expect(results[0]!.label).toBe('opencode');
  });

  it('matches agent key prefix when no location key matches', () => {
    const results = searchEntries('o', entries);
    // Agent-only opencode (key 'oc' starts with 'o')
    expect(results).toHaveLength(1);
    expect(results[0]!.category).toBe('agent');
    expect(results[0]!.label).toBe('opencode');
  });

  it('returns empty array when no keys match', () => {
    const results = searchEntries('xyz', entries);
    expect(results).toEqual([]);
  });

  it('returns empty when location matches but agent key does not', () => {
    const results = searchEntries('bxy', entries);
    // location 'b' matches, but 'xy' doesn't match any agent key prefix
    expect(results).toEqual([]);
  });

  it('is case insensitive', () => {
    const upperResults = searchEntries('B', entries);
    const lowerResults = searchEntries('b', entries);
    expect(upperResults).toEqual(lowerResults);
  });

  it('prefers the longest matching location key', () => {
    // Add entries with overlapping location keys
    const extended = [
      ...entries,
      makeEntry('dir-bb', 'directory', ['bb'], []),
      makeEntry('dir-bb + crush', 'combo', ['bb'], ['cs']),
    ];
    // 'bb' should match location key 'bb', not 'b'
    const results = searchEntries('bb', extended);
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.locationKeys.includes('bb'))).toBe(true);
  });

  it('matches location key + agent key prefix without matching other agents', () => {
    // 'bc' → location 'b' + agent prefix 'c' → crush (cs) matches
    const results = searchEntries('bc', entries);
    expect(results).toHaveLength(1);
    expect(results[0]!.label).toBe('dir-b + crush');
    expect(results[0]!.agentKeys).toEqual(['cs']);
  });

  it("matches any of a location's multiple keys", () => {
    const multi = [
      makeEntry('dir-multi', 'directory', ['a', 'x'], []),
      makeEntry('dir-multi + crush', 'combo', ['a', 'x'], ['cs']),
    ];
    expect(searchEntries('a', multi)).toHaveLength(2);
    expect(searchEntries('x', multi)).toHaveLength(2);
  });

  it("matches any of an agent's multiple keys", () => {
    const multi = [makeEntry('crush', 'agent', [], ['cs', 'cr'])];
    expect(searchEntries('cs', multi)).toHaveLength(1);
    expect(searchEntries('cr', multi)).toHaveLength(1);
  });
});
