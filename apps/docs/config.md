# Configuration

All configuration lives in a single file:

```text
~/.pisces/settings.json
```

(`%USERPROFILE%\.pisces\settings.json` on Windows.) The file is created automatically on first run, and pisces **hot-reloads** it whenever it changes — edit and save, no restart needed.

The file has three sections: `locations`, `agents`, and `default`.

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

If `default` is empty or missing, pressing `Ctrl+D` shows a warning instead.

## Keys

Keys are what you type in the palette — they are **search triggers, not display names**.

- Lowercase alphanumeric and hyphens only (`[a-z0-9-]`), 1–20 characters each.
- A location or agent may declare **multiple keys**; an entry matches when any of its keys matches.
- Matching is prefix-based and case-insensitive — see [Search & Keyboard](./search).
