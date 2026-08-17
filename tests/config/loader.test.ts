import { describe, it, expect } from 'vitest';
import type { Position, Agent } from '../../src/config/schema.js';
import type { PaletteEntry } from '../../src/config/loader.js';

/**
 * Generates palette entries from positions and agents.
 * This is a copy of the logic from loader.ts, kept here for testing.
 * Tests the pure function behavior without filesystem dependencies.
 */
function generateEntries(positions: Position[], agents: Agent[]): PaletteEntry[] {
  const entries: PaletteEntry[] = [];

  // Directory entries
  for (const pos of positions) {
    entries.push({
      label: pos.name,
      description: pos.path,
      directory: pos.path,
      agentCommand: null,
      agentArgs: [],
      searchText: `${pos.name} ${pos.key}`,
      category: 'directory',
    });
  }

  // Directory + Agent combo entries
  for (const pos of positions) {
    for (const agent of agents) {
      entries.push({
        label: `${pos.name} + ${agent.name}`,
        description: pos.path,
        directory: pos.path,
        agentCommand: agent.command,
        agentArgs: agent.args,
        searchText: `${pos.name} ${pos.key} ${agent.name} ${agent.key}`,
        category: 'combo',
      });
    }
  }

  // Agent-only entries
  for (const agent of agents) {
    entries.push({
      label: agent.name,
      description: '(current)',
      directory: process.cwd(),
      agentCommand: agent.command,
      agentArgs: agent.args,
      searchText: `${agent.name} ${agent.key}`,
      category: 'agent',
    });
  }

  return entries;
}

describe('generateEntries', () => {
  const positions: Position[] = [
    { name: 'name1', path: '/home/user/docs', key: 'a' },
    { name: 'name2', path: '/home/user/code', key: 'b' },
  ];

  const agents: Agent[] = [
    { name: 'crush', command: 'crush', key: 'cs', args: [] },
    { name: 'opencode', command: 'opencode', key: 'oc', args: [] },
  ];

  it('returns empty array for empty configs', () => {
    const entries = generateEntries([], []);
    expect(entries).toEqual([]);
  });

  it('returns only directory entries when agents are empty', () => {
    const entries = generateEntries(positions, []);
    expect(entries).toHaveLength(2);
    expect(entries[0]?.category).toBe('directory');
    expect(entries[1]?.category).toBe('directory');
  });

  it('returns only agent entries when positions are empty', () => {
    const entries = generateEntries([], agents);
    expect(entries).toHaveLength(2);
    expect(entries[0]?.category).toBe('agent');
    expect(entries[1]?.category).toBe('agent');
  });

  it('generates all three categories with both configs', () => {
    const entries = generateEntries(positions, agents);
    // 2 directories + 2*2 combos + 2 agents = 8 entries
    expect(entries).toHaveLength(8);

    const directories = entries.filter((e) => e.category === 'directory');
    const combos = entries.filter((e) => e.category === 'combo');
    const agentOnly = entries.filter((e) => e.category === 'agent');

    expect(directories).toHaveLength(2);
    expect(combos).toHaveLength(4);
    expect(agentOnly).toHaveLength(2);
  });

  it('sets correct properties on directory entries', () => {
    const entries = generateEntries(positions, []);
    const entry = entries[0]!;
    expect(entry.label).toBe('name1');
    expect(entry.description).toBe('/home/user/docs');
    expect(entry.directory).toBe('/home/user/docs');
    expect(entry.agentCommand).toBeNull();
    expect(entry.agentArgs).toEqual([]);
    expect(entry.searchText).toBe('name1 a');
    expect(entry.category).toBe('directory');
  });

  it('sets correct properties on combo entries', () => {
    const entries = generateEntries(positions, agents);
    const combo = entries.find((e) => e.category === 'combo' && e.label === 'name1 + crush');
    expect(combo).toBeDefined();
    expect(combo!.directory).toBe('/home/user/docs');
    expect(combo!.agentCommand).toBe('crush');
    expect(combo!.searchText).toBe('name1 a crush cs');
  });

  it('sets correct properties on agent-only entries', () => {
    const entries = generateEntries([], agents);
    const entry = entries[0]!;
    expect(entry.label).toBe('crush');
    expect(entry.description).toBe('(current)');
    expect(entry.directory).toBe(process.cwd());
    expect(entry.agentCommand).toBe('crush');
    expect(entry.searchText).toBe('crush cs');
    expect(entry.category).toBe('agent');
  });

  it('includes agent args in combo entries', () => {
    const agentsWithArgs: Agent[] = [
      { name: 'claude', command: 'claude', key: 'cl', args: ['--model', 'sonnet'] },
    ];
    const entries = generateEntries([positions[0]!], agentsWithArgs);
    const combo = entries.find((e) => e.category === 'combo');
    expect(combo!.agentArgs).toEqual(['--model', 'sonnet']);
  });
});
