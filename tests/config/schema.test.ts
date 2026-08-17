import { describe, it, expect } from 'vitest';
import { LocationSchema, AgentSchema, SettingsSchema } from '../../src/config/schema.js';

describe('LocationSchema', () => {
  it('parses a valid location', () => {
    const result = LocationSchema.parse({
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

  it('parses a location with a Windows path', () => {
    const result = LocationSchema.parse({
      name: 'docs',
      path: 'C:\\Users\\TopHop\\Desktop\\docs',
      key: 'a',
    });
    expect(result.path).toBe('C:\\Users\\TopHop\\Desktop\\docs');
  });

  it('rejects a location with an empty name', () => {
    expect(() => LocationSchema.parse({ name: '', path: '/some/path', key: 'mp' })).toThrow();
  });

  it('rejects a location with a name exceeding 50 characters', () => {
    expect(() =>
      LocationSchema.parse({ name: 'a'.repeat(51), path: '/some/path', key: 'mp' }),
    ).toThrow();
  });

  it('rejects a location with an empty path', () => {
    expect(() => LocationSchema.parse({ name: 'my-project', path: '', key: 'mp' })).toThrow();
  });

  it('rejects a location with an empty key', () => {
    expect(() =>
      LocationSchema.parse({ name: 'my-project', path: '/some/path', key: '' }),
    ).toThrow();
  });

  it('rejects a location with a key exceeding 20 characters', () => {
    expect(() =>
      LocationSchema.parse({ name: 'my-project', path: '/some/path', key: 'a'.repeat(21) }),
    ).toThrow();
  });

  it('rejects a key with uppercase characters', () => {
    expect(() =>
      LocationSchema.parse({ name: 'my-project', path: '/some/path', key: 'MP' }),
    ).toThrow();
  });

  it('rejects a key with special characters', () => {
    expect(() =>
      LocationSchema.parse({ name: 'my-project', path: '/some/path', key: 'mp!' }),
    ).toThrow();
  });

  it('accepts a key with hyphens', () => {
    const result = LocationSchema.parse({
      name: 'my-project',
      path: '/some/path',
      key: 'my-proj',
    });
    expect(result.key).toBe('my-proj');
  });

  it('accepts a key with numbers', () => {
    const result = LocationSchema.parse({
      name: 'project2',
      path: '/some/path',
      key: 'p2',
    });
    expect(result.key).toBe('p2');
  });

  it('accepts a name with non-ASCII characters', () => {
    const result = LocationSchema.parse({
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

describe('SettingsSchema', () => {
  it('parses valid settings', () => {
    const result = SettingsSchema.parse({
      locations: [{ name: 'project1', path: '/path/1', key: 'p1' }],
      agents: [{ name: 'crush', command: 'crush', key: 'cs' }],
    });
    expect(result.locations).toHaveLength(1);
    expect(result.agents).toHaveLength(1);
  });

  it('defaults to empty arrays when fields are missing', () => {
    const result = SettingsSchema.parse({});
    expect(result.locations).toEqual([]);
    expect(result.agents).toEqual([]);
  });

  it('rejects invalid locations', () => {
    expect(() =>
      SettingsSchema.parse({
        locations: [{ name: '', path: '/path', key: 'p1' }],
      }),
    ).toThrow();
  });

  it('rejects invalid agents', () => {
    expect(() =>
      SettingsSchema.parse({
        agents: [{ name: 'crush', command: '', key: 'cs' }],
      }),
    ).toThrow();
  });
});
