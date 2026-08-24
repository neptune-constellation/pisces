# Subdirectory Browsing

Sometimes the directory you want is one level below a configured location. Instead of adding every subdirectory to your config, browse into it at launch time.

## How it works

Type a location key followed by `/` or `\`. The palette switches from entries to the **subdirectories** of that location:

| Input   | Result                                                |
| ------- | ----------------------------------------------------- |
| `b/`    | All subdirectories of the location with key `b`       |
| `b/pro` | Subdirectories whose name starts with `pro`           |
| `b\src` | Same as above — `\` works as an alternative separator |

Keep typing to filter by prefix; `Enter` opens a new terminal at the selected subdirectory. Hidden directories (names starting with `.`) are excluded.

## No agent combos here — by design

Subdirectory mode **only opens a terminal**; it never combines subdirectories with agents. Some parent directories contain dozens of subdirectories, and combining them with every configured agent would produce a Cartesian product of options — the list would become unwieldy instead of helpful.

Pick a subdirectory, then start your agent manually in the terminal that opens.
