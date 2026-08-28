# FAQ

## Where is my configuration stored?

`~/.pisces/settings.json` (`%USERPROFILE%\.pisces\settings.json` on Windows). The directory and file are created automatically on first run. See [Configuration](./config).

## Do I need to restart pis after editing settings.json?

No. The config file is watched and **hot-reloaded** — save the file and the palette updates while pisces is running.

## What characters can I use in a key?

Lowercase letters, digits, and hyphens only (`[a-z0-9-]`), 1–20 characters each. Keys are search triggers, not display names — the `name` field can contain anything, including CJK characters.

## Can a location or agent have multiple keys?

Yes. Pass an array: `"key": ["b", "beta"]`. The entry matches when any of its keys matches.

## What does Ctrl+D do when no default is configured?

If `default` is empty or missing, `Ctrl+D` opens a blank terminal window (like launching PowerShell manually). Configure `default` to open a fixed path and command instead:

```json
"default": { "path": "/path/to/project", "command": "claude" }
```

On macOS, `Cmd+D` works the same way. See [Configuration → default](./config#default).

## Why doesn't subdirectory browsing combine with agents?

A location can contain many subdirectories, and combining each with every configured agent produces a Cartesian product of options — the palette would become unusable. So subdirectory mode opens a plain terminal; start your agent manually. See [Subdirectory Browsing](./subdirs).

## Which terminal opens when I launch an entry?

A **new terminal window** at the target directory: PowerShell on Windows, Terminal.app on macOS, and an auto-detected emulator on Linux. See [Installation → platform support](./install#platform-support).

## How do I update pisces?

```bash
pis self-update
```

See [Self-Update](./update).

## How do I uninstall?

```bash
npm uninstall -g @lysun001/pisces
```

Remove `~/.pisces/` manually to delete your configuration.
