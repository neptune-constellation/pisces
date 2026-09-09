import { contextBridge, ipcRenderer } from 'electron';

/**
 * The API bridge exposed to renderer windows as `window.pisces`.
 *
 * The floating-icon window uses the fire-and-forget drag/click methods; the
 * launcher window uses the invoke-based config/search/launch/history methods.
 * Values crossing the bridge are structured-clone safe (plain objects).
 */
const piscesApi = {
  beginDrag: (): void => ipcRenderer.send('floating:begin-drag'),
  moveBy: (dx: number, dy: number): void => ipcRenderer.send('floating:move-by', dx, dy),
  toggleLauncher: (): void => ipcRenderer.send('floating:toggle-launcher'),
  showContextMenu: (): void => ipcRenderer.send('floating:context-menu'),

  getState: (): Promise<unknown> => ipcRenderer.invoke('app:get-state'),
  search: (query: string): Promise<unknown> => ipcRenderer.invoke('search:run', query),
  launch: (entry: unknown): Promise<unknown> => ipcRenderer.invoke('entry:launch', entry),
  openBlankTerminal: (): Promise<unknown> => ipcRenderer.invoke('terminal:blank'),
  getHistory: (): Promise<unknown> => ipcRenderer.invoke('history:get'),
  closeWindow: (): Promise<unknown> => ipcRenderer.invoke('window:close'),

  onShow: (callback: () => void): (() => void) => {
    const listener = (): void => callback();
    ipcRenderer.on('launcher:shown', listener);
    return () => ipcRenderer.removeListener('launcher:shown', listener);
  },
};

contextBridge.exposeInMainWorld('pisces', piscesApi);
