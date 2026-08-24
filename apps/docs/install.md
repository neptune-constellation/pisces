# Installation

pisces is distributed on npm as `@lysun001/pisces`.

## Requirements

- **Node.js 22 or later**
- A terminal on Windows, macOS, or Linux (see [platform support](#platform-support))

## Install

```bash
npm install -g @lysun001/pisces
```

Then run it:

```bash
pis
```

The search palette opens immediately. See [Quick Start](./quickstart) for the first-run walkthrough.

## Keeping up to date

Run the built-in updater at any time:

```bash
pis self-update
```

See [Self-Update](./update) for details.

## Platform support

When you launch an entry, pisces opens a **new terminal window** at the target directory:

| Platform | Terminal                                                                                                        |
| -------- | --------------------------------------------------------------------------------------------------------------- |
| Windows  | PowerShell (new window via `Start-Process`)                                                                     |
| macOS    | Terminal.app (via `osascript`)                                                                                  |
| Linux    | Auto-detected: gnome-terminal → x-terminal-emulator → xterm → konsole → xfce4-terminal → terminator → alacritty |

## Uninstall

```bash
npm uninstall -g @lysun001/pisces
```

Your configuration in `~/.pisces/` is left untouched; delete that directory manually if you want it gone.
