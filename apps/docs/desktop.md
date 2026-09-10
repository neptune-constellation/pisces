# Desktop App

The pisces desktop app wraps the same launcher in a draggable **floating icon**. Click the icon and a 400×600 launcher window pops up next to it — search your projects, open a terminal, or launch an editor, without ever opening a terminal yourself.

## Installing

Download the installer for your platform from the [GitHub Releases](https://github.com/neptune-constellation/pisces/releases) page:

- **Windows** — `Pisces-<version>-setup.exe` (NSIS installer)
- **macOS** — `Pisces-<version>.dmg`

Run the installer, then launch **Pisces** from the Start Menu / Applications. A circular icon appears floating on your screen.

> The installers are not code-signed. On Windows, SmartScreen may show a "Windows protected your PC" prompt — click **More info → Run anyway**. On macOS, Gatekeeper may block the app — right-click it and choose **Open**, or allow it in **System Settings → Privacy & Security**.

## The floating icon

- **Drag** the icon anywhere on screen — it stays on top of other windows.
- **Click** the icon to open (or close) the launcher window next to it. The window opens to the left of the icon by default, and flips to the other side when it would overflow the screen.
- **Right-click** the icon for a context menu with the same open/close launcher action — labelled **Show launcher** or **Hide launcher** to match the window's current state — plus **Quit**.
- The window closes automatically when you click outside it.

## The launcher window

The window has three parts:

1. **Toolbar** — two buttons:
   - **Terminal** opens a new blank terminal (the same as `Ctrl+D` in the TUI when no default is configured).
   - **Recent** switches to the recently-opened list.
2. **Search box** — type to filter your configured locations, agents, and editors, just like the TUI. The placeholder is `Search projects & agents...`. The query resets to empty each time you reopen the launcher, so you always start from a fresh search.
3. **Results** — the matching entries. Select with the **↑ / ↓** keys or by moving the mouse over a row (the list scrolls to keep the selection in view). Press **Enter** or click to launch, and **Esc** to close the window.

The search uses the same key-based prefix matching as the TUI — see [Search & Keyboard](/search) for the full rules.

## Recent opens

The **Recent** view lists your last 10 launches (agents, editors, and directories) with the open time beneath each row. Select one and press **Enter** or click to re-open it, or click **Back** to return to the search view.

## System tray

The tray icon keeps pisces running in the background:

- **Show launcher** / **Hide launcher** toggles the launcher window next to the floating icon. The label follows the window's current state.
- **Quit** exits the app.

## Configuration

The desktop app reads the same `~/.pisces/settings.json` as the CLI — locations, agents, editors, the `default` shortcut, and the `language` setting are shared. See [Configuration](/config) for the full reference. On first launch, if no settings file exists, the desktop app auto-detects your installed agents and editors exactly like the CLI.

The interface language is read when the app starts, so restart the desktop app after changing `language`. The floating-icon and tray menus are rebuilt on every open, so those follow the setting immediately.

## Development

To run the desktop app from source, you need [Node.js](https://nodejs.org) >= 22 and [pnpm](https://pnpm.io). From the repo root:

```bash
pnpm install
pnpm --filter @lysun001/pisces-desktop dev
```

`dev` starts electron-vite in watch mode and opens the floating icon window. To build production installers locally instead, run `pnpm --filter @lysun001/pisces-desktop dist` (electron-vite build + electron-builder, output to `apps/desktop/dist/`).
