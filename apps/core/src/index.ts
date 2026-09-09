/**
 * Public entry point for `@lysun001/pisces-core`.
 *
 * Re-exports the pure config/search/history/launcher logic shared by the CLI
 * and the desktop app, so callers import everything from the package root.
 */
export * from './config/schema.js';
export * from './config/loader.js';
export * from './config/known-agents.js';
export * from './config/known-editors.js';
export * from './search/fuzzy.js';
export * from './history/store.js';
export * from './launcher/spawn.js';
