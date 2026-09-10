import { BrowserWindow, screen } from 'electron';
import { join } from 'node:path';

// Size of the visible launcher card (width × height in pixels).
const CARD_WIDTH = 400;
const CARD_HEIGHT = 600;

// Transparent gutter around the card so its CSS drop shadow is not clipped by
// the window bounds. Keep in sync with the `#root` margin in styles.css.
const SHADOW_MARGIN = 16;

// Size of the transparent window (card + shadow gutter on every side).
const WINDOW_WIDTH = CARD_WIDTH + SHADOW_MARGIN * 2;
const WINDOW_HEIGHT = CARD_HEIGHT + SHADOW_MARGIN * 2;

// Gap (in pixels) between the floating icon and the launcher card.
const ANCHOR_GAP = 8;

let launcherWindow: BrowserWindow | null = null;

/**
 * Creates the hidden launcher window (a 400×600 card plus a transparent gutter
 * for its drop shadow, frameless, transparent so the renderer can draw its own
 * rounded corners).
 *
 * The window is created once and shown/hidden on demand; a `blur` listener
 * hides it whenever focus moves elsewhere so it behaves like a popover.
 *
 * @returns The created launcher window.
 */
export function createLauncherWindow(): BrowserWindow {
  launcherWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    frame: false,
    show: false,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    transparent: true,
    webPreferences: {
      preload: join(import.meta.dirname, '../preload/index.mjs'),
      sandbox: false,
    },
  });

  // Keep the launcher above other always-on-top windows, matching the icon.
  launcherWindow.setAlwaysOnTop(true, 'screen-saver');

  launcherWindow.on('blur', () => {
    launcherWindow?.hide();
  });

  // In development load the Vite dev-server URL; in production load the
  // bundled renderer HTML.
  if (process.env.ELECTRON_RENDERER_URL) {
    launcherWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    launcherWindow.loadFile(join(import.meta.dirname, '../renderer/index.html'));
  }

  return launcherWindow;
}

/**
 * Computes the on-screen position for the launcher window next to the icon.
 *
 * The window is placed to the left of the icon by default, flipping to the
 * right when it would overflow the display's work area. Vertically it is
 * clamped so the full height stays on screen. The nearest display's work area
 * (which already excludes the taskbar) is used, so the position is correct
 * even when the icon sits near a screen edge.
 *
 * @param anchor - The floating icon's bounds.
 * @returns The x/y position for the launcher window.
 */
function computeLauncherPosition(anchor: { x: number; y: number; width: number; height: number }): {
  x: number;
  y: number;
} {
  const display = screen.getDisplayNearestPoint({ x: anchor.x, y: anchor.y });
  const { workArea } = display;

  // Prefer the left side of the icon.
  let cardX = anchor.x - CARD_WIDTH - ANCHOR_GAP;
  if (cardX < workArea.x) {
    // Flip to the right when the left side would overflow.
    cardX = anchor.x + anchor.width + ANCHOR_GAP;
  }

  // Clamp vertically so the full card stays within the work area.
  let cardY = anchor.y;
  if (cardY + CARD_HEIGHT > workArea.y + workArea.height) {
    cardY = workArea.y + workArea.height - CARD_HEIGHT;
  }

  // Clamp the card inside the work area, then shift to the window origin by
  // the transparent shadow gutter.
  cardX = Math.max(workArea.x, Math.min(cardX, workArea.x + workArea.width - CARD_WIDTH));
  cardY = Math.max(workArea.y, Math.min(cardY, workArea.y + workArea.height - CARD_HEIGHT));

  return {
    x: cardX - SHADOW_MARGIN,
    y: cardY - SHADOW_MARGIN,
  };
}

/**
 * Shows the launcher window anchored next to the icon, or hides it when it is
 * already visible (so clicking the icon toggles the window).
 *
 * @param anchor - The floating icon's bounds to anchor against.
 */
export function toggleLauncherWindow(anchor: {
  x: number;
  y: number;
  width: number;
  height: number;
}): void {
  if (!launcherWindow) {
    return;
  }
  if (launcherWindow.isVisible()) {
    launcherWindow.hide();
    return;
  }
  const { x, y } = computeLauncherPosition(anchor);
  launcherWindow.setPosition(x, y);
  launcherWindow.show();
  launcherWindow.webContents.send('launcher:shown');
}

/**
 * Returns whether the launcher window is currently visible.
 *
 * The tray and floating-icon context menus use this to label their show/hide
 * entry with the action it will actually perform.
 *
 * @returns True when the launcher window is visible.
 */
export function isLauncherVisible(): boolean {
  return launcherWindow?.isVisible() ?? false;
}
