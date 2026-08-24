# Search & Keyboard

## How search works

The palette uses **key-based prefix matching** — not fuzzy search. Your input is interpreted as:

```text
locationKey + agentKey   (or locationKey + editorKey)
```

1. pisces finds the longest location key that is a prefix of your input.
2. The remaining characters are matched as a prefix against agent keys **and** editor keys; matching entries of either kind are returned.
3. If no location key matches, the whole input is matched against agent keys and editor keys only (launching in your _current_ directory).

Search is case-insensitive, and an entry with multiple keys matches when **any** of its keys satisfies the rule.

### Examples

Given a location with key `b`, agents with keys `oc` (opencode) and `cs` (crush), and an editor with key `vscode`:

| Input     | Result                                                               |
| --------- | -------------------------------------------------------------------- |
| (empty)   | All directories, agent-only, and editor-only entries (combos hidden) |
| `b`       | The `b` directory plus every agent and editor combo for it           |
| `bo`      | Combos for `b` whose agent key starts with `o`                       |
| `boc`     | The single `b` + opencode combo                                      |
| `bvscode` | The `b` directory opened in VS Code                                  |
| `oc`      | The agent-only opencode entry (current directory)                    |
| `vscode`  | The editor-only VS Code entry (current directory)                    |
| `xyz`     | No matches                                                           |

## Palette entries

Four categories appear in the list:

- **📁 Directory** — opens a new terminal at a configured location.
- **📁 + 🤖 Combo** — opens a new terminal at the location _and_ runs the agent there. Combos are the Cartesian product of locations × agents and appear only while filtering.
- **💻 Editor** — opens the location (or the current directory for editor-only entries) in a GUI editor such as VS Code, with no terminal involved. Location × editor combos also appear only while filtering.
- **🤖 Agent** — runs the agent in your current working directory.

Results are sorted directories first, then combos, then agent-only and editor-only entries.

## Keyboard shortcuts

| Action          | Key                   |
| --------------- | --------------------- |
| Navigate up     | `↑` or `Ctrl+K`       |
| Navigate down   | `↓` or `Ctrl+J`       |
| Select / launch | `Enter`               |
| Default launch  | `Ctrl+D` (or `Cmd+D`) |
| Quit            | `Esc` or `Ctrl+C`     |

`Ctrl+D` launches the `default` path and command from your [configuration](./config#default).
