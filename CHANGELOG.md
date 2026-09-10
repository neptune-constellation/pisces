# Changelog

All notable changes to pisces will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.2] - 2026-09-10

### Added

- `language` configuration option (`en` by default, `zh-CN` for Simplified Chinese). It switches the CLI TUI and the desktop app; the name `pisces` is unchanged in both languages.
- A shared translation dictionary in `@lysun001/pisces-core/i18n`, consumed by the CLI TUI and by the desktop renderer through the `@lysun001/pisces-core/i18n` subpath, so the desktop bundle stays free of Node-only code.
- Desktop: a 2px circular ring around the 38×38 floating icon (white, `#e6e6e6` on hover) plus a drop shadow.
- A `LANGUAGE` section in `pis --help`, a `language` entry in the configuration reference, and an FAQ entry on switching languages, with the English and Chinese pages kept in sync.

### Changed

- Moved `core` from `apps/core` to `packages/core`: `apps/` now holds applications only and `packages/` holds shared libraries. CI and the release pipeline filter by package name, so no workflow path had to change.
- Config validation is now strict — unknown keys are reported as errors instead of being silently dropped. A typo such as `languasge` used to fall back to the default (`en`) with no warning at all.
- Desktop: the floating-icon and tray context menus are rebuilt on every open, so they follow the configured language immediately instead of requiring an app restart.

### Fixed

- Desktop: clicking the floating icon could not close the launcher. The icon stole focus, so the launcher hid itself on blur _before_ the click's toggle ran, and the toggle then re-opened it.
- Desktop: right-clicking the floating icon toggled the launcher as well as showing the menu, because the `mouseup` handler did not check which button was released.
- Desktop: the context-menu launcher entry was labelled `Show launcher` even though it toggles; it now reads `Show launcher` or `Hide launcher` to match the window's current state.
- Release pipeline: the npm publish job never built `@lysun001/pisces-core`, so publishing failed with `Could not resolve "@lysun001/pisces-core"`. The job now builds core first, matching the desktop job.

## [1.2.1] - 2026-09-09

### Fixed

- Set the Linux `executableName` to `pisces` so the AppImage is named correctly.

## [1.2.0] - 2026-09-09

### Added

- Desktop app: a draggable floating icon that opens a 400×600 launcher window beside it, plus a system tray, a search box, a terminal button, and a recently-opened view.
- A private `@lysun001/pisces-core` package holding the pure config/search/history/launcher logic shared by the CLI and the desktop app.
- A release pipeline that builds NSIS / DMG / AppImage installers and publishes the CLI to npm on version tags.

### Fixed

- Build `@lysun001/pisces-core` before the desktop app in the release pipeline.

## [1.1.5] - 2026-08-28

### Added

- `Ctrl+D` now opens a blank terminal window (like `Win+R` → `powershell`) when no `default` is configured.

## [1.1.4] - 2026-08-25

### Fixed

- Resolve the real JetBrains GUI launcher (`idea64.exe`) instead of the `.bat` shim.

## [1.1.3] - 2026-08-24

### Added

- A README is now included in the published npm package.

## [1.1.2] - 2026-08-24

### Added

- Editor detection for VS Code, PyCharm, IntelliJ IDEA, Qoder, Cursor, and Trae, each resolved to its real launcher rather than a shim.
- `agentsDisabled` and `editorsDisabled` flags to hide an entry group from the palette.
- Recent-opens history: `Ctrl+R` opens a popup listing the last 10 launches with timestamps.

## [1.0.0] - 2026-08-24

### Changed

- **Breaking**: converted the project into a pnpm-workspace monorepo. The CLI now lives in `apps/cli` and publishes as `@lysun001/pisces` with the `pis` binary.
- Added the VitePress documentation site (English + Chinese), deployed to GitHub Pages.

## [0.3.7] - 2026-08-21

### Fixed

- Clear the search query after launching an entry.

## [0.3.6] - 2026-08-21

### Added

- Subdirectory browsing: type `locationKey + /` to list a location's subdirectories.
- Self-update via `pis self-update` (`-u` / `--update`).
- The `default` launch shortcut and its configuration section.
- GitHub release creation on version tags.

### Changed

- Adjusted the palette hint spacing and shortcut labels.

## [0.3.0] - 2026-08-20

### Added

- First-run onboarding that auto-detects installed agent CLIs and writes them into the initial config.
- Multiple keys per location or agent (`"key": ["b", "beta"]`).

### Fixed

- Config errors are surfaced in the TUI instead of crashing the process.

## [0.2.2] - 2026-08-19

### Added

- Domain glossary (`CONTEXT.md`).

### Changed

- Shrank the banner; the version is now read from `package.json` at runtime.
- Added scrolling with an aligned scrollbar and a blinking cursor.

## [0.2.1] - 2026-08-18

### Changed

- Replaced the idle screen with an always-visible palette.
- Exit through the alternate screen buffer so the terminal is restored cleanly.

## [0.2.0] - 2026-08-17

### Changed

- Reworked the TUI layout and the search logic.
- Reworked how the configuration is loaded.

## [0.1.13] - 2026-08-17

### Fixed

- pnpm / Node.js version compatibility.

## [0.1.1] - 2026-08-17

### Changed

- Renamed the application package.

## [0.1.0] - 2026-08-17

### Added

- Initial release.
- An Ink 5 TUI with a branded banner and a command palette.
- Key-based prefix matching: input is treated as `locationKey + agentKey`.
- Configuration via `~/.pisces/settings.json`.
- Zod validation for the config file, with clear error messages.
- Cross-platform terminal spawning (Windows / macOS / Linux).
- Config file watching with hot-reload via chokidar.
- Auto-creation of the config directory and files on first run.
- Palette entry types: directories, directory + agent combos, and agent-only.
- Keyboard shortcuts: arrow keys to navigate, `Esc` or `Ctrl+C` to quit.
- Support for agent default arguments.
