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

**category**:
The kind of a palette entry: `directory` (open a terminal at a location), `combo` (open a location and run an agent), or `agent` (run an agent in the current directory).
