# Self-Update

pisces can update itself from npm — no need to remember the `npm install` incantation.

## Usage

All three forms do the same thing:

```bash
pis self-update
pis --update
pis -u
```

The command checks the latest published version of `@lysun001/pisces` on npm:

- **Already latest** — prints `Already on the latest version (vX.Y.Z).` and exits.
- **Update available** — runs `npm install -g @lysun001/pisces@latest` for you, then tells you to run `pis` again.

## Do I restart the program or the terminal?

**Just run `pis` again** — no terminal restart needed. The update replaces the binary on disk; the new code takes effect the next time the program starts.

## Other CLI options

| Option            | Description                 |
| ----------------- | --------------------------- |
| `-v`, `--version` | Print the installed version |
| `-h`, `--help`    | Print the help message      |
