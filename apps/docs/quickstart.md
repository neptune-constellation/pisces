# Quick Start

## First run

The first time you run `pis`, pisces automatically scans for known agent CLIs (e.g. `claude`, `opencode`, `crush`) and installed editors (VS Code, PyCharm, IntelliJ IDEA, Qoder, Cursor, and Trae) and writes everything it finds into your config — no prompt, no picking. If nothing is detected, you start with an empty config.

Either way a config file is created at `~/.pisces/settings.json`, and you can edit it at any time — pisces **hot-reloads** it on save, no restart needed.

## Configure your targets

Add your project directories (`locations`) and agent commands (`agents`) to `~/.pisces/settings.json`:

```json
{
  "locations": [
    {
      "name": "docs",
      "path": "C:\\Users\\You\\Desktop\\docs",
      "key": "a"
    },
    {
      "name": "code",
      "path": "C:\\Users\\You\\Desktop\\code",
      "key": ["b", "beta"]
    }
  ],
  "agents": [
    {
      "name": "crush",
      "command": "crush",
      "key": "cs"
    },
    {
      "name": "opencode",
      "command": "opencode",
      "key": ["oc", "open"]
    },
    {
      "name": "claude",
      "command": "claude",
      "key": "cl",
      "args": ["--model", "sonnet"]
    }
  ],
  "default": {
    "path": "C:\\Users\\You\\Desktop\\code",
    "command": "claude"
  }
}
```

Every field is explained in [Configuration](./config).

## Use it

Run `pis`, then type:

| You type  | What happens                                          |
| --------- | ----------------------------------------------------- |
| `b`       | Shows the `code` directory and all its agent combos   |
| `boc`     | Launches the `code` directory with `opencode`         |
| `bvscode` | Opens the `code` directory in VS Code                 |
| `oc`      | Launches `opencode` in your current working directory |
| `b/`      | Browses the subdirectories of `code`                  |
| `Enter`   | Launches the selected entry                           |

That's the whole mental model: **location key + agent key**, matched as prefixes. Read [Search & Keyboard](./search) for the full behavior.
