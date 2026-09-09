import type { DefaultConfig, HistoryEntry, PaletteEntry } from '@lysun001/pisces-core';

/**
 * The state returned by the `app:get-state` IPC handler.
 */
export interface PiscesState {
  /** The full list of palette entries derived from the config. */
  entries: PaletteEntry[];
  /** The optional Ctrl+D default launch shortcut. */
  defaultConfig: DefaultConfig | null;
  /** A displayable error message, or null when the config loaded cleanly. */
  error: string | null;
}

/**
 * The `window.pisces` API exposed by the preload script.
 */
export interface PiscesApi {
  /** Notifies the main process that a drag started (captures the icon position). */
  beginDrag(): void;
  /** Moves the floating icon by the given pointer deltas. */
  moveBy(dx: number, dy: number): void;
  /** Toggles the launcher window. */
  toggleLauncher(): void;
  /** Shows the floating icon's context menu. */
  showContextMenu(): void;

  /** Loads the current config state (entries + default + error). */
  getState(): Promise<PiscesState>;
  /** Searches the configured entries with the given query. */
  search(query: string): Promise<PaletteEntry[]>;
  /** Launches a palette entry (terminal or editor). */
  launch(entry: PaletteEntry): Promise<void>;
  /** Opens a new blank terminal window. */
  openBlankTerminal(): Promise<void>;
  /** Loads the recently-opened history. */
  getHistory(): Promise<HistoryEntry[]>;
  /** Hides the launcher window. */
  closeWindow(): Promise<void>;
  /** Registers a callback fired whenever the launcher window is shown. */
  onShow(callback: () => void): () => void;
}

declare global {
  interface Window {
    pisces: PiscesApi;
  }
}
