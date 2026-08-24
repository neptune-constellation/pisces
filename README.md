# pisces

[Documentation](https://neptune-constellation.github.io/pisces/) | [中文文档](https://neptune-constellation.github.io/pisces/zh/)

A terminal TUI launcher for AI coding agents — quickly open projects and agents from one place.

[![npm version](https://img.shields.io/npm/v/@lysun001/pisces)](https://www.npmjs.com/package/@lysun001/pisces)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D22-brightgreen)](https://nodejs.org)

## Features

- **Keystroke-first search** — type `locationKey + agentKey` prefixes to filter launch targets
- **Agent combos** — open a project directory _and_ start an AI agent there in one keystroke
- **Subdirectory browsing** — type `locationKey + /` to drill into a location
- **Default launch** — `Ctrl+D` opens your configured default path and command instantly
- **Self-update** — `pis self-update` upgrades to the latest npm version

## Installation

```bash
npm install -g @lysun001/pisces
```

Requires Node.js 22 or later. Then run:

```bash
pis
```

## Quick Start

On first run, pisces can detect your installed agents and initialize the config for you. Configure your project directories and agents in `~/.pisces/settings.json`:

```json
{
  "locations": [
    {
      "name": "code",
      "path": "C:\\Users\\You\\Desktop\\code",
      "key": ["b", "beta"]
    }
  ],
  "agents": [
    {
      "name": "opencode",
      "command": "opencode",
      "key": ["oc", "open"]
    }
  ],
  "default": {
    "path": "C:\\Users\\You\\Desktop\\code",
    "command": "opencode"
  }
}
```

Type `b` to see the directory, `boc` to launch it with opencode, `b/` to browse its subdirectories.

## Documentation

The full documentation lives at **[neptune-constellation.github.io/pisces](https://neptune-constellation.github.io/pisces/)** ([中文](https://neptune-constellation.github.io/pisces/zh/)):

- [Installation](https://neptune-constellation.github.io/pisces/install)
- [Quick Start](https://neptune-constellation.github.io/pisces/quickstart)
- [Configuration reference](https://neptune-constellation.github.io/pisces/config)
- [Search & keyboard shortcuts](https://neptune-constellation.github.io/pisces/search)
- [Subdirectory browsing](https://neptune-constellation.github.io/pisces/subdirs)
- [Self-update](https://neptune-constellation.github.io/pisces/update)
- [FAQ](https://neptune-constellation.github.io/pisces/faq)

## Development

This is a pnpm-workspace monorepo: [`apps/cli`](apps/cli) is the TUI launcher, [`apps/docs`](apps/docs) is the VitePress documentation site.

```bash
git clone https://github.com/neptune-constellation/pisces.git
cd pisces

pnpm install        # install dependencies for all packages
pnpm dev            # run the TUI in development mode
pnpm test           # run the CLI test suite
pnpm lint           # lint all packages
pnpm typecheck      # typecheck all packages
pnpm build          # build all packages
pnpm docs:dev       # preview the documentation site locally
```

## License

MIT © lysun001
