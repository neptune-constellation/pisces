import { z } from 'zod';

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
  /** Shortcut key for quick filtering (1-20 characters, lowercase alphanumeric with hyphens only). */
  key: z
    .string()
    .min(1)
    .max(20)
    .regex(/^[a-z0-9-]+$/, 'Key must be lowercase alphanumeric with hyphens only'),
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
  /** Shortcut key for quick filtering (1-20 characters, lowercase alphanumeric with hyphens only). */
  key: z
    .string()
    .min(1)
    .max(20)
    .regex(/^[a-z0-9-]+$/, 'Key must be lowercase alphanumeric with hyphens only'),
  /** Default arguments to pass to the agent command. */
  args: z.array(z.string()).default([]),
});

/**
 * Zod schema for the root settings.json file.
 *
 * Contains two arrays: locations (project directories) and agents (AI agent commands).
 * Both default to empty arrays if not provided.
 */
export const SettingsSchema = z.object({
  /** Project directories to launch from. */
  locations: z.array(LocationSchema).default([]),
  /** AI agent commands to launch. */
  agents: z.array(AgentSchema).default([]),
});

/**
 * A validated location entry from settings.json.
 */
export type Location = z.infer<typeof LocationSchema>;

/**
 * A validated agent entry from settings.json.
 */
export type Agent = z.infer<typeof AgentSchema>;
