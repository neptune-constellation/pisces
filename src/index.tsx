#!/usr/bin/env node
import { render } from 'ink';
import { Root } from './tui/root.js';
import { selfUpdate } from './cli/update.js';
import { showVersion } from './cli/version.js';
import { showHelp } from './cli/help.js';

// CLI subcommands and flags handled before the TUI launches
const UPDATE_COMMANDS = new Set(['self-update', '--update', '-u']);
const VERSION_COMMANDS = new Set(['--version', '-v']);
const HELP_COMMANDS = new Set(['--help', '-h']);

// Check for CLI subcommands before launching the TUI
const args = process.argv.slice(2);
if (args.some((arg) => VERSION_COMMANDS.has(arg))) {
  showVersion();
}
if (args.some((arg) => HELP_COMMANDS.has(arg))) {
  showHelp();
}
if (args.some((arg) => UPDATE_COMMANDS.has(arg))) {
  selfUpdate();
}

/**
 * Main entry point for the pisces CLI tool.
 *
 * Enters the alternate screen buffer before rendering so the TUI is drawn on
 * a separate buffer. When the app exits (via Esc or Ctrl+C), the alternate
 * buffer is discarded and the main terminal screen is restored — leaving only
 * the `pis` command the user originally typed.
 */
function main(): void {
  // Enter the alternate screen buffer before Ink renders
  process.stdout.write('\x1b[?1049h');

  const { waitUntilExit } = render(<Root />);
  waitUntilExit()
    .catch(() => {
      // Ink resolves/rejects on exit — cleanup happens in finally
    })
    .finally(() => {
      // Leave the alternate screen buffer, restoring the original terminal
      process.stdout.write('\x1b[?1049l');
    });
}

main();
