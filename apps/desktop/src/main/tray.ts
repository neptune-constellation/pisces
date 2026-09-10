import { Menu, Tray, app, nativeImage } from 'electron';
import { join } from 'node:path';
import { getMessages } from '@lysun001/pisces-core';
import { handleIconClick } from './floating-icon.js';
import { isLauncherVisible } from './launcher-window.js';
import { readLanguage } from './language.js';

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
 * Builds the tray context menu with labels in the configured language and a
 * launcher entry that names the action it will actually perform.
 *
 * @returns The built context menu.
 */
function buildTrayMenu(): Menu {
  const messages = getMessages(readLanguage());
  const launcherLabel = isLauncherVisible() ? messages.hideLauncher : messages.showLauncher;
  return Menu.buildFromTemplate([
    { label: launcherLabel, click: () => handleIconClick() },
    { type: 'separator' },
    { label: messages.quitApp, click: () => app.quit() },
  ]);
}

/**
 * Creates the system tray icon with a context menu.
 *
 * The tray is the only way to quit the app; its menu also lets the user reveal
 * or hide the launcher window directly from the tray. The menu is rebuilt on
 * every click so its labels always match the configured language and the
 * launcher's current visibility.
 *
 * @returns The created tray instance.
 */
export function createTray(): Tray {
  const icon = nativeImage.createFromPath(getIconPath()).resize({ width: 16, height: 16 });
  const tray = new Tray(icon);
  tray.setToolTip('Pisces');

  const popUpMenu = (): void => tray.popUpContextMenu(buildTrayMenu());
  tray.on('click', popUpMenu);
  tray.on('right-click', popUpMenu);

  return tray;
}
