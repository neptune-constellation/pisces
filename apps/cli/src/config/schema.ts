import { z } from 'zod';

/**
 * Schema for a single shortcut key: 1-20 lowercase alphanumeric characters
 * with hyphens only.
 */
const KeySchema = z
  .string()
  .min(1)
  .max(20)
  .regex(/^[a-z0-9-]+$/, 'Key must be lowercase alphanumeric with hyphens only');

/**
 * Schema for one or more shortcut keys. Accepts either a single key string or
 * an array of key strings, and normalizes both to an array of keys.
 */
const KeysSchema = z
  .union([KeySchema, z.array(KeySchema).min(1)])
  .transform((value) => (Array.isArray(value) ? value : [value]));

/**
 * Zod schema for a single location (directory) entry.
 *
 * Each location represents a project directory that the user wants to
 * quickly navigate to or launch agents from.
 */
export const LocationSchema = z.object({
  /** Display name for the directory (1-50 characters, any characters allowed). */
  name: z.string().min(1).max(50),
  /** Absolute filesystem path to the directory. */
  path: z.string().min(1),
  /** Shortcut key(s) for quick filtering (each 1-20 chars, lowercase alphanumeric with hyphens only). */
  key: KeysSchema,
});

/**
 * Zod schema for a single agent entry.
 *
 * Each agent represents an AI coding agent CLI command that can be
 * launched from any directory.
 */
export const AgentSchema = z.object({
  /** Display name for the agent (1-50 characters, any characters allowed). */
  name: z.string().min(1).max(50),
  /** The shell command to execute (e.g., "crush", "opencode", "claude"). */
  command: z.string().min(1),
  /** Shortcut key(s) for quick filtering (each 1-20 chars, lowercase alphanumeric with hyphens only). */
  key: KeysSchema,
  /** Default arguments to pass to the agent command. */
  args: z.array(z.string()).default([]),
});

/**
 * Zod schema for a single editor/IDE entry.
 *
 * Each editor represents a GUI code editor or IDE (e.g. VS Code) that can
 * open a directory. Unlike agents, editors launch a GUI process directly
 * instead of running inside a new terminal window.
 */
export const EditorSchema = z.object({
  /** Display name for the editor (1-50 characters, any characters allowed). */
  name: z.string().min(1).max(50),
  /** Launcher command on PATH (e.g. "code") or absolute path to the executable. */
  command: z.string().min(1),
  /** Shortcut key(s) for quick filtering (each 1-20 chars, lowercase alphanumeric with hyphens only). */
  key: KeysSchema,
  /** Default arguments to pass before the directory argument. */
  args: z.array(z.string()).default([]),
});

/**
 * Zod schema for the default launch shortcut.
 *
 * When configured, the user can press Ctrl+D to quickly open a terminal at
 * the specified path and optionally run a command there.
 */
export const DefaultSchema = z.object({
  /** Absolute filesystem path to open (leave empty to disable). */
  path: z.string().min(1).optional(),
  /** Shell command to run after opening the path (leave empty for no command). */
  command: z.string().min(1).optional(),
});

/**
 * Zod schema for the root settings.json file.
 *
 * Contains three arrays: locations (project directories), agents (AI agent
 * commands), and editors (GUI editors/IDEs). All default to empty arrays when
 * not provided. `agentsDisabled`/`editorsDisabled` hide those entry groups when
 * set to true. An optional default shortcut can be configured for Ctrl+D.
 */
export const SettingsSchema = z.object({
  /** Project directories to launch from. */
  locations: z.array(LocationSchema).default([]),
  /** AI agent commands to launch. */
  agents: z.array(AgentSchema).default([]),
  /** GUI editors/IDEs that can open a directory. */
  editors: z.array(EditorSchema).default([]),
  /** When true, agent entries are hidden from the palette. */
  agentsDisabled: z.boolean().default(false),
  /** When true, editor entries are hidden from the palette. */
  editorsDisabled: z.boolean().default(false),
  /** Optional default path and command for the Ctrl+D quick-launch shortcut. */
  default: DefaultSchema.optional(),
});

/**
 * A validated location entry from settings.json.
 */
export type Location = z.infer<typeof LocationSchema>;

/**
 * A validated agent entry from settings.json.
 */
export type Agent = z.infer<typeof AgentSchema>;

/**
 * A validated editor entry from settings.json.
 */
export type Editor = z.infer<typeof EditorSchema>;

/**
 * A validated settings object (locations and agents).
 */
export type Settings = z.infer<typeof SettingsSchema>;

/**
 * The settings shape accepted when writing settings.json, where optional fields
 * (such as `agentsDisabled`/`editorsDisabled`) may be omitted.
 */
export type SettingsInput = z.input<typeof SettingsSchema>;

/**
 * The optional default launch shortcut configuration.
 */
export type DefaultConfig = z.infer<typeof DefaultSchema>;
