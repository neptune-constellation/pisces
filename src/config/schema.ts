import { z } from 'zod';

/**
 * Zod schema for a single position (directory) entry in position.json.
 *
 * Each position represents a project directory that the user wants to
 * quickly navigate to or launch agents from.
 */
export const PositionSchema = z.object({
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
 * Zod schema for a single agent entry in agent.json.
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
 * Zod schema for the root position.json file — an array of positions.
 */
export const PositionsConfigSchema = z.array(PositionSchema);

/**
 * Zod schema for the root agent.json file — an array of agents.
 */
export const AgentsConfigSchema = z.array(AgentSchema);

/**
 * A validated position entry from position.json.
 */
export type Position = z.infer<typeof PositionSchema>;

/**
 * A validated agent entry from agent.json.
 */
export type Agent = z.infer<typeof AgentSchema>;
