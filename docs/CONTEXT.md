# pisces

A launcher for AI coding agents: configure project directories, agents, and editors once, then quickly open any of them from a single palette (CLI) or floating window (desktop app).

## Language

**location**：
A configured project directory to launch from.
_Avoid_: project path, folder, workspace

**agent**：
An AI coding agent CLI command that runs in a terminal.
_Avoid_: command, tool, bot

**editor**：
A GUI code editor or IDE that opens a directory.
_Avoid_: IDE, GUI tool

**key**：
A short filter key (one or more) attached to a location, agent, or editor for prefix matching.
_Avoid_: shortcut, alias, hotkey

**palette entry**：
A single launchable option derived from the config.
_Avoid_: item, result, option, target

**category**：
The kind of a palette entry: `directory`, `combo`, `agent`, or `editor`.
_Avoid_: group, type, kind

**documentation site**：
The bilingual VitePress documentation for the project.
_Avoid_: docs, website

**desktop app**：
The GUI counterpart of the CLI launcher.
_Avoid_: GUI app, desktop client

**floating icon**：
The draggable on-screen icon of the desktop app; clicking it opens the launcher window.
_Avoid_: widget, ball, dock icon
