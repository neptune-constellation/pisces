# Spec: pisces CLI TUI tool

Status: ready-for-agent

## Problem Statement

A developer uses multiple AI coding agents (Claude Code, opencode, Crush, Pi, etc.) across multiple project directories. Each time they want to switch between agents or projects, they must manually navigate to the project directory in the file explorer, open a PowerShell window, and type the agent command. This context-switching overhead is repetitive and slows down the workflow. There is no single launcher that combines project directories and agent commands into one quick search-and-launch interface.

## Solution

A terminal-based TUI tool called **pisces** that serves as a unified launcher. Users pre-configure their project directories and AI agents in two JSON config files. Running `pisces` opens a TUI with a command palette — type `/` or `Ctrl+P` to open a fuzzy search, pick a directory or a directory+agent combination, and a new terminal window opens at the right location with the right agent. The tool is distributed as an npm package (`@lysun001/pisces`) and hosted on GitHub (`neptune-constellation/pisces`).

## User Stories

1. As a developer, I want to launch pisces from any terminal by typing `pisces`, so that I can access my project launcher without navigating to a specific directory first.
2. As a developer, I want to configure my project directories in a JSON file (`~/.pisces/position.json`), so that pisces knows which directories I work in.
3. As a developer, I want to configure my AI agents in a JSON file (`~/.pisces/agent.json`), so that pisces knows which agent commands to launch.
4. As a developer, I want each configured directory to have a name and a shortcut key, so that I can quickly identify and filter directories in the palette.
5. As a developer, I want each configured agent to have a name, a shell command, a shortcut key, and optional default arguments, so that I can launch agents with consistent settings.
6. As a developer, I want pisces to auto-create the config directory and empty config files on first run, so that I can start configuring immediately without manual setup.
7. As a developer, I want to see a branded banner when pisces starts, so that I know the tool is running and which version I am using.
8. As a developer, I want to open the command palette by pressing `/` or `Ctrl+P`, so that I can access the launcher with a familiar keyboard shortcut.
9. As a developer, I want to see all configured directories and agent-only entries in the palette when it first opens, so that I can browse without typing.
10. As a developer, I want directory+agent combination entries to appear only when I start typing a filter, so that the initial palette stays clean and manageable.
11. As a developer, I want the palette search to support fuzzy matching by character, so that typing `ao` filters to entries matching both `a` and `o` across names and shortcut keys.
12. As a developer, I want to navigate the palette results with arrow keys (`↑`/`↓`), so that I can select entries with the keyboard.
13. As a developer, I want to select a palette entry by pressing `Enter`, so that I can launch the chosen directory or agent.
14. As a developer, I want to close the palette with `Esc` and return to the idle screen, so that I can back out without launching anything.
15. As a developer, I want to quit pisces with `Ctrl+C`, so that I can exit cleanly when I am done.
16. As a developer, I want selecting a directory-only entry to open a new PowerShell (Windows) or Terminal (macOS/Linux) window at that directory, so that I can start working there immediately.
17. As a developer, I want selecting a directory+agent entry to open a new terminal window at that directory with the agent command pre-executed, so that the agent starts automatically.
18. As a developer, I want selecting an agent-only entry to launch that agent in the current working directory, so that I can quickly start an agent where I already am.
19. As a developer, I want pisces to stay open after launching a terminal window, so that I can launch multiple agents in succession without restarting pisces.
20. As a developer, I want pisces to auto-detect my platform (Windows/macOS/Linux) and use the correct terminal spawning command, so that the tool works across operating systems.
21. As a developer, I want config changes (editing `position.json` or `agent.json`) to be picked up automatically while pisces is running, so that I don't need to restart the tool after adding a new project.
22. As a developer, I want malformed config files to produce clear error messages on startup, so that I can fix the config and retry.
23. As a developer, I want directories that no longer exist on disk to be shown with a warning indicator in the palette, so that I know the config is stale.
24. As a developer, I want the shortcut keys in config files to be restricted to lowercase alphanumeric characters and hyphens (`[a-z0-9-]`), so that typing shortcuts is fast and predictable.
25. As a developer, I want to install pisces globally via `npm install -g @lysun001/pisces`, so that the `pisces` command is available everywhere.
26. As a developer, I want the pisces codebase to follow strict TypeScript (no `any` types, strict mode enabled), so that the code is type-safe and maintainable.
27. As a developer, I want every function in the codebase to have a JSDoc comment, so that the code is self-documenting.
28. As a developer, I want automated pre-commit checks (linting, formatting, typechecking) via Husky, so that code quality is enforced before every commit.

## Implementation Decisions

### Architecture

- **TUI framework**: Ink 5 (React 18+, ESM-only) for rendering the terminal UI.
- **Search**: fuse.js for fuzzy ranking, with a custom character-by-character AND pre-filter applied before Fuse.js scoring.
- **Config validation**: Zod schemas for `position.json` and `agent.json`, with clear error messages on validation failure.
- **Config file watching**: chokidar with 500ms debounce for hot-reloading config changes while pisces is running.
- **Build**: tsup (esbuild-powered) for production builds, tsx for development.
- **Testing**: Vitest with TypeScript-native ESM support.
- **Linting**: ESLint 9 flat config with `typescript-eslint` and `eslint-plugin-jsdoc` for mandatory JSDoc on all functions.
- **Formatting**: Prettier.
- **Pre-commit**: Husky + lint-staged (ESLint fix + Prettier write on staged files) + `tsc --noEmit` typecheck.
- **CI/CD**: Two GitHub Actions workflows — `ci.yml` (lint, typecheck, test on PR/push) and `publish.yml` (build + npm publish on version tags).

### Config schema

The config lives at `~/.pisces/` (resolved via `os.homedir()`). On first run, the directory and empty config files are created automatically.

**position.json** — array of directory entries:

```typescript
interface Position {
  name: string; // 1-50 chars, any characters
  path: string; // absolute filesystem path
  key: string; // 1-20 chars, [a-z0-9-] only
}
```

**agent.json** — array of agent entries:

```typescript
interface Agent {
  name: string; // 1-50 chars, any characters
  command: string; // shell command to execute
  key: string; // 1-20 chars, [a-z0-9-] only
  args: string[]; // default [], optional arguments
}
```

### Palette entry types

Three categories of entries are generated from config:

1. **Directory entries** — one per position. Displayed with a folder icon. Searchable by `position.name` and `position.key`. Launch: open terminal at `position.path`.
2. **Directory + Agent entries** — Cartesian product of positions × agents. Displayed with folder + lightning icons. Searchable by all four fields. Launch: open terminal at `position.path` and run `agent.command` + `agent.args`. Hidden when the palette is first opened; shown only when the user types a filter.
3. **Agent-only entries** — one per agent. Displayed with a lightning icon and "(current)" path label. Searchable by `agent.name` and `agent.key`. Launch: run agent in the current working directory.

### Search behavior

- Query characters are split. Each character must appear (case-insensitive) in at least one search field of the entry.
- The pre-filtered result set is passed to Fuse.js for fuzzy scoring and ranking.
- Fuse.js threshold: `0.4`.
- Results are sorted by score (best match first), then by category (directories → combos → agents).

### Terminal spawning

| Platform | Command                                                                                                                                                |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Windows  | `start powershell -NoExit -Command "cd '<path>'; <agent>"`                                                                                             |
| macOS    | `osascript -e 'tell app "Terminal" to do script "cd <path> && <agent>"'`                                                                               |
| Linux    | Auto-detect, fallback chain: `gnome-terminal` → `x-terminal-emulator` → `xterm` → `konsole` → `xfce4-terminal` → `terminator` → `alacritty -e` → error |

Agent-only entries use the current working directory (`process.cwd()`) as the path.

### TUI component tree

```
<App>                    ← state: paletteOpen, searchQuery, selectedIndex
  <Banner />             ← logo + version, always visible
  {paletteOpen ? (
    <Palette>
      <SearchInput />    ← text input, focused by default
      <ResultsList>      ← filtered entries
        <ResultItem />   ← one per match
      </ResultsList>
      <HintBar />        ← keyboard shortcuts
    </Palette>
  ) : (
    <IdleScreen>
      <HintBar />        ← "Press / or Ctrl+P to search"
    </IdleScreen>
  )}
</App>
```

### Color scheme

- Primary (banner, highlights): `#7C3AED` (violet/purple)
- Accent (selected items, borders): `#06B6D4` (cyan)
- Dim (hints, secondary text): terminal default dim
- Error: `#EF4444` (red)

### Keyboard shortcuts

| Action          | Key             |
| --------------- | --------------- |
| Open palette    | `/` or `Ctrl+P` |
| Close palette   | `Esc`           |
| Navigate up     | `↑` or `Ctrl+K` |
| Navigate down   | `↓` or `Ctrl+J` |
| Select / launch | `Enter`         |
| Quit            | `Ctrl+C`        |

### Project structure

```
pisces/
├── src/
│   ├── index.ts          # CLI entry point
│   ├── config/
│   │   ├── loader.ts     # Read, parse, validate config files
│   │   └── schema.ts     # Zod schemas and TypeScript types
│   ├── tui/
│   │   ├── app.tsx       # Ink app root component
│   │   ├── banner.tsx    # pisces banner/logo
│   │   ├── palette.tsx   # Command palette (search + results)
│   │   └── hooks/        # Custom Ink hooks
│   ├── launcher/
│   │   └── spawn.ts      # Cross-platform terminal spawning
│   └── search/
│       └── fuzzy.ts      # fuse.js integration + pre-filter
├── tests/
├── package.json
├── tsconfig.json
├── eslint.config.mjs
├── prettier.config.mjs
├── vitest.config.ts
├── CHANGELOG.md
├── README.md
├── LICENSE
└── .gitignore
```

### Dependencies

**Runtime**: ink, react, fuse.js, zod, chokidar

**Dev**: typescript, @types/react, @types/node, tsup, tsx, vitest, eslint, @eslint/js, typescript-eslint, eslint-plugin-jsdoc, prettier, husky, lint-staged

### Versioning

Start at `0.1.0`. Use Keep a Changelog format for `CHANGELOG.md`. Git strategy: `main` branch only, direct commits.

### npm + GitHub

- npm package: `@lysun001/pisces`
- npm files: `dist/` only (via `"files"` field in package.json)
- GitHub repo: `neptune-constellation/pisces`
- License: MIT

## Testing Decisions

### What makes a good test

- Test external behavior, not implementation details.
- Each seam is tested at its public interface — call the function, assert the output.
- Do not test Ink component internals; test rendered output text via Ink's `render()`.
- Terminal spawning is verified via manual integration testing; the command construction logic is unit-tested separately.

### Seams under test

1. **Config loading + entry generation** — Test with mock file contents. Verify: valid JSON parses correctly, invalid JSON produces Zod errors, empty configs produce empty entry lists, entry generation covers all three categories (directories, combos, agent-only), duplicate keys are handled.
2. **Search / filter** — Pure function test. Verify: empty query returns all entries, single character filters correctly, multi-character AND behavior, Fuse.js ranking order, case insensitivity, no matches returns empty array.
3. **Terminal spawning** — Unit test the command string construction for each platform. Manual verification for actual window spawning. The platform detection logic is unit-tested.

### Test runner

Vitest with default configuration. Tests live in `tests/` adjacent to the source they test.

## Out of Scope

- **Config GUI editor** — Config files are edited manually in a text editor. No in-TUI config editor.
- **Session persistence** — pisces does not remember launch history or frequently used entries.
- **Plugin system** — No extensibility beyond the two config files.
- **Remote / SSH projects** — No support for launching agents on remote machines.
- **Agent process management** — pisces launches and forgets. It does not track, kill, or monitor spawned agent processes.
- **Theming / customization** — The color scheme is fixed. No user-configurable themes.
- **Multiple config profiles** — One set of config files per user. No profile switching.
- **Package manager integration** — pisces does not install or manage agent binaries. Agents must be pre-installed.

## Further Notes

- The tool is designed for developers who prefer terminal workflows and use multiple AI coding agents.
- All documentation (README, CHANGELOG, code comments, JSDoc) is written in English.
- The tool name "pisces" is the binary name and npm package scoped name. The GitHub repo is also named "pisces".
- Node.js 20 LTS is the minimum supported version.
- The package manager for development is pnpm.
