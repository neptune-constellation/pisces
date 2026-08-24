import { describe, it, expect } from 'vitest';
import { generateEntries } from '../../src/config/loader.js';
import type { Location, Agent } from '../../src/config/schema.js';

describe('generateEntries', () => {
  const locations: Location[] = [
    { name: 'name1', path: '/home/user/docs', key: ['a'] },
    { name: 'name2', path: '/home/user/code', key: ['b'] },
  ];

  const agents: Agent[] = [
    { name: 'crush', command: 'crush', key: ['cs'], args: [] },
    { name: 'opencode', command: 'opencode', key: ['oc'], args: [] },
  ];

  it('returns empty array for empty configs', () => {
    const entries = generateEntries([], []);
    expect(entries).toEqual([]);
  });

  it('returns only directory entries when agents are empty', () => {
    const entries = generateEntries(locations, []);
    expect(entries).toHaveLength(2);
    expect(entries[0]?.category).toBe('directory');
    expect(entries[1]?.category).toBe('directory');
  });

  it('returns only agent entries when locations are empty', () => {
    const entries = generateEntries([], agents);
    expect(entries).toHaveLength(2);
    expect(entries[0]?.category).toBe('agent');
    expect(entries[1]?.category).toBe('agent');
  });

  it('generates all three categories with both configs', () => {
    const entries = generateEntries(locations, agents);
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
    const entries = generateEntries(locations, []);
    const entry = entries[0]!;
    expect(entry.label).toBe('name1');
    expect(entry.description).toBe('/home/user/docs');
    expect(entry.directory).toBe('/home/user/docs');
    expect(entry.agentCommand).toBeNull();
    expect(entry.agentArgs).toEqual([]);
    expect(entry.locationKeys).toEqual(['a']);
    expect(entry.agentKeys).toEqual([]);
    expect(entry.category).toBe('directory');
  });

  it('sets correct properties on combo entries', () => {
    const entries = generateEntries(locations, agents);
    const combo = entries.find((e) => e.category === 'combo' && e.label === 'name1 + crush');
    expect(combo).toBeDefined();
    expect(combo!.directory).toBe('/home/user/docs');
    expect(combo!.agentCommand).toBe('crush');
    expect(combo!.locationKeys).toEqual(['a']);
    expect(combo!.agentKeys).toEqual(['cs']);
  });

  it('sets correct properties on agent-only entries', () => {
    const entries = generateEntries([], agents);
    const entry = entries[0]!;
    expect(entry.label).toBe('crush');
    expect(entry.description).toBe('(current)');
    expect(entry.directory).toBe(process.cwd());
    expect(entry.agentCommand).toBe('crush');
    expect(entry.locationKeys).toEqual([]);
    expect(entry.agentKeys).toEqual(['cs']);
    expect(entry.category).toBe('agent');
  });

  it('includes agent args in combo entries', () => {
    const agentsWithArgs: Agent[] = [
      { name: 'claude', command: 'claude', key: ['cl'], args: ['--model', 'sonnet'] },
    ];
    const entries = generateEntries([locations[0]!], agentsWithArgs);
    const combo = entries.find((e) => e.category === 'combo');
    expect(combo!.agentArgs).toEqual(['--model', 'sonnet']);
  });

  it('propagates multiple keys onto entries', () => {
    const multiKeyLocations: Location[] = [{ name: 'multi', path: '/multi', key: ['a', 'b'] }];
    const multiKeyAgents: Agent[] = [
      { name: 'crush', command: 'crush', key: ['cs', 'cr'], args: [] },
    ];
    const entries = generateEntries(multiKeyLocations, multiKeyAgents);
    const directory = entries.find((e) => e.category === 'directory')!;
    const combo = entries.find((e) => e.category === 'combo')!;
    const agentOnly = entries.find((e) => e.category === 'agent')!;

    expect(directory.locationKeys).toEqual(['a', 'b']);
    expect(directory.agentKeys).toEqual([]);
    expect(combo.locationKeys).toEqual(['a', 'b']);
    expect(combo.agentKeys).toEqual(['cs', 'cr']);
    expect(agentOnly.locationKeys).toEqual([]);
    expect(agentOnly.agentKeys).toEqual(['cs', 'cr']);
  });
});
