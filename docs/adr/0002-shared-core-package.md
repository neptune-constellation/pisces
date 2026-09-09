# Extract a shared `apps/core` package

The CLI and the new desktop app both need the pure config/search/history/launcher modules. We extract them into a private `apps/core` package (`@lysun001/pisces-core`) that both depend on, rather than having the desktop app import `apps/cli` source or duplicate the code.
