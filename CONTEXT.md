# pisces

A terminal TUI launcher that turns a user's configured project directories and AI coding agents into a searchable palette of launch targets.

## Language

**location**:
A project directory the user configures as a launch target, with a display `name`, a filesystem `path`, and a `key`.
_Avoid_: position (the former name), project

**agent**:
An AI coding agent CLI command the user wants to launch (e.g. `crush`, `opencode`, `claude`), with a `name`, a `command`, a `key`, and optional `args`.
_Avoid_: tool

**key**:
A short lowercase-alphanumeric string (hyphens allowed) the user types to filter palette entries. It is a search trigger, not a display name.
_Avoid_: shortcut, hotkey

**palette entry**:
A single launchable option shown in the palette, generated from locations and agents.
_Avoid_: item, result

**category**:
The kind of a palette entry: `directory` (open a terminal at a location), `combo` (open a location and run an agent), or `agent` (run an agent in the current directory).
