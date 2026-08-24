# AGENTS.md

## Project

`pisces` (binary `pis`, npm package `@lysun001/pisces`) is a terminal TUI launcher for AI coding agents. A user configures project directories and agent commands once; running `pis` opens a searchable palette where typing filters targets and `Enter` opens a new terminal window at the selected directory, optionally launching an agent there.

The repo is a **pnpm-workspace monorepo** (see [ADR-0001](docs/adr/0001-pnpm-workspace-monorepo.md)):

- **`apps/cli`** — the TUI launcher, published to npm as `@lysun001/pisces`.
- **`apps/docs`** — the bilingual VitePress documentation site (`@lysun001/pisces-docs`, private), deployed to GitHub Pages at `https://neptune-constellation.github.io/pisces/`.

CLI stack: **Ink 5 + React 18** for the TUI, **Zod** for config validation, **chokidar** for config hot-reload, **tsup** for bundling, **vitest** for tests. ESM-only (`"type": "module"`), TypeScript strict mode, targeting **Node.js >= 22**. The root `package.json` is private (`pisces-workspace`) and only orchestrates; all publishable code lives in `apps/cli`.

## Domain glossary

Canonical domain vocabulary (`location`, `agent`, `editor`, `key`, `palette entry`, `category`, `documentation site`) lives in [`CONTEXT.md`](./CONTEXT.md). Field shapes are defined in `apps/cli/src/config/schema.ts` and `apps/cli/src/config/loader.ts`. Architectural decisions are recorded in `docs/adr/`.

## Commands

Run from the repo root — scripts delegate to the workspace packages:

```bash
pnpm dev              # run the CLI via tsx (apps/cli/src/index.tsx), no build step
pnpm build            # build all packages (CLI tsup bundle + docs site)
pnpm start            # run the built apps/cli/dist/index.js
pnpm test             # vitest run (CLI test suite, single pass)
pnpm test:watch       # vitest watch mode
pnpm lint             # eslint apps/
pnpm lint:fix         # eslint apps/ --fix
pnpm typecheck        # tsc --noEmit in every package that defines it
pnpm format:check     # prettier --check
pnpm docs:dev         # VitePress dev server for the documentation site
pnpm docs:build       # build the documentation site
pnpm docs:preview     # preview the built documentation site
```

Scoped equivalents: `pnpm --filter @lysun001/pisces test`, `pnpm --filter @lysun001/pisces-docs build`, etc. Single test file: `pnpm vitest run apps/cli/tests/search/fuzzy.test.ts`.

`husky` + `lint-staged` run eslint/prettier on staged files automatically at commit time (see `package.json` `lint-staged`, globs are `apps/**`-relative). The `prepare` script installs the husky hook. The pre-commit hook also runs `pnpm typecheck`.

## Architecture

CLI data flows in one direction: **config file → validation → palette entries → search → TUI render → terminal spawn**. All paths below are relative to `apps/cli/`.

1. **`src/config/schema.ts`** — Zod schemas (`LocationSchema`, `AgentSchema`, `EditorSchema`, `SettingsSchema`, `DefaultSchema`) and inferred types (`Location`, `Agent`, `Editor`, `DefaultConfig`). `SettingsSchema` has three arrays (`locations`, `agents`, `editors`, all defaulting to `[]`) and an optional `default` section (`path` + `command`).
2. **`src/config/loader.ts`** — `loadConfig()` reads `~/.pisces/settings.json` (auto-creating the directory and an empty file on first run), validates it with Zod (throwing a `ConfigError` on failure), and returns `ConfigData` (`entries` + `defaultConfig`). `generateEntries()` (exported for direct testing) expands the config into `PaletteEntry[]`, producing five groups: `directory` (one per location), agent `combo` (Cartesian product of locations × agents), editor `combo` (locations × editors), `agent` (one per agent, `directory = process.cwd()`), and `editor` (one per editor, current directory). Also exports `watchConfig()` for hot-reload via chokidar (500ms debounce).
3. **`src/search/fuzzy.ts`** — `searchEntries()` filters by **key-prefix matching, not fuzzy search** (Fuse.js was removed); the remainder after a location key matches agent keys **or** editor keys, and without a location prefix the query falls back to agent-only and editor-only entries. `getSubdirectoryEntries()` handles the `locationKey + / or \` subdirectory-browsing mode.
4. **`src/tui/app.tsx`** — the root Ink component. Owns all state (`entries`, `query`, `selectedIndex`, `defaultConfig`) and centralizes every keyboard shortcut in one `useInput` callback. `Esc`/`Ctrl+C` call Ink's `useApp().exit()` (never `process.exit` directly — that would bypass the terminal cleanup in the entry point). `Ctrl+D`/`Cmd+D` launches the `default` path/command (warning popup when unconfigured).
5. **`src/tui/palette.tsx`** — a pure presentational component: search box, results list, scrollbar, hint bar. Holds no app state except the blinking `Cursor` timer.
6. **`src/tui/banner.tsx`** — the ASCII logo and `PISCES_VERSION`, read dynamically from package.json at runtime (walks up from the module dir to find it).
7. **`src/tui/onboarding.tsx`** — first-run onboarding: automatically detects installed agents (`known-agents.ts`) and editors (`known-editors.ts` — VS Code, PyCharm, IntelliJ IDEA, Qoder, Cursor, and Trae; each resolved via `where` + path hints to prefer the real launcher over other shims, then falling back to default install paths) and writes everything detected into the initial config, with no user prompt; falls back to an empty config when nothing is detected.
8. **`src/launcher/spawn.ts`** — `launchEntry()` dispatches editor entries to `launchEditor()` (a detached GUI process spawned directly, no terminal window; on Windows run through `cmd.exe /d /c call` so `.cmd` shims resolve and spaced paths are preserved) and everything else to `launchTerminal()`: Windows `cmd /c start`, macOS `osascript`, Linux emulator fallback chain (gnome-terminal → … → alacritty).
9. **`src/index.tsx`** — the entry point. Parses CLI arguments (`self-update`/`-u`, `--version`/`-v`, `--help`/`-h` via `src/cli/`) before entering the alternate screen buffer (`\x1b[?1049h`) and restores it (`\x1b[?1049l`) in `waitUntilExit().finally()` so the TUI leaves no residue after exit.

Tests live in `apps/cli/tests/` and cover only the pure logic — Zod schemas, `generateEntries`, `searchEntries`, subdirectory browsing. The TUI rendering is not unit-tested.

## Documentation site (`apps/docs`)

VitePress with English as the root locale and Chinese under `/zh/`. Source pages live directly in `apps/docs/` (plus `apps/docs/zh/`); site config is `apps/docs/.vitepress/config.ts` with `base: '/pisces/'`. Content mirrors the CLI features — when adding or changing a user-facing feature, update the matching pages in **both locales**. Deployment is automatic: `.github/workflows/docs.yml` builds and publishes to GitHub Pages on every push to `main`. `apps/docs` is `private: true` and must never be published to npm.

## Configuration (`~/.pisces/settings.json`)

```json
{
  "locations": [
    {
      "name": "cloud-admin",
      "path": "C:\\Users\\You\\Desktop\\code\\cloud-admin",
      "key": ["b", "beta"]
    }
  ],
  "agents": [
    { "name": "opencode", "command": "opencode", "key": ["oc", "open"] },
    { "name": "claude", "command": "claude", "key": "cl", "args": ["--model", "sonnet"] }
  ],
  "editors": [{ "name": "VS Code", "command": "code", "key": "vscode" }],
  "default": {
    "path": "C:\\Users\\You\\Desktop\\code\\cloud-admin",
    "command": "claude"
  }
}
```

- `location.key` and `agent.key` accept either a single string or an array of strings; each key must be lowercase alphanumeric with hyphens only (1-20 chars).
- `agent.args` is optional and defaults to `[]` — these are appended after `command` when launching.
- `name` may be any string (1-50 chars), including non-ASCII (CJK) names.
- `default` is optional (and, like the disabled flags, is not written into a freshly created config — add it yourself); `Ctrl+D` launches it, or warns when it is unset.
- `agentsDisabled` / `editorsDisabled` are optional booleans defaulting to `false` (both groups enabled); set to `true` to hide agent/editor entries from the palette. They are not written into a freshly created config.

## Search behavior

The input is interpreted as `locationKey + agentKey`, matched as **prefixes** (not substring, not fuzzy). A location or agent may declare multiple keys; an entry matches when any of its keys satisfies the rule.

1. Find the longest location key that is a prefix of the query.
2. Match the remaining characters against agent keys **and** editor keys as a prefix; entries of either kind that match are returned.
3. If no location key prefixes the query, fall back to matching the whole query against agent keys and editor keys (producing agent-only / editor-only entries for the current directory).

Examples (given keys `b` for a location, `oc`/`cs` for agents, `vscode` for an editor):

| Input     | Result                                                       |
| --------- | ------------------------------------------------------------ |
| (empty)   | all `directory` + `agent` + `editor` entries (combos hidden) |
| `b`       | that directory + every combo for it                          |
| `bo`      | combos for `b` whose agent key starts with `o`               |
| `boc`     | the single `b` + `opencode` combo                            |
| `bvscode` | the `b` directory opened in the `vscode` editor              |
| `oc`      | the agent-only `opencode` entry                              |
| `vscode`  | the editor-only VS Code entry                                |
| `xyz`     | empty                                                        |

## TUI rendering details

- The palette is **always visible** on launch — there is no idle screen and no `/`/`Ctrl+P` toggle.
- Entry icons: 📁 for directories and agent combos, 🤖 for agent-only entries, 💻 for anything that opens an editor (editor-only and location × editor combos).
- **Maximum 10 result rows** (`MAX_VISIBLE_RESULTS`); the list scrolls only when there are more, with a right-side scrollbar (`│` track, `█` thumb) and a `selected/total` indicator.
- **Scrollbar alignment is done with manual fixed-width padding** computed via `displayWidth()`, not flexbox. Flexbox column widths shift with variable-width content (CJK/emoji) and break the vertical line — keep this approach if you touch the results list.
- `displayWidth()` counts CJK and emoji characters as **2 columns** (via `FULL_WIDTH_CHAR_REGEX`); all truncation (`truncateToWidth`, `truncateWithEllipsis`) is width-aware so rows never wrap.
- Long names/paths are truncated with `…`: the name is shown in full when it fits; the path fills whatever width remains; if the name alone overflows, only the (truncated) name is shown.
- The search box cursor is a **fake block character** toggled by an 800ms `setInterval` (not a real terminal cursor).

## Terminal launching

`launchTerminal(entry)` (in `apps/cli/src/launcher/spawn.ts`) builds the agent command as `command args...`, then opens a new terminal at `entry.directory` on the detected platform. Windows uses `cmd /c start "pisces" powershell -NoExit -Command "…"` so the new window stays open after the command finishes.

## Publishing & deployment

- **npm**: tag-triggered (`.github/workflows/publish.yml`, tags `v*`) — builds and publishes `@lysun001/pisces` from `apps/cli` via `pnpm --filter`. The package name must never change; `self-update` resolves it at runtime.
- **Docs**: push-to-main-triggered (`.github/workflows/docs.yml`) — builds `apps/docs` and deploys to GitHub Pages.
- **CI** (`.github/workflows/ci.yml`, Node 22 + 24): typecheck, lint, test, CLI build, docs build.

## Conventions & gotchas

- **ESM with explicit `.js` extensions** on relative imports (NodeNext resolution): `import { loadConfig } from '../config/loader.js'`.
- **Every function declaration requires a JSDoc comment** — `jsdoc/require-jsdoc` is an error for `FunctionDeclaration`/`MethodDefinition`/`ClassDeclaration` (arrow functions are exempt). All comments and user-facing strings are in **English** (the documentation site's `/zh/` pages are the sole exception, being translations).
- **No `any` types** — `@typescript-eslint/no-explicit-any` is an error.
- **`strict` + `noUncheckedIndexedAccess: true`** — array index access returns `T | undefined`, so use `entries[0]!` or optional chaining in code and tests. Per-package `tsconfig.json` extends the root `tsconfig.base.json`.
- **JSX goes in `.tsx` files only**; the CLI build entry is `apps/cli/src/index.tsx` (not `.ts`).
- Exit via `useApp().exit()`, never `process.exit()`, so the alternate-screen-buffer cleanup in `apps/cli/src/index.tsx` runs. (CLI subcommand handlers in `apps/cli/src/cli/` are the exception — they run before the TUI starts.)
- Docs content changes must land in **both** the English and `/zh/` pages.

## Agent skills

### Issue tracker

Issues are tracked as local markdown files under `.scratch/<feature-slug>/`. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context layout — one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
