import { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import { Banner } from './banner.js';
import { PaletteView } from './palette.js';
import { loadConfig, watchConfig, type PaletteEntry } from '../config/loader.js';
import { searchEntries } from '../search/fuzzy.js';
import { launchTerminal } from '../launcher/spawn.js';

/**
 * The root Ink application component.
 *
 * Manages the TUI state: whether the palette is open, the search query,
 * the selected result index, and the list of config entries.
 * Handles all keyboard input centrally and delegates rendering to
 * Banner, PaletteView, and the idle screen.
 */
export function App(): React.ReactElement {
  const [entries, setEntries] = useState<PaletteEntry[]>(() => {
    try {
      return loadConfig();
    } catch {
      return [];
    }
  });

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Watch config files for changes
  useEffect(() => {
    let watcher: ReturnType<typeof watchConfig> | null = null;
    try {
      watcher = watchConfig(() => {
        try {
          setEntries(loadConfig());
        } catch {
          // Config is invalid — keep the current entries
        }
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
   * Opens the palette and resets query state.
   */
  const openPalette = useCallback(() => {
    setPaletteOpen(true);
    setQuery('');
    setSelectedIndex(0);
  }, []);

  /**
   * Closes the palette and resets query state.
   */
  const closePalette = useCallback(() => {
    setPaletteOpen(false);
    setQuery('');
    setSelectedIndex(0);
  }, []);

  /**
   * Handles the selection of a palette entry: launches the terminal and closes the palette.
   *
   * @param entry - The palette entry to launch.
   */
  const handleSelect = useCallback(
    (entry: PaletteEntry) => {
      launchTerminal(entry);
      closePalette();
    },
    [closePalette],
  );

  // Centralized keyboard input handling
  useInput((input, key) => {
    // Global: Ctrl+P toggles the palette
    if (key.ctrl && input === 'p') {
      if (paletteOpen) {
        closePalette();
      } else {
        openPalette();
      }
      return;
    }

    if (!paletteOpen) {
      // Idle screen input
      if (input === '/') {
        openPalette();
      } else if (input === 'q') {
        process.exit(0);
      }
      return;
    }

    // Palette input
    if (key.escape) {
      closePalette();
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
    <Box flexDirection="column" padding={1}>
      <Banner />

      {paletteOpen ? (
        <PaletteView query={query} results={results} selectedIndex={safeIndex} />
      ) : (
        <Box>
          <Text dimColor>
            {'Press '}
            <Text bold>/</Text>
            {' or '}
            <Text bold>Ctrl+P</Text>
            {' to search'}
          </Text>
        </Box>
      )}
    </Box>
  );
}
