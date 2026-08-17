import { describe, it, expect } from 'vitest';
import {
  PositionSchema,
  AgentSchema,
  PositionsConfigSchema,
  AgentsConfigSchema,
} from '../../src/config/schema.js';

describe('PositionSchema', () => {
  it('parses a valid position', () => {
    const result = PositionSchema.parse({
      name: 'my-project',
      path: '/home/user/projects/my-project',
      key: 'mp',
    });
    expect(result).toEqual({
      name: 'my-project',
      path: '/home/user/projects/my-project',
      key: 'mp',
    });
  });

  it('parses a position with a Windows path', () => {
    const result = PositionSchema.parse({
      name: 'docs',
      path: 'C:\\Users\\TopHop\\Desktop\\docs',
      key: 'a',
    });
    expect(result.path).toBe('C:\\Users\\TopHop\\Desktop\\docs');
  });

  it('rejects a position with an empty name', () => {
    expect(() => PositionSchema.parse({ name: '', path: '/some/path', key: 'mp' })).toThrow();
  });

  it('rejects a position with a name exceeding 50 characters', () => {
    expect(() =>
      PositionSchema.parse({ name: 'a'.repeat(51), path: '/some/path', key: 'mp' }),
    ).toThrow();
  });

  it('rejects a position with an empty path', () => {
    expect(() => PositionSchema.parse({ name: 'my-project', path: '', key: 'mp' })).toThrow();
  });

  it('rejects a position with an empty key', () => {
    expect(() =>
      PositionSchema.parse({ name: 'my-project', path: '/some/path', key: '' }),
    ).toThrow();
  });

  it('rejects a position with a key exceeding 20 characters', () => {
    expect(() =>
      PositionSchema.parse({ name: 'my-project', path: '/some/path', key: 'a'.repeat(21) }),
    ).toThrow();
  });

  it('rejects a key with uppercase characters', () => {
    expect(() =>
      PositionSchema.parse({ name: 'my-project', path: '/some/path', key: 'MP' }),
    ).toThrow();
  });

  it('rejects a key with special characters', () => {
    expect(() =>
      PositionSchema.parse({ name: 'my-project', path: '/some/path', key: 'mp!' }),
    ).toThrow();
  });

  it('accepts a key with hyphens', () => {
    const result = PositionSchema.parse({
      name: 'my-project',
      path: '/some/path',
      key: 'my-proj',
    });
    expect(result.key).toBe('my-proj');
  });

  it('accepts a key with numbers', () => {
    const result = PositionSchema.parse({
      name: 'project2',
      path: '/some/path',
      key: 'p2',
    });
    expect(result.key).toBe('p2');
  });

  it('accepts a name with non-ASCII characters', () => {
    const result = PositionSchema.parse({
      name: '我的项目',
      path: '/some/path',
      key: 'mp',
    });
    expect(result.name).toBe('我的项目');
  });
});

describe('AgentSchema', () => {
  it('parses a valid agent', () => {
    const result = AgentSchema.parse({
      name: 'crush',
      command: 'crush',
      key: 'cs',
    });
    expect(result).toEqual({
      name: 'crush',
      command: 'crush',
      key: 'cs',
      args: [],
    });
  });

  it('parses an agent with args', () => {
    const result = AgentSchema.parse({
      name: 'claude',
      command: 'claude',
      key: 'cl',
      args: ['--model', 'sonnet'],
    });
    expect(result.args).toEqual(['--model', 'sonnet']);
  });

  it('defaults args to an empty array', () => {
    const result = AgentSchema.parse({
      name: 'opencode',
      command: 'opencode',
      key: 'oc',
    });
    expect(result.args).toEqual([]);
  });

  it('rejects an agent with an empty command', () => {
    expect(() => AgentSchema.parse({ name: 'crush', command: '', key: 'cs' })).toThrow();
  });

  it('rejects an agent with an invalid key', () => {
    expect(() => AgentSchema.parse({ name: 'crush', command: 'crush', key: 'CS!' })).toThrow();
  });
});

describe('PositionsConfigSchema', () => {
  it('parses an empty array', () => {
    const result = PositionsConfigSchema.parse([]);
    expect(result).toEqual([]);
  });

  it('parses an array of positions', () => {
    const result = PositionsConfigSchema.parse([
      { name: 'project1', path: '/path/1', key: 'p1' },
      { name: 'project2', path: '/path/2', key: 'p2' },
    ]);
    expect(result).toHaveLength(2);
  });

  it('rejects an array with an invalid position', () => {
    expect(() => PositionsConfigSchema.parse([{ name: '', path: '/path', key: 'p1' }])).toThrow();
  });
});

describe('AgentsConfigSchema', () => {
  it('parses an empty array', () => {
    const result = AgentsConfigSchema.parse([]);
    expect(result).toEqual([]);
  });

  it('parses an array of agents', () => {
    const result = AgentsConfigSchema.parse([
      { name: 'crush', command: 'crush', key: 'cs' },
      { name: 'opencode', command: 'opencode', key: 'oc' },
    ]);
    expect(result).toHaveLength(2);
  });
});
