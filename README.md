# lysun

A terminal TUI launcher for AI coding agents — quickly open projects and agents from one place.

[![npm version](https://img.shields.io/npm/v/@lysun001/lysun)](https://www.npmjs.com/package/@lysun001/lysun)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)

## Installation

```bash
npm install -g @lysun001/lysun
```

Requires Node.js 20 or later.

## Quick Start

1. Create the config directory and files:

```bash
mkdir %USERPROFILE%\.lysun   # Windows
mkdir ~/.lysun               # macOS / Linux
```

2. Configure your project directories in `~/.lysun/position.json`:

```json
[
  {
    "name": "docs",
    "path": "C:\\Users\\You\\Desktop\\docs",
    "key": "a"
  },
  {
    "name": "code",
    "path": "C:\\Users\\You\\Desktop\\code",
    "key": "b"
  }
]
```

3. Configure your AI agents in `~/.lysun/agent.json`:

```json
[
  {
    "name": "crush",
    "command": "crush",
    "key": "cs"
  },
  {
    "name": "opencode",
    "command": "opencode",
    "key": "oc"
  },
  {
    "name": "claude",
    "command": "claude",
    "key": "cl",
    "args": ["--model", "sonnet"]
  }
]
```

4. Run lysun:

```bash
lysun
```

5. Press `/` or `Ctrl+P` to open the command palette, type to filter, and press `Enter` to launch.

## Configuration

### position.json

Each entry represents a project directory:

| Field  | Type     | Description                                                 |
| ------ | -------- | ----------------------------------------------------------- |
| `name` | `string` | Display name (1-50 chars, any characters)                   |
| `path` | `string` | Absolute path to the directory                              |
| `key`  | `string` | Shortcut for quick filtering (1-20 chars, `[a-z0-9-]` only) |

### agent.json

Each entry represents an AI agent CLI command:

| Field     | Type       | Description                                                 |
| --------- | ---------- | ----------------------------------------------------------- |
| `name`    | `string`   | Display name (1-50 chars, any characters)                   |
| `command` | `string`   | Shell command to execute                                    |
| `key`     | `string`   | Shortcut for quick filtering (1-20 chars, `[a-z0-9-]` only) |
| `args`    | `string[]` | Default arguments (optional, defaults to `[]`)              |

## Usage

### Keyboard Shortcuts

| Action          | Key                           |
| --------------- | ----------------------------- |
| Open palette    | `/` or `Ctrl+P`               |
| Close palette   | `Esc`                         |
| Navigate up     | `↑` or `Ctrl+K`               |
| Navigate down   | `↓` or `Ctrl+J`               |
| Select / launch | `Enter`                       |
| Toggle palette  | `Ctrl+P`                      |
| Quit            | `Ctrl+C` or `q` (idle screen) |

### Search Behavior

The palette supports fuzzy search with character-by-character AND matching:

- Type `a` to filter entries whose name or shortcut contains `a`
- Type `ao` to filter entries containing both `a` AND `o`
- Search is case-insensitive
- Results are sorted by category: directories first, then directory+agent combos, then agent-only entries

### Palette Entries

The palette shows three types of entries:

- **📁 Directory** — Opens a new terminal at the configured directory
- **📁 + ⚡ Combo** — Opens a new terminal at the directory with the agent pre-launched (shown only when filtering)
- **⚡ Agent** — Opens the agent in the current working directory

## Platform Support

| Platform | Terminal                                                                                                        |
| -------- | --------------------------------------------------------------------------------------------------------------- |
| Windows  | PowerShell (new window via `Start-Process`)                                                                     |
| macOS    | Terminal.app (via `osascript`)                                                                                  |
| Linux    | Auto-detected: gnome-terminal → x-terminal-emulator → xterm → konsole → xfce4-terminal → terminator → alacritty |

## Development

```bash
# Clone the repo
git clone https://github.com/neptune-constellation/lysun.git
cd lysun

# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Run tests
pnpm test

# Lint
pnpm lint

# Typecheck
pnpm typecheck

# Build
pnpm build
```

## License

MIT © lysun001
