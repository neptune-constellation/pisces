import { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, Text, useInput, useStdout, useApp } from 'ink';
import { Banner, PISCES_VERSION } from './banner.js';
import { PaletteView } from './palette.js';
import { loadConfig, watchConfig, type PaletteEntry } from '../config/loader.js';
import { searchEntries } from '../search/fuzzy.js';
import { launchTerminal } from '../launcher/spawn.js';

/**
 * Loads the config and normalizes the outcome into entries plus an optional
 * error message, so a broken config can be shown in the TUI instead of
 * crashing the process.
 *
 * @returns The loaded entries and a displayable error message, if any.
 */
function loadConfigState(): { entries: PaletteEntry[]; error: string | null } {
  try {
    return { entries: loadConfig(), error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { entries: [], error: message };
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
  const configError = config.error;

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

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

  // Centralized keyboard input handling
  useInput((input, key) => {
    // Exit on Escape or Ctrl+C
    if (key.escape || input === '' || (key.ctrl && input === 'c')) {
      exit();
      return;
    }

    if (key.return) {
      if (results[safeIndex]) {
        handleSelect(results[safeIndex]);
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
      </Box>

      {/* Bottom status bar */}
      <Box justifyContent="space-between" paddingX={1}>
        <Text dimColor>{'~'}</Text>
        <Text dimColor>{PISCES_VERSION}</Text>
      </Box>
    </Box>
  );
}
