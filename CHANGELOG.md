# Changelog

All notable changes to pisces will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - Unreleased

### Added

- Initial release of pisces
- TUI with Ink 5, featuring a branded banner and command palette
- Key-based prefix matching: input is treated as `locationKey + agentKey`
- Configuration via `~/.pisces/settings.json`
- Zod validation for config files with clear error messages
- Cross-platform terminal spawning (Windows/macOS/Linux)
- Config file watching with hot-reload via chokidar
- Auto-creation of config directory and files on first run
- Three palette entry types: directories, directory+agent combos, agent-only
- Keyboard shortcuts: arrow keys to navigate, `Esc` or `Ctrl+C` to quit
- Support for agent default arguments
