import { describe, it, expect, vi, beforeEach } from 'vitest';
import { existsSync, globSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { knownEditors, detectInstalledEditors } from '../../src/config/known-editors.js';
import { isCommandAvailable } from '../../src/config/known-agents.js';
import { EditorSchema } from '../../src/config/schema.js';

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  globSync: vi.fn(),
}));

vi.mock('node:child_process', () => ({
  execFile: vi.fn(),
}));

vi.mock('node:os', () => ({
  homedir: () => 'C:\\Users\\test',
  platform: () => 'win32',
}));

vi.mock('../../src/config/known-agents.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/config/known-agents.js')>();
  return { ...actual, isCommandAvailable: vi.fn() };
});

describe('knownEditors', () => {
  it('lists the supported editors with a command and fallback paths', () => {
    const editors = knownEditors();
    expect(editors.map((e) => e.name)).toEqual([
      'VS Code',
      'PyCharm',
      'IntelliJ IDEA',
      'Qoder',
      'Cursor',
      'Trae',
    ]);
    expect(editors[0]!.command).toBe('code');
    expect(editors[0]!.pathMatch).toEqual(['vs code', 'vs']);
    expect(editors.every((e) => e.fallbackPaths.length > 0)).toBe(true);
  });

  it('keeps every generated key a valid lowercase key', () => {
    for (const editor of knownEditors()) {
      for (const key of editor.keys) {
        expect(key).toMatch(/^[a-z0-9-]{1,20}$/);
      }
    }
  });
});

describe('detectInstalledEditors', () => {
  const mockIsCommandAvailable = vi.mocked(isCommandAvailable);
  const mockExistsSync = vi.mocked(existsSync);
  const mockGlobSync = vi.mocked(globSync);
  const mockExecFile = vi.mocked(execFile);

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: nothing is installed.
    mockExecFile.mockImplementation((_file, _args, _options, callback) => {
      callback(new Error('not found'));
    });
    mockExistsSync.mockReturnValue(false);
    mockGlobSync.mockReturnValue([]);
    mockIsCommandAvailable.mockResolvedValue(false);
  });

  /** Stubs `where <command>` for a single command; all others report "not found". */
  function mockWhereFor(command: string, stdout: string | null): void {
    mockExecFile.mockImplementation((_file, args, _options, callback) => {
      if (args[0] === command) {
        if (stdout === null) {
          callback(new Error('not found'));
        } else {
          callback(null, stdout);
        }
      } else {
        callback(new Error('not found'));
      }
    });
  }

  it('prefers the VS Code launcher when where resolves multiple code shims', async () => {
    mockWhereFor(
      'code',
      'C:\\Qoder\\bin\\code\n' +
        'C:\\Qoder\\bin\\code.cmd\n' +
        'C:\\Microsoft VS Code\\bin\\code\n' +
        'C:\\Microsoft VS Code\\bin\\code.cmd\n',
    );

    const editors = await detectInstalledEditors();

    expect(editors).toHaveLength(1);
    expect(editors[0]!.name).toBe('VS Code');
    expect(editors[0]!.command).toBe('C:\\Microsoft VS Code\\bin\\code.cmd');
    expect(() => EditorSchema.parse(editors[0]!)).not.toThrow();
  });

  it('falls back to the "vs" hint when no path contains "vs code"', async () => {
    mockWhereFor('code', 'C:\\Qoder\\bin\\code.cmd\nC:\\Tools\\vscode-portable\\code.cmd\n');

    const editors = await detectInstalledEditors();

    expect(editors).toHaveLength(1);
    expect(editors[0]!.command).toBe('C:\\Tools\\vscode-portable\\code.cmd');
  });

  it('falls back to a known install path when where has no matching launcher', async () => {
    const fallback = knownEditors()[0]!.fallbackPaths[0]!;
    mockExistsSync.mockImplementation((p) => p === fallback);

    const editors = await detectInstalledEditors();

    expect(editors).toHaveLength(1);
    expect(editors[0]!.name).toBe('VS Code');
    expect(editors[0]!.command).toBe(fallback);
  });

  it('resolves an editor whose fallback path is a glob', async () => {
    const traePath =
      'C:\\Users\\test\\AppData\\Local\\Programs\\TRAE SOLO CN\\bin\\trae-solo-cn.cmd';
    mockGlobSync.mockImplementation((pattern) => (pattern.includes('trae') ? [traePath] : []));

    const editors = await detectInstalledEditors();

    expect(editors).toHaveLength(1);
    expect(editors[0]!.name).toBe('Trae');
    expect(editors[0]!.command).toBe(traePath);
  });

  it('falls back to the bare command for every editor when nothing else resolves', async () => {
    mockIsCommandAvailable.mockResolvedValue(true);

    const editors = await detectInstalledEditors();

    expect(editors.map((e) => e.command)).toEqual([
      'code',
      'pycharm',
      'idea',
      'qoder',
      'cursor',
      'trae',
    ]);
  });

  it('returns empty when nothing is found', async () => {
    expect(await detectInstalledEditors()).toEqual([]);
  });
});
