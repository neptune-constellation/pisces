import { describe, it, expect, vi, beforeEach } from 'vitest';
import { join } from 'node:path';
import { searchEntries, getSubdirectoryEntries } from '../../src/search/fuzzy.js';
import type { PaletteEntry } from '../../src/config/loader.js';
import { readdirSync } from 'node:fs';

vi.mock('node:fs', () => ({
  readdirSync: vi.fn(),
}));

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
    editorCommand: null,
    editorArgs: [],
    locationKeys,
    agentKeys,
    editorKeys: [],
    category,
  };
}

/**
 * Helper to create a test editor palette entry with minimal fields.
 */
function makeEditorEntry(
  label: string,
  category: PaletteEntry['category'],
  locationKeys: string[],
  editorKeys: string[],
): PaletteEntry {
  return {
    label,
    description: '/test/path',
    directory: '/test/path',
    agentCommand: null,
    agentArgs: [],
    editorCommand: editorKeys[0] ? `ed-${editorKeys[0]}` : null,
    editorArgs: [],
    locationKeys,
    agentKeys: [],
    editorKeys,
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

describe('getSubdirectoryEntries', () => {
  const mockReaddirSync = vi.mocked(readdirSync);

  const dirA = makeEntry('dir-a', 'directory', ['a'], []);
  dirA.directory = '/home/user/projects/a-project';
  const dirB = makeEntry('dir-b', 'directory', ['b'], []);
  dirB.directory = '/home/user/projects/b-project';
  const entries: PaletteEntry[] = [
    dirA,
    dirB,
    makeEntry('dir-a + crush', 'combo', ['a'], ['cs']),
    makeEntry('crush', 'agent', [], ['cs']),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty array when query has no separator', () => {
    const results = getSubdirectoryEntries('b', entries);
    expect(results).toEqual([]);
  });

  it('returns empty array when no location matches the key before the separator', () => {
    const results = getSubdirectoryEntries('xyz/', entries);
    expect(results).toEqual([]);
  });

  it('returns subdirectory entries for a matching location key followed by /', () => {
    mockReaddirSync.mockReturnValue([
      { isDirectory: () => true, name: 'src' },
      { isDirectory: () => true, name: 'tests' },
      { isDirectory: () => false, name: 'README.md' },
    ] as unknown as ReturnType<typeof readdirSync>);

    const results = getSubdirectoryEntries('a/', entries);

    expect(results).toHaveLength(2);
    expect(results[0]!.label).toBe('src');
    expect(results[0]!.directory).toBe(join('/home/user/projects/a-project', 'src'));
    expect(results[0]!.category).toBe('directory');
    expect(results[0]!.agentCommand).toBeNull();
    expect(results[1]!.label).toBe('tests');
  });

  it('supports backslash as separator', () => {
    mockReaddirSync.mockReturnValue([
      { isDirectory: () => true, name: 'src' },
    ] as unknown as ReturnType<typeof readdirSync>);

    const results = getSubdirectoryEntries('a\\src', entries);

    expect(results).toHaveLength(1);
    expect(results[0]!.label).toBe('src');
  });

  it('filters subdirectories by the text after the separator', () => {
    mockReaddirSync.mockReturnValue([
      { isDirectory: () => true, name: 'src' },
      { isDirectory: () => true, name: 'scripts' },
      { isDirectory: () => true, name: 'tests' },
    ] as unknown as ReturnType<typeof readdirSync>);

    // 's' matches both 'src' and 'scripts'
    const results = getSubdirectoryEntries('a/s', entries);

    expect(results).toHaveLength(2);
    expect(results[0]!.label).toBe('scripts');
    expect(results[1]!.label).toBe('src');
  });

  it('filters subdirectories case-insensitively', () => {
    mockReaddirSync.mockReturnValue([
      { isDirectory: () => true, name: 'Src' },
      { isDirectory: () => true, name: 'Tests' },
    ] as unknown as ReturnType<typeof readdirSync>);

    const results = getSubdirectoryEntries('a/t', entries);

    expect(results).toHaveLength(1);
    expect(results[0]!.label).toBe('Tests');
  });

  it('returns empty array when readdirSync throws', () => {
    mockReaddirSync.mockImplementation(() => {
      throw new Error('ENOENT');
    });

    const results = getSubdirectoryEntries('a/', entries);

    expect(results).toEqual([]);
  });

  it('excludes hidden directories (names starting with .)', () => {
    mockReaddirSync.mockReturnValue([
      { isDirectory: () => true, name: 'src' },
      { isDirectory: () => true, name: '.git' },
      { isDirectory: () => true, name: '.claude' },
    ] as unknown as ReturnType<typeof readdirSync>);

    const results = getSubdirectoryEntries('a/', entries);

    expect(results).toHaveLength(1);
    expect(results[0]!.label).toBe('src');
  });

  it('returns empty array when no subdirectories match the filter', () => {
    mockReaddirSync.mockReturnValue([
      { isDirectory: () => true, name: 'src' },
    ] as unknown as ReturnType<typeof readdirSync>);

    const results = getSubdirectoryEntries('a/xyz', entries);

    expect(results).toEqual([]);
  });

  it('sorts subdirectories alphabetically', () => {
    mockReaddirSync.mockReturnValue([
      { isDirectory: () => true, name: 'zebra' },
      { isDirectory: () => true, name: 'alpha' },
      { isDirectory: () => true, name: 'beta' },
    ] as unknown as ReturnType<typeof readdirSync>);

    const results = getSubdirectoryEntries('a/', entries);

    expect(results).toHaveLength(3);
    expect(results[0]!.label).toBe('alpha');
    expect(results[1]!.label).toBe('beta');
    expect(results[2]!.label).toBe('zebra');
  });

  it('matches location key followed by / with no subdir filter', () => {
    mockReaddirSync.mockReturnValue([
      { isDirectory: () => true, name: 'src' },
      { isDirectory: () => true, name: 'tests' },
    ] as unknown as ReturnType<typeof readdirSync>);

    // Just 'b/' — no filter after the separator
    const results = getSubdirectoryEntries('b/', entries);

    expect(results).toHaveLength(2);
  });
});

describe('searchEntries with editors', () => {
  const entries: PaletteEntry[] = [
    makeEntry('dir-b', 'directory', ['b'], []),
    makeEntry('dir-b + opencode', 'combo', ['b'], ['oc']),
    makeEditorEntry('dir-b + VS Code', 'combo', ['b'], ['vscode']),
    makeEditorEntry('VS Code', 'editor', [], ['vscode']),
  ];

  it('shows directory, agent combos, and editor combos for a location key', () => {
    const results = searchEntries('b', entries);
    expect(results).toHaveLength(3);
  });

  it('matches location key + editor key prefix', () => {
    const results = searchEntries('bv', entries);
    expect(results).toHaveLength(1);
    expect(results[0]!.label).toBe('dir-b + VS Code');
    expect(results[0]!.editorKeys).toEqual(['vscode']);
  });

  it('matches location key + full editor key', () => {
    const results = searchEntries('bvscode', entries);
    expect(results).toHaveLength(1);
    expect(results[0]!.label).toBe('dir-b + VS Code');
  });

  it('still matches agent combos alongside editors', () => {
    const results = searchEntries('boc', entries);
    expect(results).toHaveLength(1);
    expect(results[0]!.label).toBe('dir-b + opencode');
  });

  it('matches editor-only entries when no location key matches', () => {
    const results = searchEntries('vscode', entries);
    expect(results).toHaveLength(1);
    expect(results[0]!.category).toBe('editor');
    expect(results[0]!.label).toBe('VS Code');
  });

  it('returns both agent and editor combos when keys share a prefix', () => {
    const shared: PaletteEntry[] = [
      makeEntry('dir-x', 'directory', ['x'], []),
      makeEntry('dir-x + tool-agent', 'combo', ['x'], ['tool']),
      makeEditorEntry('dir-x + tool-editor', 'combo', ['x'], ['tools']),
    ];
    const results = searchEntries('xt', shared);
    expect(results).toHaveLength(2);
  });

  it('returns empty when neither agent nor editor keys match', () => {
    expect(searchEntries('bzz', entries)).toEqual([]);
  });
});
