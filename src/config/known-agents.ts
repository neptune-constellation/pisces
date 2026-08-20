import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { homedir, platform } from 'node:os';
import { join } from 'node:path';
import type { Agent } from './schema.js';

/**
 * A known AI coding agent CLI that onboarding can auto-detect.
 */
export interface KnownAgent {
  /** The launch command, also used as the entry's name and key. */
  command: string;
  /** Config directories (relative to the user home) that indicate installation. */
  configDirs: string[];
}

/**
 * The fixed list of agents onboarding scans for.
 *
 * The `command` is the CLI launch command (which may differ from the product
 * name), and `configDirs` are fallback signals checked when the command is not
 * found on PATH.
 */
export const KNOWN_AGENTS: KnownAgent[] = [
  { command: 'claude', configDirs: ['.claude'] },
  { command: 'codex', configDirs: ['.codex'] },
  { command: 'opencode', configDirs: ['.config/opencode', '.opencode'] },
  { command: 'kimi', configDirs: ['.kimi-code'] },
  { command: 'crush', configDirs: [] },
  { command: 'cline', configDirs: ['.cline'] },
  { command: 'kilo', configDirs: ['.config/kilo'] },
  { command: 'pi', configDirs: [] },
  { command: 'qodercli', configDirs: [] },
  { command: 'grok', configDirs: ['.grok'] },
  { command: 'gemini', configDirs: ['.gemini'] },
  { command: 'omp', configDirs: ['.omp'] },
  { command: 'reasonix', configDirs: ['.reasonix'] },
];

/**
 * Converts a list of detected command names into agent entries.
 *
 * name and command are both set to the command name, and key is a single
 * element array containing that command, matching the onboarding requirement
 * of keeping the three fields aligned.
 *
 * @param commands - The detected launch command names.
 * @returns One agent entry per command.
 */
export function toAgentEntries(commands: string[]): Agent[] {
  return commands.map((command) => ({
    name: command,
    command,
    key: [command],
    args: [],
  }));
}

/**
 * Detects which known agents are installed on the current machine.
 *
 * An agent is considered installed when its launch command is available on
 * PATH, or when one of its known config directories exists.
 *
 * @returns The launch command names of the installed agents.
 */
export async function detectInstalledAgents(): Promise<string[]> {
  const commands: string[] = [];
  for (const agent of KNOWN_AGENTS) {
    const onPath = await isCommandAvailable(agent.command);
    const hasConfigDir = agent.configDirs.some((dir) => existsSync(join(homedir(), dir)));
    if (onPath || hasConfigDir) {
      commands.push(agent.command);
    }
  }
  return commands;
}

/**
 * Checks whether a command is available on PATH.
 *
 * @param command - The command name to look up.
 * @returns True when the command resolves, false otherwise.
 */
async function isCommandAvailable(command: string): Promise<boolean> {
  return new Promise((resolve) => {
    const checker = platform() === 'win32' ? 'where' : 'which';
    execFile(checker, [command], { timeout: 2000 }, (error) => {
      resolve(!error);
    });
  });
}
