import { BrowserWindow, Menu, app } from 'electron';
import { join } from 'node:path';
import { getMessages } from '@lysun001/pisces-core';
import { isLauncherVisible, toggleLauncherWindow } from './launcher-window.js';
import { readLanguage } from './language.js';

// Side length (in pixels) of the circular icon image.
const ICON_SIZE = 38;

// Width (in pixels) of the ring around the icon, measured on each side.
const RING_WIDTH = 1;

// Side length of the visible icon: the image plus its ring.
const RING_SIZE = ICON_SIZE + RING_WIDTH * 2;

// Transparent gutter around the ring so its CSS drop shadow is not clipped by
// the window bounds. Keep in sync with the sizes in resources/floating.html.
const SHADOW_MARGIN = 8;

// Side length of the square floating-icon window: the ring plus its shadow
// gutter on every side.
const WINDOW_SIZE = RING_SIZE + SHADOW_MARGIN * 2;

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
 * The window is deliberately not focusable: if clicking the icon stole focus,
 * the launcher window would blur and hide itself *before* the click's toggle
 * handler ran, so the toggle would immediately re-show it and the icon could
 * never close the launcher. Keeping the icon unfocused lets the launcher keep
 * focus while the icon is clicked, so the toggle sees it as visible and hides
 * it. The icon still receives mouse events either way.
 *
 * @returns The created floating-icon window.
 */
export function createFloatingIconWindow(): BrowserWindow {
  floatingWindow = new BrowserWindow({
    width: WINDOW_SIZE,
    height: WINDOW_SIZE,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    focusable: false,
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
 * Returns the current screen bounds of the visible icon (the ring), used as the
 * anchor when positioning the launcher window.
 *
 * The window is larger than the icon because it reserves a transparent gutter
 * for the drop shadow; subtracting that gutter keeps the launcher anchored to
 * the icon rather than to invisible window padding.
 *
 * @returns The icon's x/y/width/height bounds (defaulting to the origin).
 */
export function getFloatingIconBounds(): { x: number; y: number; width: number; height: number } {
  const bounds = floatingWindow?.getBounds();
  if (!bounds) {
    return { x: 0, y: 0, width: RING_SIZE, height: RING_SIZE };
  }
  return {
    x: bounds.x + SHADOW_MARGIN,
    y: bounds.y + SHADOW_MARGIN,
    width: RING_SIZE,
    height: RING_SIZE,
  };
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
 * Shows the floating icon's context menu (show/hide launcher, quit).
 *
 * The menu is rebuilt on every right-click, so its labels always follow the
 * language currently configured in settings.json, and the launcher entry names
 * the action it will actually perform.
 */
export function showFloatingContextMenu(): void {
  const messages = getMessages(readLanguage());
  const launcherLabel = isLauncherVisible() ? messages.hideLauncher : messages.showLauncher;
  const menu = Menu.buildFromTemplate([
    { label: launcherLabel, click: () => handleIconClick() },
    { type: 'separator' },
    { label: messages.quitApp, click: () => app.quit() },
  ]);
  if (floatingWindow !== null) {
    menu.popup({ window: floatingWindow });
  }
}
