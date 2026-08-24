import { execFile } from 'node:child_process';
import { existsSync, globSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { join } from 'node:path';
import { isCommandAvailable } from './known-agents.js';
import type { Editor } from './schema.js';

/**
 * A known code editor/IDE that onboarding can auto-detect.
 */
export interface KnownEditor {
  /** Display name written into the generated config entry. */
  name: string;
  /** CLI command looked up on PATH (e.g. `code`). */
  command: string;
  /** Search key(s) for the generated entry. */
  keys: string[];
  /**
   * Absolute launcher paths checked when the command is not on PATH. Entries may
   * contain a `*` glob to cover versioned install directories (e.g. JetBrains).
   */
  fallbackPaths: string[];
  /**
   * Optional substrings (matched case-insensitively, in order) used to pick the
   * right launcher when `where` resolves the command to several paths — for
   * example a third-party IDE that also ships a `code` shim ahead of VS Code.
   */
  pathMatch?: string[];
}

/**
 * Builds the fallback launcher patterns for a JetBrains IDE.
 *
 * JetBrains installs under versioned directories (e.g. `IntelliJ IDEA 2026.1`)
 * and via the Toolbox app (`ch-0/<version>`), so these patterns use `*` globs to
 * match any version.
 *
 * @param currentPlatform - The current platform.
 * @param localAppData - The Local AppData directory (Windows only).
 * @param home - The user home directory.
 * @param winBin - The launcher executable name on Windows (e.g. `idea64.exe`).
 * @param unixBin - The launcher name on macOS/Linux (e.g. `idea`).
 * @param standardDir - The versioned install directory prefix (e.g. `IntelliJ IDEA`).
 * @param toolboxAppIds - The Toolbox app IDs for this IDE (e.g. `IDEA-U`).
 * @returns The ordered list of fallback launcher patterns.
 */
function jetbrainsFallbackPaths(
  currentPlatform: NodeJS.Platform,
  localAppData: string,
  home: string,
  winBin: string,
  unixBin: string,
  standardDir: string,
  toolboxAppIds: string[],
): string[] {
  if (currentPlatform === 'win32') {
    const paths: string[] = [];
    for (const appId of toolboxAppIds) {
      paths.push(
        join(localAppData, 'JetBrains', 'Toolbox', 'apps', appId, 'ch-0', '*', 'bin', winBin),
      );
    }
    paths.push(join('C:\\Program Files', 'JetBrains', `${standardDir}*`, 'bin', winBin));
    paths.push(join('C:\\Program Files (x86)', 'JetBrains', `${standardDir}*`, 'bin', winBin));
    return paths;
  }

  if (currentPlatform === 'darwin') {
    return [`/Applications/${standardDir}*.app/Contents/MacOS/${unixBin}`];
  }

  const paths: string[] = [];
  for (const appId of toolboxAppIds) {
    paths.push(
      join(
        home,
        '.local',
        'share',
        'JetBrains',
        'Toolbox',
        'apps',
        appId,
        'ch-0',
        '*',
        'bin',
        `${unixBin}.sh`,
      ),
    );
  }
  return paths;
}

/**
 * Builds the fixed list of editors onboarding scans for.
 *
 * The `command` is looked up on PATH first; when absent, `fallbackPaths` are
 * the platform-specific default install locations of the editor launcher.
 *
 * @returns The known editors with fallback paths for the current platform.
 */
export function knownEditors(): KnownEditor[] {
  const home = homedir();
  const localAppData = process.env.LOCALAPPDATA ?? join(home, 'AppData', 'Local');
  const currentPlatform = platform();

  const vscodeFallbackPaths =
    currentPlatform === 'win32'
      ? [
          join(localAppData, 'Programs', 'Microsoft VS Code', 'bin', 'code.cmd'),
          join('C:\\Program Files', 'Microsoft VS Code', 'bin', 'code.cmd'),
          join('C:\\Program Files (x86)', 'Microsoft VS Code', 'bin', 'code.cmd'),
        ]
      : currentPlatform === 'darwin'
        ? ['/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code']
        : ['/usr/bin/code', '/usr/share/code/bin/code', '/snap/bin/code'];

  return [
    {
      name: 'VS Code',
      command: 'code',
      keys: ['vscode'],
      fallbackPaths: vscodeFallbackPaths,
      pathMatch: ['vs code', 'vs'],
    },
    {
      name: 'PyCharm',
      command: 'pycharm',
      keys: ['pycharm'],
      fallbackPaths: jetbrainsFallbackPaths(
        currentPlatform,
        localAppData,
        home,
        'pycharm64.exe',
        'pycharm',
        'PyCharm',
        ['PyCharm-P', 'PyCharm-C'],
      ),
      pathMatch: ['pycharm'],
    },
    {
      name: 'IntelliJ IDEA',
      command: 'idea',
      keys: ['idea'],
      fallbackPaths: jetbrainsFallbackPaths(
        currentPlatform,
        localAppData,
        home,
        'idea64.exe',
        'idea',
        'IntelliJ IDEA',
        ['IDEA-U', 'IDEA-C'],
      ),
      pathMatch: ['intellij idea', 'idea'],
    },
    {
      name: 'Qoder',
      command: 'qoder',
      keys: ['qoder'],
      fallbackPaths:
        currentPlatform === 'win32'
          ? [
              join(localAppData, 'Programs', 'Qoder', 'bin', 'qoder.cmd'),
              join(localAppData, 'Programs', 'Qoder IDE', 'bin', 'qoder.cmd'),
              join(home, '.qoder', 'entry', 'qoder.cmd'),
            ]
          : currentPlatform === 'darwin'
            ? ['/Applications/Qoder.app/Contents/Resources/app/bin/qoder']
            : [join(home, '.qoder', 'entry', 'qoder')],
      pathMatch: ['qoder'],
    },
    {
      name: 'Cursor',
      command: 'cursor',
      keys: ['cursor'],
      fallbackPaths:
        currentPlatform === 'win32'
          ? [
              join(localAppData, 'Programs', 'cursor', 'resources', 'app', 'bin', 'cursor.cmd'),
              join(localAppData, 'Programs', 'cursor', 'Cursor.exe'),
            ]
          : currentPlatform === 'darwin'
            ? ['/Applications/Cursor.app/Contents/Resources/app/bin/cursor']
            : [join('/opt', 'cursor', 'cursor')],
      pathMatch: ['cursor'],
    },
    {
      name: 'Trae',
      command: 'trae',
      keys: ['trae'],
      fallbackPaths:
        currentPlatform === 'win32'
          ? [
              join(localAppData, 'Programs', 'Trae*', 'bin', 'trae*.cmd'),
              join(localAppData, 'Programs', 'Trae*', 'bin', 'trae*.exe'),
            ]
          : currentPlatform === 'darwin'
            ? ['/Applications/Trae*.app/Contents/Resources/app/bin/trae']
            : [],
      pathMatch: ['trae'],
    },
  ];
}

/**
 * Resolves the real launcher path for a command via `where`, preferring the
 * candidate whose path contains one of the given hints.
 *
 * `where code` may list several shims when more than one tool ships a `code`
 * command (e.g. VS Code and a third-party IDE), so the first match on PATH is
 * not necessarily the editor we want. Each hint is tried in order against the
 * candidates; the first candidate containing the hint (case-insensitively) wins.
 *
 * Real Windows executables (`.exe`/`.cmd`/`.bat`/`.com`) are preferred over
 * extensionless shims such as VS Code's `code` shell script.
 *
 * @param command - The command name to resolve (e.g. `code`).
 * @param hints - Ordered substrings identifying the desired editor's path.
 * @returns The resolved absolute launcher path, or null when no candidate matches.
 */
function resolvePreferredLauncher(command: string, hints: string[]): Promise<string | null> {
  return new Promise((resolve) => {
    // `where` is Windows-only; other platforms have no such multi-shim conflict.
    if (platform() !== 'win32') {
      resolve(null);
      return;
    }

    execFile('where', [command], { timeout: 2000 }, (error, stdout) => {
      if (error) {
        resolve(null);
        return;
      }

      const candidates = stdout
        .toString()
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      const executables = candidates.filter((path) => /\.(exe|cmd|bat|com)$/i.test(path));
      const pool = executables.length > 0 ? executables : candidates;

      for (const hint of hints) {
        const needle = hint.toLowerCase();
        const match = pool.find((path) => path.toLowerCase().includes(needle));
        if (match !== undefined) {
          resolve(match);
          return;
        }
      }

      resolve(null);
    });
  });
}

/**
 * Resolves the first existing fallback launcher path.
 *
 * Paths containing a `*` are treated as glob patterns (to cover versioned
 * install directories, e.g. JetBrains) and expanded with `globSync`; exact paths
 * are checked with `existsSync`.
 *
 * @param fallbackPaths - The ordered fallback paths/patterns for an editor.
 * @returns The first matching launcher path, or null when none exist.
 */
function resolveFallbackPath(fallbackPaths: string[]): string | null {
  for (const pattern of fallbackPaths) {
    if (pattern.includes('*')) {
      // globSync expects forward-slash separators even on Windows.
      const matches = globSync(pattern.replace(/\\/g, '/'));
      if (matches.length > 0) {
        return matches[0] ?? null;
      }
    } else if (existsSync(pattern)) {
      return pattern;
    }
  }
  return null;
}

/**
 * Resolves the launcher for a single known editor, in priority order:
 * 1. the real launcher via `where` + path hints (handles PATH conflicts),
 * 2. one of the editor's known install locations, then
 * 3. the bare command on PATH.
 *
 * @param known - The known editor definition to resolve.
 * @returns The launcher command/path to use, or null when not installed.
 */
async function resolveEditorLauncher(known: KnownEditor): Promise<string | null> {
  const preferred = known.pathMatch
    ? await resolvePreferredLauncher(known.command, known.pathMatch)
    : null;
  if (preferred !== null) {
    return preferred;
  }

  const fallback = resolveFallbackPath(known.fallbackPaths);
  if (fallback !== null) {
    return fallback;
  }

  if (await isCommandAvailable(known.command)) {
    return known.command;
  }

  return null;
}

/**
 * Detects which known editors are installed on the current machine.
 *
 * An editor is considered installed when its launcher can be resolved to a
 * concrete path or command (see `resolveEditorLauncher` for the priority order).
 *
 * @returns Config entries for the installed editors.
 */
export async function detectInstalledEditors(): Promise<Editor[]> {
  const editors: Editor[] = [];
  for (const known of knownEditors()) {
    const launcher = await resolveEditorLauncher(known);
    if (launcher !== null) {
      editors.push({ name: known.name, command: launcher, key: known.keys, args: [] });
    }
  }
  return editors;
}
