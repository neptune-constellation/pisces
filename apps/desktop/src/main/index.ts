import { app } from 'electron';
import {
  detectInstalledAgents,
  detectInstalledEditors,
  hasSettingsFile,
  toAgentEntries,
  writeSettings,
} from '@lysun001/pisces-core';
import { createFloatingIconWindow } from './floating-icon.js';
import { createLauncherWindow } from './launcher-window.js';
import { createTray } from './tray.js';
import { registerIpcHandlers } from './ipc.js';

/**
 * Runs first-run onboarding when no settings file exists yet, mirroring the
 * CLI: detect installed agents and editors and write them into the initial
 * config, falling back to an empty config when nothing is detected.
 */
async function runOnboardingIfNeeded(): Promise<void> {
  if (hasSettingsFile()) {
    return;
  }
  try {
    const [commands, editors] = await Promise.all([
      detectInstalledAgents(),
      detectInstalledEditors(),
    ]);
    writeSettings({ locations: [], agents: toAgentEntries(commands), editors });
  } catch {
    writeSettings({ locations: [], agents: [], editors: [] });
  }
}

/**
 * The main entry point for the pisces desktop app.
 *
 * Owns the always-on floating icon, the 400×600 launcher window, and the
 * system tray. The floating icon and tray keep the app alive, so the launcher
 * window can be shown and hidden without terminating the process.
 */
function main(): void {
  // A second launch focuses the already-running instance instead of opening a
  // duplicate floating icon.
  if (!app.requestSingleInstanceLock()) {
    app.quit();
    return;
  }

  app.whenReady().then(async () => {
    await runOnboardingIfNeeded();
    registerIpcHandlers();
    createFloatingIconWindow();
    createLauncherWindow();
    createTray();
  });

  // The floating icon and tray are always alive, so never quit when a window
  // is closed — the app only exits via the tray's "Quit" command.
  app.on('window-all-closed', () => {
    // Intentionally empty: keep running in the background.
  });
}

main();
