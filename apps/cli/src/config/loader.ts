import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { watch as chokidarWatch, FSWatcher } from 'chokidar';
import { ZodError } from 'zod';
import {
  SettingsSchema,
  type Location,
  type Agent,
  type Editor,
  type SettingsInput,
  type DefaultConfig,
} from './schema.js';

/**
 * Error thrown when the pisces settings file cannot be read or is invalid.
 *
 * Carries a human-readable, English message suitable for display in the TUI.
 */
export class ConfigError extends Error {
  /**
   * Creates a configuration error.
   *
   * @param message - The human-readable error message.
   */
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

/**
 * The result of loading the pisces configuration: palette entries for the
 * search palette and an optional default launch shortcut.
 */
export interface ConfigData {
  /** Palette entries derived from locations and agents. */
  entries: PaletteEntry[];
  /** The optional Ctrl+D default launch shortcut, or null if not configured. */
  defaultConfig: DefaultConfig | null;
}

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
  /** The agent command to run, or null if this entry does not run an agent. */
  agentCommand: string | null;
  /** Default arguments for the agent, empty if no agent or no args configured. */
  agentArgs: string[];
  /** The editor launcher (command or executable path), or null if this entry does not open an editor. */
  editorCommand: string | null;
  /** Default arguments for the editor, empty if no editor or no args configured. */
  editorArgs: string[];
  /** The keys of the matched location(s), empty for agent/editor-only entries. */
  locationKeys: string[];
  /** The keys of the matched agent(s), empty for non-agent entries. */
  agentKeys: string[];
  /** The keys of the matched editor(s), empty for non-editor entries. */
  editorKeys: string[];
  /** Entry category for grouping and sorting: directory, combo, agent, or editor. */
  category: 'directory' | 'combo' | 'agent' | 'editor';
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
 * Ensures the pisces config directory exists.
 */
function ensureConfigDir(): void {
  const configDir = getConfigDir();
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }
}

/**
 * Returns the absolute path to the pisces settings file.
 *
 * @returns The path to ~/.pisces/settings.json.
 */
function getSettingsPath(): string {
  return join(getConfigDir(), 'settings.json');
}

/**
 * Extracts a human-readable message from an unknown thrown value.
 *
 * @param error - The thrown value.
 * @returns A string message.
 */
function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Generates the full list of palette entries from locations, agents, and editors.
 *
 * Produces five groups of entries:
 * 1. Directory entries — one per location (launch terminal at that directory).
 * 2. Combo entries — Cartesian product of locations × agents (launch agent at that directory).
 * 3. Editor combo entries — Cartesian product of locations × editors (open that directory in the editor).
 * 4. Agent-only entries — one per agent (launch agent in the current working directory).
 * 5. Editor-only entries — one per editor (open the editor in the current working directory).
 *
 * @param locations - The validated list of locations from settings.json.
 * @param agents - The validated list of agents from settings.json.
 * @param editors - The validated list of editors from settings.json.
 * @param options - Optional flags disabling agent/editor entry groups.
 * @returns The complete list of palette entries.
 */
export function generateEntries(
  locations: Location[],
  agents: Agent[],
  editors: Editor[],
  options: { agentsDisabled?: boolean; editorsDisabled?: boolean } = {},
): PaletteEntry[] {
  const entries: PaletteEntry[] = [];

  // Directory entries
  for (const loc of locations) {
    entries.push({
      label: loc.name,
      description: loc.path,
      directory: loc.path,
      agentCommand: null,
      agentArgs: [],
      editorCommand: null,
      editorArgs: [],
      locationKeys: loc.key,
      agentKeys: [],
      editorKeys: [],
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
        editorCommand: null,
        editorArgs: [],
        locationKeys: loc.key,
        agentKeys: agent.key,
        editorKeys: [],
        category: 'combo',
      });
    }
  }

  // Directory + Editor combo entries
  for (const loc of locations) {
    for (const editor of editors) {
      entries.push({
        label: `${loc.name} + ${editor.name}`,
        description: loc.path,
        directory: loc.path,
        agentCommand: null,
        agentArgs: [],
        editorCommand: editor.command,
        editorArgs: editor.args,
        locationKeys: loc.key,
        agentKeys: [],
        editorKeys: editor.key,
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
      editorCommand: null,
      editorArgs: [],
      locationKeys: [],
      agentKeys: agent.key,
      editorKeys: [],
      category: 'agent',
    });
  }

  // Editor-only entries
  for (const editor of editors) {
    entries.push({
      label: editor.name,
      description: '(current)',
      directory: process.cwd(),
      agentCommand: null,
      agentArgs: [],
      editorCommand: editor.command,
      editorArgs: editor.args,
      locationKeys: [],
      agentKeys: [],
      editorKeys: editor.key,
      category: 'editor',
    });
  }

  const { agentsDisabled = false, editorsDisabled = false } = options;

  return entries.filter((entry) => {
    if (agentsDisabled && entry.agentCommand !== null) {
      return false;
    }
    if (editorsDisabled && entry.editorCommand !== null) {
      return false;
    }
    return true;
  });
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
 *
 * Throws a ConfigError with a descriptive message when the file cannot be read
 * or fails validation, instead of terminating the process, so the caller can
 * surface the problem in the TUI.
 *
 * @returns The palette entries and optional default config from settings.json.
 * @throws {ConfigError} If the settings file cannot be read or is invalid.
 */
export function loadConfig(): ConfigData {
  ensureConfigDir();

  const settingsPath = getSettingsPath();

  // Create empty config file on first run
  if (!existsSync(settingsPath)) {
    writeFileSync(
      settingsPath,
      JSON.stringify({ locations: [], agents: [], editors: [] }, null, 2),
      'utf-8',
    );
  }

  // Read the settings file, surfacing a read failure separately from a parse failure
  let raw: string;
  try {
    raw = readFileSync(settingsPath, 'utf-8');
  } catch (error) {
    throw new ConfigError(`Failed to read settings.json: ${errorMessage(error)}`);
  }

  let settingsRaw: unknown;
  try {
    settingsRaw = JSON.parse(raw) as unknown;
  } catch (error) {
    throw new ConfigError(`Failed to parse settings.json: ${errorMessage(error)}`);
  }

  const result = SettingsSchema.safeParse(settingsRaw);
  if (!result.success) {
    throw new ConfigError(formatZodError(result.error, 'settings.json'));
  }

  const entries = generateEntries(result.data.locations, result.data.agents, result.data.editors, {
    agentsDisabled: result.data.agentsDisabled,
    editorsDisabled: result.data.editorsDisabled,
  });
  const defaultConfig = result.data.default ?? null;

  return { entries, defaultConfig };
}

/**
 * Returns whether the pisces settings file already exists.
 *
 * Used to decide whether first-run onboarding should run before the palette.
 *
 * @returns True when ~/.pisces/settings.json exists.
 */
export function hasSettingsFile(): boolean {
  return existsSync(getSettingsPath());
}

/**
 * Writes the pisces settings file, creating the config directory if needed.
 *
 * @param settings - The settings to persist (locations and agents).
 */
export function writeSettings(settings: SettingsInput): void {
  ensureConfigDir();
  writeFileSync(getSettingsPath(), JSON.stringify(settings, null, 2), 'utf-8');
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
  const watcher = chokidarWatch(getSettingsPath(), {
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
