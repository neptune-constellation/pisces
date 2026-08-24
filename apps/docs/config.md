# Configuration

All configuration lives in a single file:

```text
~/.pisces/settings.json
```

(`%USERPROFILE%\.pisces\settings.json` on Windows.) The file is created automatically on first run, and pisces **hot-reloads** it whenever it changes — edit and save, no restart needed.

The file has four sections: `locations`, `agents`, `editors`, and `default`.

## `locations`

Each entry is a project directory you want to open:

| Field  | Type                 | Required | Description                                                 |
| ------ | -------------------- | -------- | ----------------------------------------------------------- |
| `name` | `string`             | yes      | Display name (1–50 chars, any characters including CJK)     |
| `path` | `string`             | yes      | Absolute path to the directory                              |
| `key`  | `string \| string[]` | yes      | One or more search keys (each 1–20 chars, `[a-z0-9-]` only) |

```json
{
  "locations": [{ "name": "code", "path": "C:\\Users\\You\\Desktop\\code", "key": ["b", "beta"] }]
}
```

## `agents`

Each entry is an AI agent CLI command you want to launch:

| Field     | Type                 | Required | Description                                                 |
| --------- | -------------------- | -------- | ----------------------------------------------------------- |
| `name`    | `string`             | yes      | Display name (1–50 chars, any characters including CJK)     |
| `command` | `string`             | yes      | Shell command to execute                                    |
| `key`     | `string \| string[]` | yes      | One or more search keys (each 1–20 chars, `[a-z0-9-]` only) |
| `args`    | `string[]`           | no       | Arguments appended after the command (defaults to `[]`)     |

```json
{
  "agents": [{ "name": "claude", "command": "claude", "key": "cl", "args": ["--model", "sonnet"] }]
}
```

On first run, pisces auto-detects these installed agent CLIs and adds them for you: `claude`, `codex`, `opencode`, `kimi`, `crush`, `cline`, `kilo`, `pi`, `qoder`, `grok`, `gemini`, `omp`, and `reasonix`. Detection checks each command on PATH and its known config directory. If your agent isn't detected (or isn't in this list), add an entry yourself — the table above is all you need.

## `editors`

Each entry is a GUI code editor or IDE that can open a directory:

| Field     | Type                 | Required | Description                                                        |
| --------- | -------------------- | -------- | ------------------------------------------------------------------ |
| `name`    | `string`             | yes      | Display name (1–50 chars, any characters including CJK)            |
| `command` | `string`             | yes      | Launcher command on PATH (e.g. `code`) or absolute executable path |
| `key`     | `string \| string[]` | yes      | One or more search keys (each 1–20 chars, `[a-z0-9-]` only)        |
| `args`    | `string[]`           | no       | Arguments passed before the directory argument (defaults to `[]`)  |

```json
{
  "editors": [{ "name": "VS Code", "command": "code", "key": "vscode" }]
}
```

Selecting an editor entry opens the directory **in the editor's own window** — no terminal is opened. Editor entries pair with locations exactly like agents do: type `locationKey + editorKey` to open that location in the editor, or just the editor key to open the editor in your current directory. See [Search & Keyboard](./search).

The `command` field is the editor's **launcher**: either a command on PATH (e.g. `code`, `pycharm`, `idea`) or the absolute path to its executable (e.g. `C:\Users\You\AppData\Local\Programs\Microsoft VS Code\bin\code.cmd`). When you add an editor by hand, the PATH command is usually all you need; use the absolute path only when the editor isn't on PATH.

On first run, pisces detects these installed editors and pre-fills this section: VS Code (`code`), PyCharm (`pycharm`), IntelliJ IDEA (`idea`), Qoder (`qoder`), Cursor (`cursor`), and Trae (`trae`). When found, `command` is set to the resolved launcher path; an editor that isn't detected (or isn't in this list) can be added manually with the table above.

## `default`

An optional shortcut for `Ctrl+D` (or `Cmd+D` on macOS): instantly open a terminal at one fixed path and run one fixed command, without typing anything.

| Field     | Type     | Required | Description                                    |
| --------- | -------- | -------- | ---------------------------------------------- |
| `path`    | `string` | no       | Absolute path to open (leave unset to disable) |
| `command` | `string` | no       | Shell command to run after opening             |

```json
{
  "default": {
    "path": "C:\\Users\\You\\Desktop\\code",
    "command": "claude"
  }
}
```

If `default` is empty or missing, pressing `Ctrl+D` shows a warning instead. A freshly created settings.json does not include `default` — add it yourself when you want the shortcut.

## Disabling agents or editors

Both entry groups are shown by default. Set `agentsDisabled` or `editorsDisabled` to `true` to hide the corresponding entries from the palette — for example, if you only ever launch projects with agents and never open an editor:

```json
{
  "agentsDisabled": false,
  "editorsDisabled": true
}
```

Both fields are optional and default to `false` (enabled). A freshly created settings.json does not include them — add them yourself only when you want to hide a group.

## Keys

Keys are what you type in the palette — they are **search triggers, not display names**.

- Lowercase alphanumeric and hyphens only (`[a-z0-9-]`), 1–20 characters each.
- A location or agent may declare **multiple keys**; an entry matches when any of its keys matches.
- Matching is prefix-based and case-insensitive — see [Search & Keyboard](./search).
