#!/usr/bin/env node
import { render } from 'ink';
import { App } from './tui/app.js';

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

  const { waitUntilExit } = render(<App />);
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
