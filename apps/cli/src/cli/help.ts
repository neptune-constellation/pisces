import { readVersion } from './version.js';

/**
 * Prints the pisces help text to stdout and exits.
 *
 * Covers all CLI flags, TUI keyboard shortcuts, search behavior, and
 * subdirectory browsing.
 */
export function showHelp(): void {
  const version = readVersion();

  console.log(
    `
pisces v${version}
A terminal TUI launcher for AI coding agents.

USAGE
  pis                         Launch the interactive palette
  pis <command>               Run a command (see below)

COMMANDS
  self-update                 Check for and install the latest version

OPTIONS
  -u, --update                Same as self-update
  -v, --version               Show the current version
  -h, --help                  Show this help message

SEARCH
  The palette uses key-based prefix matching: locationKey + agentKey or
  locationKey + editorKey.

  b          Show location "b" and all its agent/editor combos
  boc        Location "b" + agent "oc" (exact combo)
  bvscode    Location "b" opened in the editor keyed "vscode"
  oc         Agent "oc" in the current directory
  vscode     Editor "vscode" in the current directory
  b/pro      Subdirectories of location "b" starting with "pro"

  Editors (the "editors" section in settings.json) open a directory in a
  GUI editor instead of a terminal. Subdirectory mode (after / or \\)
  only opens a terminal — it does not combine with agents or editors.

KEYBOARD
  ↑ / Ctrl+K    Navigate up
  ↓ / Ctrl+J    Navigate down
  Enter         Select and launch
  Ctrl+D        Launch the default path/command (configure in settings.json)
  Esc / Ctrl+C  Quit

DEFAULT LAUNCH (Ctrl+D)
  Configure a "default" section in settings.json to quickly open a terminal
  at a fixed path with a fixed command:

    "default": { "path": "/path/to/project", "command": "claude" }

EXAMPLES
  pis                         Open the palette, browse projects
  pis -u                      Update pisces to the latest version
  pis --version               Print the installed version
`.trimStart(),
  );

  process.exit(0);
}
