import { describe, it, expect } from 'vitest';
import { KNOWN_AGENTS, toAgentEntries } from '../../src/config/known-agents.js';
import { AgentSchema } from '../../src/config/schema.js';

describe('toAgentEntries', () => {
  it('maps commands to name=command entries with a single key', () => {
    const entries = toAgentEntries(['claude', 'codex']);
    expect(entries).toEqual([
      { name: 'claude', command: 'claude', key: ['claude'], args: [] },
      { name: 'codex', command: 'codex', key: ['codex'], args: [] },
    ]);
  });

  it('returns an empty array for no commands', () => {
    expect(toAgentEntries([])).toEqual([]);
  });

  it('produces entries that satisfy the agent schema', () => {
    const commands = KNOWN_AGENTS.map((agent) => agent.command);
    const entries = toAgentEntries(commands);
    for (const entry of entries) {
      expect(() => AgentSchema.parse(entry)).not.toThrow();
    }
  });
});

describe('KNOWN_AGENTS', () => {
  it('contains the expected thirteen agents', () => {
    expect(KNOWN_AGENTS.map((agent) => agent.command)).toEqual([
      'claude',
      'codex',
      'opencode',
      'kimi',
      'crush',
      'cline',
      'kilo',
      'pi',
      'qoder',
      'grok',
      'gemini',
      'omp',
      'reasonix',
    ]);
  });

  it('has unique commands', () => {
    const commands = KNOWN_AGENTS.map((agent) => agent.command);
    expect(new Set(commands).size).toBe(commands.length);
  });

  it('keeps every command a valid lowercase key', () => {
    for (const agent of KNOWN_AGENTS) {
      expect(agent.command).toMatch(/^[a-z0-9-]{1,20}$/);
    }
  });
});
