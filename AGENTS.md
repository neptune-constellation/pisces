# AGENTS.md

## Project

`pisces` (binary `pis`, npm package `@lysun001/pisces`) is a terminal TUI launcher for AI coding agents. A user configures project directories and agent commands once; running `pis` opens a searchable palette where typing filters targets and `Enter` opens a new terminal window at the selected directory, optionally launching an agent there.

Stack: **Ink 5 + React 18** for the TUI, **Zod** for config validation, **chokidar** for config hot-reload, **tsup** for bundling, **vitest** for tests. ESM-only (`"type": "module"`), TypeScript strict mode, targeting **Node.js >= 22**.

## Domain glossary

Canonical domain vocabulary (`location`, `agent`, `key`, `palette entry`, `category`) lives in [`CONTEXT.md`](./CONTEXT.md). Field shapes are defined in `src/config/schema.ts` and `src/config/loader.ts`.

## Commands

```bash
pnpm dev              # run via tsx (src/index.ts), no build step
pnpm build            # bundle with tsup -> dist/index.js (+ .d.ts)
pnpm start            # run the built dist/index.js
pnpm test             # vitest run (single pass, all tests)
pnpm test:watch       # vitest watch mode
pnpm vitest run tests/search/fuzzy.test.ts   # run a single test file
pnpm lint             # eslint src/ tests/
pnpm lint:fix         # eslint --fix
pnpm typecheck        # tsc --noEmit
pnpm format:check     # prettier --check
```

`husky` + `lint-staged` run eslint/prettier on staged files automatically at commit time (see `package.json` `lint-staged`). The `prepare` script installs the husky hook.

## Architecture

Data flows in one direction: **config file → validation → palette entries → search → TUI render → terminal spawn**.

1. **`src/config/schema.ts`** — Zod schemas (`LocationSchema`, `AgentSchema`, `SettingsSchema`) and inferred types (`Location`, `Agent`). The root `SettingsSchema` has two arrays: `locations` and `agents`, both defaulting to `[]`.
2. **`src/config/loader.ts`** — `loadConfig()` reads `~/.pisces/settings.json` (auto-creating the directory and an empty file on first run), validates it with Zod (exiting with code 1 on failure), and `generateEntries()` expands it into `PaletteEntry[]`. `generateEntries()` produces three categories: `directory` (one per location), `combo` (Cartesian product of locations × agents), `agent` (one per agent, `directory = process.cwd()`). Also exports `watchConfig()` for hot-reload via chokidar (500ms debounce).
3. **`src/search/fuzzy.ts`** — `searchEntries()` filters by **key-prefix matching, not fuzzy search** (Fuse.js was removed). See "Search behavior" below.
4. **`src/tui/app.tsx`** — the root Ink component. Owns all state (`entries`, `query`, `selectedIndex`) and centralizes every keyboard shortcut in one `useInput` callback. `Esc`/`Ctrl+C` call Ink's `useApp().exit()` (never `process.exit` directly — that would bypass the terminal cleanup in the entry point).
5. **`src/tui/palette.tsx`** — a pure presentational component: search box, results list, scrollbar, hint bar. Holds no app state except the blinking `Cursor` timer.
6. **`src/tui/banner.tsx`** — the ASCII logo and `PISCES_VERSION`, read dynamically from `package.json` at runtime (walks up from the module dir to find it).
7. **`src/launcher/spawn.ts`** — cross-platform terminal spawning: Windows `cmd /c start`, macOS `osascript`, Linux emulator fallback chain (gnome-terminal → … → alacritty).
8. **`src/index.tsx`** — the entry point. Enters the alternate screen buffer (`\x1b[?1049h`) before rendering and restores it (`\x1b[?1049l`) in `waitUntilExit().finally()` so the TUI leaves no residue after exit.

Tests live in `tests/` and cover only the pure logic — Zod schemas, `generateEntries`, `searchEntries`. The TUI rendering is not unit-tested.

## Configuration (`~/.pisces/settings.json`)

```json
{
  "locations": [
    { "name": "cloud-admin", "path": "C:\\Users\\You\\Desktop\\code\\cloud-admin", "key": "b" }
  ],
  "agents": [
    { "name": "opencode", "command": "opencode", "key": "oc" },
    { "name": "claude", "command": "claude", "key": "cl", "args": ["--model", "sonnet"] }
  ]
}
```

- `location.key` and `agent.key` must be lowercase alphanumeric with hyphens only (1-20 chars).
- `agent.args` is optional and defaults to `[]` — these are appended after `command` when launching.
- `name` may be any string (1-50 chars), including non-ASCII (CJK) names.

## Search behavior

The input is interpreted as `locationKey + agentKey`, matched as **prefixes** (not substring, not fuzzy):

1. Find the longest location key that is a prefix of the query.
2. Match the remaining characters against agent keys as a prefix.
3. If no location key prefixes the query, fall back to matching the whole query against agent keys only (producing agent-only entries for the current directory).

Examples (given keys `b` for a location and `oc`/`cs` for agents):

| Input   | Result                                            |
| ------- | ------------------------------------------------- |
| (empty) | all `directory` + `agent` entries (combos hidden) |
| `b`     | that directory + every combo for it               |
| `bo`    | combos for `b` whose agent key starts with `o`    |
| `boc`   | the single `b` + `opencode` combo                 |
| `oc`    | the agent-only `opencode` entry                   |
| `xyz`   | empty                                             |

## TUI rendering details

- The palette is **always visible** on launch — there is no idle screen and no `/`/`Ctrl+P` toggle.
- **Maximum 10 result rows** (`MAX_VISIBLE_RESULTS`); the list scrolls only when there are more, with a right-side scrollbar (`│` track, `█` thumb) and a `selected/total` indicator.
- **Scrollbar alignment is done with manual fixed-width padding** computed via `displayWidth()`, not flexbox. Flexbox column widths shift with variable-width content (CJK/emoji) and break the vertical line — keep this approach if you touch the results list.
- `displayWidth()` counts CJK and emoji characters as **2 columns** (via `FULL_WIDTH_CHAR_REGEX`); all truncation (`truncateToWidth`, `truncateWithEllipsis`) is width-aware so rows never wrap.
- Long names/paths are truncated with `…`: the name is shown in full when it fits; the path fills whatever width remains; if the name alone overflows, only the (truncated) name is shown.
- The search box cursor is a **fake block character** toggled by an 800ms `setInterval` (not a real terminal cursor).

## Terminal launching

`launchTerminal(entry)` (in `src/launcher/spawn.ts`) builds the agent command as `command args...`, then opens a new terminal at `entry.directory` on the detected platform. Windows uses `cmd /c start "pisces" powershell -NoExit -Command "…"` so the new window stays open after the command finishes.

## Conventions & gotchas

- **ESM with explicit `.js` extensions** on relative imports (NodeNext resolution): `import { loadConfig } from '../config/loader.js'`.
- **Every function declaration requires a JSDoc comment** — `jsdoc/require-jsdoc` is an error for `FunctionDeclaration`/`MethodDefinition`/`ClassDeclaration` (arrow functions are exempt). All comments and user-facing strings are in **English**.
- **No `any` types** — `@typescript-eslint/no-explicit-any` is an error.
- **`strict` + `noUncheckedIndexedAccess: true`** — array index access returns `T | undefined`, so use `entries[0]!` or optional chaining in code and tests.
- **JSX goes in `.tsx` files only**; the build entry is `src/index.tsx` (not `.ts`).
- Exit via `useApp().exit()`, never `process.exit()`, so the alternate-screen-buffer cleanup in `src/index.tsx` runs.

## Agent skills

### Issue tracker

Issues are tracked as local markdown files under `.scratch/<feature-slug>/`. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context layout — one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
