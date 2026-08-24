# Adopt a pnpm-workspace monorepo for the CLI and the documentation site

Adding a VitePress documentation site turns the repo into a pnpm-workspace monorepo with two packages: the CLI (`@lysun001/pisces`) and the documentation site (private, never published). Note that dependency isolation was **not** the motivation — VitePress as a devDependency could never leak into the published npm tarball (`files: ["dist"]`) or into a user's global install. The real reasons are structural: keep the CLI package surface clean, give the site its own package manifest and scripts, and leave room for future packages without a second restructuring.

## Considered options

- **Single package** — VitePress as a root devDependency, site source in the same package. Least churn, but mixes two artifacts in one manifest and defers the split.
- **Light split** — CLI stays at the repo root, the site gets a directory with its own `package.json` outside any workspace. A half-measure that would likely need redoing.
- **pnpm-workspace monorepo** (chosen) — `apps/cli` and `apps/docs` as workspace packages.

## Consequences

- The root `package.json` becomes private; publishing is scoped with `pnpm --filter @lysun001/pisces publish` and stays triggered by `v*` tags.
- CI, lint-staged, and tsconfig paths must follow the move; husky hooks stay at the root.
- The documentation site package is `private: true` and deploys to GitHub Pages, not npm.
