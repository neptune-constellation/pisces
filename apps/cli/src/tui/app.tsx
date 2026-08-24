import { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, Text, useInput, useStdout, useApp } from 'ink';
import { Banner, PISCES_VERSION } from './banner.js';
import { PaletteView } from './palette.js';
import { loadConfig, watchConfig, type PaletteEntry, type ConfigData } from '../config/loader.js';
import { searchEntries, getSubdirectoryEntries } from '../search/fuzzy.js';
import { launchTerminal } from '../launcher/spawn.js';
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

// Duration in ms before a warning message auto-dismisses
const WARNING_TIMEOUT_MS = 3000;

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
  const [warning, setWarning] = useState<string | null>(null);

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

  // Auto-dismiss warning after a timeout
  useEffect(() => {
    if (warning === null) {
      return;
    }
    const timer = setTimeout(() => setWarning(null), WARNING_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [warning]);

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
   * Handles the selection of a palette entry: launches the terminal.
   *
   * @param entry - The palette entry to launch.
   */
  const handleSelect = useCallback((entry: PaletteEntry) => {
    launchTerminal(entry);
  }, []);

  /**
   * Launches the default path and command configured for Ctrl+D.
   * Shows a warning if the default config is missing or incomplete.
   */
  const handleDefaultLaunch = useCallback(() => {
    if (defaultConfig === null || !defaultConfig.path) {
      setWarning(
        'No default path configured. Add "default": { "path": "...", "command": "..." } to settings.json',
      );
      return;
    }
    const entry: PaletteEntry = {
      label: 'default',
      description: defaultConfig.path,
      directory: defaultConfig.path,
      agentCommand: defaultConfig.command ?? null,
      agentArgs: [],
      locationKeys: [],
      agentKeys: [],
      category: 'directory',
    };
    launchTerminal(entry);
  }, [defaultConfig]);

  // Centralized keyboard input handling
  useInput((input, key) => {
    // Exit on Escape or Ctrl+C
    if (key.escape || (key.ctrl && input === 'c')) {
      exit();
      return;
    }

    // Ctrl+D (or Cmd+D on macOS): launch the default path/command
    if ((key.ctrl || key.meta) && input === 'd') {
      handleDefaultLaunch();
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
        <Banner />
        {configError !== null ? (
          <Box marginTop={1}>
            <Text color="#EF4444">{configError}</Text>
          </Box>
        ) : (
          <PaletteView query={query} results={results} selectedIndex={safeIndex} />
        )}
        {/* Warning message overlay */}
        {warning !== null && (
          <Box marginTop={1}>
            <Text color="#F59E0B">{warning}</Text>
          </Box>
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
