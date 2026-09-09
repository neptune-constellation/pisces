import { Menu, Tray, app, nativeImage } from 'electron';
import { join } from 'node:path';
import { handleIconClick } from './floating-icon.js';

/**
 * Resolves the absolute path to the tray icon (the same circular logo used by
 * the floating icon).
 *
 * @returns The absolute path to the icon image.
 */
function getIconPath(): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, 'own-logo-circle.png');
  }
  return join(app.getAppPath(), 'resources', 'own-logo-circle.png');
}

/**
 * Creates the system tray icon with a context menu.
 *
 * The tray is the only way to quit the app; its menu also lets the user reveal
 * the launcher window directly from the tray.
 *
 * @returns The created tray instance.
 */
export function createTray(): Tray {
  const icon = nativeImage.createFromPath(getIconPath()).resize({ width: 16, height: 16 });
  const tray = new Tray(icon);
  tray.setToolTip('Pisces');

  const menu = Menu.buildFromTemplate([
    { label: 'Show launcher', click: () => handleIconClick() },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ]);
  tray.setContextMenu(menu);

  return tray;
}
