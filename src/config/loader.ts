import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { watch as chokidarWatch, FSWatcher } from 'chokidar';
import { ZodError } from 'zod';
import { SettingsSchema, type Location, type Agent } from './schema.js';

/**
 * A single entry in the command palette.
 *
 * Each entry represents a launchable option: a directory, a directory+agent
 * combination, or an agent launched in the current working directory.
 */
export interface PaletteEntry {
  /** Display label shown in the palette. */
  label: string;
  /** Short description shown on the right side of the palette (usually the path). */
  description: string;
  /** The directory to navigate to before launching (or process.cwd() for agent-only). */
  directory: string;
  /** The agent command to run, or null if this is a directory-only entry. */
  agentCommand: string | null;
  /** Default arguments for the agent, empty if no agent or no args configured. */
  agentArgs: string[];
  /** Concatenated searchable text for fuzzy matching (name + key + agent name + agent key). */
  searchText: string;
  /** Entry category for grouping and sorting: directory, combo, or agent. */
  category: 'directory' | 'combo' | 'agent';
}

/**
 * Returns the path to the pisces config directory (~/.pisces).
 *
 * @returns The absolute path to the config directory.
 */
function getConfigDir(): string {
  return join(homedir(), '.pisces');
}

/**
 * Reads and parses a JSON file, returning the parsed value or null on failure.
 *
 * @param filePath - The absolute path to the JSON file.
 * @returns The parsed JSON value, or null if the file cannot be read or parsed.
 */
function readJsonFile(filePath: string): unknown | null {
  try {
    const raw = readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

/**
 * Generates the full list of palette entries from locations and agents.
 *
 * Produces three categories of entries:
 * 1. Directory entries — one per location (launch terminal at that directory).
 * 2. Combo entries — Cartesian product of locations × agents (launch agent at that directory).
 * 3. Agent-only entries — one per agent (launch agent in the current working directory).
 *
 * @param locations - The validated list of locations from settings.json.
 * @param agents - The validated list of agents from settings.json.
 * @returns The complete list of palette entries.
 */
function generateEntries(locations: Location[], agents: Agent[]): PaletteEntry[] {
  const entries: PaletteEntry[] = [];

  // Directory entries
  for (const loc of locations) {
    entries.push({
      label: loc.name,
      description: loc.path,
      directory: loc.path,
      agentCommand: null,
      agentArgs: [],
      searchText: `${loc.name} ${loc.key}`,
      category: 'directory',
    });
  }

  // Directory + Agent combo entries
  for (const loc of locations) {
    for (const agent of agents) {
      entries.push({
        label: `${loc.name} + ${agent.name}`,
        description: loc.path,
        directory: loc.path,
        agentCommand: agent.command,
        agentArgs: agent.args,
        searchText: `${loc.name} ${loc.key} ${agent.name} ${agent.key}`,
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

/**
 * Formats a Zod validation error into a human-readable string.
 *
 * @param error - The ZodError to format.
 * @param fileName - The name of the config file that failed validation.
 * @returns A formatted error message string.
 */
function formatZodError(error: ZodError, fileName: string): string {
  const lines = error.errors.map((e) => {
    const path = e.path.join('.');
    return `  - ${path}: ${e.message}`;
  });
  return `Invalid config in ${fileName}:\n${lines.join('\n')}`;
}

/**
 * Loads and validates the pisces configuration from ~/.pisces/settings.json.
 *
 * On first run, creates the config directory and an empty settings.json file.
 * On subsequent runs, reads and validates the file.
 * Exits the process with code 1 and a descriptive error message if
 * validation fails.
 *
 * @returns The complete list of palette entries derived from the config.
 */
export function loadConfig(): PaletteEntry[] {
  const configDir = getConfigDir();

  // Ensure config directory exists
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }

  const settingsPath = join(configDir, 'settings.json');

  // Create empty config file on first run
  if (!existsSync(settingsPath)) {
    writeFileSync(settingsPath, JSON.stringify({ locations: [], agents: [] }, null, 2), 'utf-8');
  }

  // Read and parse settings.json
  const settingsRaw = readJsonFile(settingsPath);
  try {
    const settings = SettingsSchema.parse(settingsRaw);
    return generateEntries(settings.locations, settings.agents);
  } catch (error) {
    if (error instanceof ZodError) {
      console.error(formatZodError(error, 'settings.json'));
    } else {
      console.error('Failed to parse settings.json:', error);
    }
    process.exit(1);
  }
}

/**
 * Watches the pisces settings.json for changes and invokes the callback
 * when a change is detected.
 *
 * Uses chokidar with a 500ms debounce to avoid triggering on partial writes.
 *
 * @param onChange - The callback to invoke when the config file changes.
 * @returns The chokidar FSWatcher instance.
 */
export function watchConfig(onChange: () => void): FSWatcher {
  const configDir = getConfigDir();
  const watcher = chokidarWatch(join(configDir, 'settings.json'), {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 500,
      pollInterval: 100,
    },
  });

  watcher.on('change', onChange);
  watcher.on('add', onChange);

  return watcher;
}
