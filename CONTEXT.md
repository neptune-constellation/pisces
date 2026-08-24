# pisces

A terminal TUI launcher that turns a user's configured project directories and AI coding agents into a searchable palette of launch targets.

## Language

**location**:
A project directory the user configures as a launch target, with a display `name`, a filesystem `path`, and one or more keys.
_Avoid_: position (the former name), project

**agent**:
An AI coding agent CLI command the user wants to launch (e.g. `crush`, `opencode`, `claude`), with a `name`, a `command`, one or more keys, and optional `args`.
_Avoid_: tool

**key**:
One or more short lowercase-alphanumeric strings (hyphens allowed) the user types to filter palette entries. Each key is a search trigger, not a display name. The `key` field accepts either a single string or an array of strings.
_Avoid_: shortcut, hotkey

**palette entry**:
A single launchable option shown in the palette, generated from locations and agents.
_Avoid_: item, result

**editor**:
A GUI code editor or IDE (e.g. VS Code) configured as a launch target. Instead of running in a terminal, it opens a location — or the current directory — in its own window.
_Avoid_: code tool, IDE launcher

**category**:
The kind of a palette entry: `directory` (open a terminal at a location), `combo` (open a location and run an agent, or open a location in an editor), `agent` (run an agent in the current directory), or `editor` (open an editor in the current directory).

## Publishing

**documentation site**:
The bilingual product documentation for pisces, built with VitePress and served on GitHub Pages. English is the root locale; Chinese lives under `/zh/`. It is a private workspace package and is never published to npm.
_Avoid_: docs (ambiguous with `docs/adr/` and `docs/agents/`), website, landing page
