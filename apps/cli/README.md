# pisces

A terminal TUI launcher for AI coding agents — quickly open projects and agents from one place.

## Features

- **Keystroke-first search** — type `locationKey + agentKey` prefixes to filter launch targets
- **Agent combos** — open a project directory _and_ start an AI agent there in one keystroke
- **Editor launch** — open any location (or the current directory) in VS Code or another configured editor/IDE
- **Subdirectory browsing** — type `locationKey + /` to drill into a location
- **Default launch** — `Ctrl+D` opens your configured default path and command instantly
- **Recent opens** — `Ctrl+R` lists your last 10 launches (with open time) and re-opens any of them
- **Self-update** — `pis self-update` upgrades to the latest npm version

## Install

Requires Node.js 22 or later.

```bash
npm install -g @lysun001/pisces
```

## Quick Start

Run `pis` to open the search palette:

```bash
pis
```

On first run, pisces detects installed agents and editors and initializes `~/.pisces/settings.json` for you. Configure your project directories, agents, and editors there:

```json
{
  "locations": [{ "name": "code", "path": "C:\\Users\\You\\Desktop\\code", "key": ["b", "beta"] }],
  "agents": [{ "name": "opencode", "command": "opencode", "key": ["oc", "open"] }],
  "editors": [{ "name": "VS Code", "command": "code", "key": "vscode" }]
}
```

Type `b` to see the directory, `boc` to launch it with opencode, `b/` to browse its subdirectories.

## Documentation

Full documentation: **[neptune-constellation.github.io/pisces](https://neptune-constellation.github.io/pisces/)** ([中文](https://neptune-constellation.github.io/pisces/zh/))

- [Installation](https://neptune-constellation.github.io/pisces/install)
- [Quick Start](https://neptune-constellation.github.io/pisces/quickstart)
- [Configuration reference](https://neptune-constellation.github.io/pisces/config)
- [Search & keyboard shortcuts](https://neptune-constellation.github.io/pisces/search)
- [Self-update](https://neptune-constellation.github.io/pisces/update)
- [FAQ](https://neptune-constellation.github.io/pisces/faq)

## License

MIT
