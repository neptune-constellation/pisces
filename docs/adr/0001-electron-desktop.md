# Introduce an Electron desktop app

pisces is adding a GUI desktop counterpart (a draggable floating icon that opens a 400×600 launcher window). We chose Electron over Tauri/Neutralino because its main process is Node, so the existing pure-TS config/search/history/launcher logic is reused directly, and transparent frameless floating windows plus `screen`-based window positioning are its most mature features. The trade-off is a ~100MB bundle and a resident Chromium process.

## Considered Options

- **Tauri v2** — ~5MB and lighter, but requires a Rust toolchain and IPC/sidecar bridging to reuse the Node/TS logic.
- **Neutralino.js** — ~2MB, but weak transparent-window/tray/positioning support and poor cross-platform consistency.
- **Electron** — chosen.
