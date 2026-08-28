import { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, Text, useInput, useStdout, useApp } from 'ink';
import { Banner, PISCES_VERSION } from './banner.js';
import { PaletteView } from './palette.js';
import { HistoryView } from './history.js';
import { loadConfig, watchConfig, type PaletteEntry, type ConfigData } from '../config/loader.js';
import { searchEntries, getSubdirectoryEntries } from '../search/fuzzy.js';
import { launchEntry, launchBlankTerminal } from '../launcher/spawn.js';
import { loadHistory, recordOpen, type HistoryEntry } from '../history/store.js';
import type { DefaultConfig } from '../config/schema.js';

/**
 * Loads the config and normalizes the outcome into entries, an optional default
 * config, and an optional error message, so a broken config can be shown in the
 * TUI instead of crashing the process.
 *
 * @returns The loaded config data and a displayable error message, if any.
 */
function loadConfigState(): {
  entries: PaletteEntry[];
  defaultConfig: DefaultConfig | null;
  error: string | null;
} {
  try {
    const data: ConfigData = loadConfig();
    return { entries: data.entries, defaultConfig: data.defaultConfig, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { entries: [], defaultConfig: null, error: message };
  }
}

/**
 * The root Ink application component.
 *
 * The palette is always visible on launch — no idle screen.
 * Manages the search query, the selected result index, and the list of config
 * entries. Handles all keyboard input centrally and delegates rendering to
 * Banner and PaletteView.
 */
export function App(): React.ReactElement {
  const [config, setConfig] = useState(loadConfigState);
  const entries = config.entries;
  const defaultConfig = config.defaultConfig;
  const configError = config.error;

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Recently-opened popup state
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Ink's graceful exit function — triggers waitUntilExit in the entry point
  const { exit } = useApp();

  // Live terminal size so the layout fills the available height
  const { stdout } = useStdout();
  const terminalRows = stdout?.rows ?? 24;

  // Watch config files for changes
  useEffect(() => {
    let watcher: ReturnType<typeof watchConfig> | null = null;
    try {
      watcher = watchConfig(() => {
        setConfig(loadConfigState());
      });
    } catch {
      // Watcher setup failed — config dir may not exist
    }
    return () => {
      watcher?.close();
    };
  }, []);

  // Compute filtered results
  const results = useMemo(() => {
    if (query.length === 0) {
      // Show only directories and agent-only entries when no query
      return entries.filter((e) => e.category !== 'combo');
    }
    // When the query contains a path separator, browse subdirectories of the
    // matched location instead of showing agent combos.
    if (query.includes('/') || query.includes('\\')) {
      return getSubdirectoryEntries(query, entries);
    }
    return searchEntries(query, entries);
  }, [query, entries]);

  // Clamp selected index to valid range when results change
  const safeIndex = Math.min(selectedIndex, Math.max(0, results.length - 1));

  /**
   * Handles the selection of a palette entry: launches the editor or terminal.
   *
   * @param entry - The palette entry to launch.
   */
  const handleSelect = useCallback((entry: PaletteEntry) => {
    recordOpen(entry);
    launchEntry(entry);
  }, []);

  /**
   * Launches the default path and command configured for Ctrl+D.
   * Opens a blank terminal window when the default config is unset.
   */
  const handleDefaultLaunch = useCallback(() => {
    if (defaultConfig === null || !defaultConfig.path) {
      launchBlankTerminal();
      return;
    }
    const entry: PaletteEntry = {
      label: 'default',
      description: defaultConfig.path,
      directory: defaultConfig.path,
      agentCommand: defaultConfig.command ?? null,
      agentArgs: [],
      editorCommand: null,
      editorArgs: [],
      locationKeys: [],
      agentKeys: [],
      editorKeys: [],
      category: 'directory',
    };
    recordOpen(entry);
    launchEntry(entry);
  }, [defaultConfig]);

  /**
   * Opens the recently-opened popup, loading the freshest history from disk.
   */
  const handleOpenHistory = useCallback(() => {
    setHistoryEntries(loadHistory());
    setHistoryIndex(0);
    setHistoryOpen(true);
  }, []);

  /**
   * Re-launches the selected history entry and closes the popup.
   */
  const handleHistorySelect = useCallback(() => {
    const selected = historyEntries[historyIndex];
    if (!selected) {
      return;
    }
    recordOpen(selected.entry);
    launchEntry(selected.entry);
    setHistoryOpen(false);
  }, [historyEntries, historyIndex]);

  // Centralized keyboard input handling
  useInput((input, key) => {
    // Ctrl+C always quits, from any mode
    if (key.ctrl && input === 'c') {
      exit();
      return;
    }

    // Recently-opened popup mode
    if (historyOpen) {
      // Escape or Ctrl+R closes the popup and returns to the palette
      if (key.escape || ((key.ctrl || key.meta) && input === 'r')) {
        setHistoryOpen(false);
        return;
      }
      if (key.upArrow || (key.ctrl && (input === 'k' || input === 'p'))) {
        setHistoryIndex((prev) => Math.max(0, prev - 1));
        return;
      }
      if (key.downArrow || (key.ctrl && (input === 'j' || input === 'n'))) {
        setHistoryIndex((prev) => Math.min(historyEntries.length - 1, prev + 1));
        return;
      }
      if (key.return) {
        handleHistorySelect();
        return;
      }
      return;
    }

    // Exit on Escape
    if (key.escape) {
      exit();
      return;
    }

    // Ctrl+D (or Cmd+D on macOS): launch the default path/command
    if ((key.ctrl || key.meta) && input === 'd') {
      handleDefaultLaunch();
      return;
    }

    // Ctrl+R (or Cmd+R on macOS): open the recently-opened popup
    if ((key.ctrl || key.meta) && input === 'r') {
      handleOpenHistory();
      return;
    }

    if (key.return) {
      if (results[safeIndex]) {
        handleSelect(results[safeIndex]);
        setQuery('');
        setSelectedIndex(0);
      }
      return;
    }

    if (key.upArrow || (key.ctrl && (input === 'k' || input === 'p'))) {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
      return;
    }

    if (key.downArrow || (key.ctrl && (input === 'j' || input === 'n'))) {
      setSelectedIndex((prev) => Math.min(results.length - 1, prev + 1));
      return;
    }

    if (key.backspace || key.delete) {
      setQuery((prev) => prev.slice(0, -1));
      setSelectedIndex(0);
      return;
    }

    // Regular character input (filter out control characters)
    if (input && !key.ctrl && !key.meta) {
      setQuery((prev) => prev + input);
      setSelectedIndex(0);
    }
  });

  return (
    <Box flexDirection="column" height={terminalRows}>
      {/* Main content area */}
      <Box flexDirection="column" flexGrow={1} alignItems="center" paddingX={1}>
        {historyOpen ? (
          <HistoryView entries={historyEntries} selectedIndex={historyIndex} />
        ) : (
          <>
            <Banner />
            {configError !== null ? (
              <Box marginTop={1}>
                <Text color="#EF4444">{configError}</Text>
              </Box>
            ) : (
              <PaletteView query={query} results={results} selectedIndex={safeIndex} />
            )}
          </>
        )}
      </Box>

      {/* Bottom status bar */}
      <Box justifyContent="space-between" paddingX={1}>
        <Text dimColor>{'~'}</Text>
        <Text dimColor>{PISCES_VERSION}</Text>
      </Box>
    </Box>
  );
}
