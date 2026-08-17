#!/usr/bin/env node
import { render } from 'ink';
import { App } from './tui/app.js';

/**
 * Main entry point for the lysun CLI tool.
 *
 * Renders the Ink TUI application and waits for the user to exit.
 * All configuration loading, file watching, and terminal launching
 * is handled internally by the App component.
 */
function main(): void {
  const { waitUntilExit } = render(<App />);
  waitUntilExit().catch(() => {
    // Ink handles cleanup on SIGINT
  });
}

main();
