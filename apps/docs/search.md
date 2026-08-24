# Search & Keyboard

## How search works

The palette uses **key-based prefix matching** — not fuzzy search. Your input is interpreted as:

```text
locationKey + agentKey
```

1. pisces finds the longest location key that is a prefix of your input.
2. The remaining characters are matched as a prefix against agent keys.
3. If no location key matches, the whole input is matched against agent keys only (launching an agent in your _current_ directory).

Search is case-insensitive, and an entry with multiple keys matches when **any** of its keys satisfies the rule.

### Examples

Given a location with key `b` and agents with keys `oc` (opencode) and `cs` (crush):

| Input   | Result                                                 |
| ------- | ------------------------------------------------------ |
| (empty) | All directories and agent-only entries (combos hidden) |
| `b`     | The `b` directory plus every agent combo for it        |
| `bo`    | Combos for `b` whose agent key starts with `o`         |
| `boc`   | The single `b` + opencode combo                        |
| `oc`    | The agent-only opencode entry (current directory)      |
| `xyz`   | No matches                                             |

## Palette entries

Three categories appear in the list:

- **📁 Directory** — opens a new terminal at a configured location.
- **📁 + ⚡ Combo** — opens a new terminal at the location _and_ runs the agent there. Combos are the Cartesian product of locations × agents and appear only while filtering.
- **⚡ Agent** — runs the agent in your current working directory.

Results are sorted directories first, then combos, then agent-only entries.

## Keyboard shortcuts

| Action          | Key                   |
| --------------- | --------------------- |
| Navigate up     | `↑` or `Ctrl+K`       |
| Navigate down   | `↓` or `Ctrl+J`       |
| Select / launch | `Enter`               |
| Default launch  | `Ctrl+D` (or `Cmd+D`) |
| Quit            | `Esc` or `Ctrl+C`     |

`Ctrl+D` launches the `default` path and command from your [configuration](./config#default).
