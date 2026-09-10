import { BrowserWindow, ipcMain } from 'electron';
import {
  loadConfig,
  searchEntries,
  getSubdirectoryEntries,
  launchEntry,
  launchBlankTerminal,
  loadHistory,
  recordOpen,
  type PaletteEntry,
} from '@lysun001/pisces-core';
import { beginDrag, handleIconClick, moveBy, showFloatingContextMenu } from './floating-icon.js';

/**
 * Registers every IPC handler for the desktop app.
 *
 * The floating-icon renderer sends fire-and-forget drag/click events, while the
 * launcher renderer invokes request/response handlers that expose the shared
 * pisces core logic (config, search, launch, history) from the main process.
 */
export function registerIpcHandlers(): void {
  // Floating-icon drag and click events (fire-and-forget).
  ipcMain.on('floating:begin-drag', () => beginDrag());
  ipcMain.on('floating:move-by', (_event, dx: number, dy: number) => moveBy(dx, dy));
  ipcMain.on('floating:toggle-launcher', () => handleIconClick());
  ipcMain.on('floating:context-menu', () => showFloatingContextMenu());

  // Launcher window request/response handlers.
  ipcMain.handle('app:get-state', () => {
    try {
      const { entries, defaultConfig, language } = loadConfig();
      return { entries, defaultConfig, language, error: null };
    } catch (error) {
      return {
        entries: [],
        defaultConfig: null,
        language: 'en',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  ipcMain.handle('search:run', (_event, query: string) => {
    const { entries } = loadConfig();
    if (query.length === 0) {
      return entries.filter((entry) => entry.category !== 'combo');
    }
    if (query.includes('/') || query.includes('\\')) {
      return getSubdirectoryEntries(query, entries);
    }
    return searchEntries(query, entries);
  });

  ipcMain.handle('entry:launch', (_event, entry: PaletteEntry) => {
    recordOpen(entry);
    launchEntry(entry);
  });

  ipcMain.handle('terminal:blank', () => {
    launchBlankTerminal();
  });

  ipcMain.handle('history:get', () => {
    return loadHistory();
  });

  ipcMain.handle('window:close', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.hide();
  });
}
