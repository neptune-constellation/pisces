import { BrowserWindow, Menu, app } from 'electron';
import { join } from 'node:path';
import { toggleLauncherWindow } from './launcher-window.js';

// Side length (in pixels) of the square floating-icon window.
const ICON_SIZE = 40;

let floatingWindow: BrowserWindow | null = null;

// Window position captured at the start of a drag, so the icon tracks the
// pointer deltas without accumulating rounding errors.
let dragStartPosition: { x: number; y: number } | null = null;

/**
 * Resolves the absolute path to a resource file.
 *
 * In development the file lives in the project's `resources/` directory; in a
 * packaged build it is copied next to the executable via `extraResources`.
 *
 * @param name - The resource file name.
 * @returns The absolute path to the resource file.
 */
function getResourcePath(name: string): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, name);
  }
  return join(app.getAppPath(), 'resources', name);
}

/**
 * Creates the transparent, frameless, always-on-top floating icon window.
 *
 * @returns The created floating-icon window.
 */
export function createFloatingIconWindow(): BrowserWindow {
  floatingWindow = new BrowserWindow({
    width: ICON_SIZE,
    height: ICON_SIZE,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      preload: join(import.meta.dirname, '../preload/index.mjs'),
      sandbox: false,
    },
  });

  // Raise the icon above other always-on-top windows (e.g. a terminal with its
  // own "always on top" enabled) so it stays visible over the desktop.
  floatingWindow.setAlwaysOnTop(true, 'screen-saver');

  floatingWindow.loadFile(getResourcePath('floating.html'));

  return floatingWindow;
}

/**
 * Returns the current screen bounds of the floating icon, used as the anchor
 * when positioning the launcher window.
 *
 * @returns The icon's x/y/width/height bounds (defaulting to the origin).
 */
export function getFloatingIconBounds(): { x: number; y: number; width: number; height: number } {
  return floatingWindow?.getBounds() ?? { x: 0, y: 0, width: ICON_SIZE, height: ICON_SIZE };
}

/**
 * Captures the icon's current position at the start of a drag.
 */
export function beginDrag(): void {
  // Raise the icon above competing topmost windows when it is grabbed.
  floatingWindow?.moveTop();

  const position = floatingWindow?.getPosition();
  const x = position?.[0] ?? 0;
  const y = position?.[1] ?? 0;
  dragStartPosition = { x, y };
}

/**
 * Moves the icon by the given pointer deltas, relative to the drag start.
 *
 * @param dx - Horizontal pointer delta in screen pixels.
 * @param dy - Vertical pointer delta in screen pixels.
 */
export function moveBy(dx: number, dy: number): void {
  if (!floatingWindow || !dragStartPosition) {
    return;
  }
  floatingWindow.setPosition(dragStartPosition.x + dx, dragStartPosition.y + dy);
}

/**
 * Handles a click on the floating icon by toggling the launcher window.
 */
export function handleIconClick(): void {
  toggleLauncherWindow(getFloatingIconBounds());
}

/**
 * Shows the floating icon's context menu (show launcher / quit).
 */
export function showFloatingContextMenu(): void {
  const menu = Menu.buildFromTemplate([
    { label: 'Show launcher', click: () => handleIconClick() },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ]);
  if (floatingWindow !== null) {
    menu.popup({ window: floatingWindow });
  }
}
