import { useCallback, useEffect, useState } from 'react';
import type { HistoryEntry, Language, PaletteEntry } from '@lysun001/pisces-core';
import { LauncherView } from './components/LauncherView.js';
import { HistoryView } from './components/HistoryView.js';

type View = 'launcher' | 'history';

/**
 * The root component of the launcher renderer.
 *
 * Switches between the launcher view (search box + results) and the history
 * view (recently opened), holding the query/selection state and delegating
 * every launch to the main process through the preload bridge.
 */
export function App(): React.ReactElement {
  const [view, setView] = useState<View>('launcher');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PaletteEntry[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const runSearch = useCallback(async (nextQuery: string): Promise<void> => {
    const next = await window.pisces.search(nextQuery);
    setResults(next);
    setSelectedIndex(0);
  }, []);

  useEffect(() => {
    void runSearch('');
  }, [runSearch]);

  useEffect(() => {
    void window.pisces.getState().then((state) => {
      setLanguage(state.language);
      setError(state.error);
    });
  }, []);

  // Reset the search state each time the launcher is shown, so reopening
  // starts from an empty query instead of the previous search.
  useEffect(() => {
    return window.pisces.onShow(() => {
      setQuery('');
      setView('launcher');
      void runSearch('');
    });
  }, [runSearch]);

  const close = useCallback((): void => {
    void window.pisces.closeWindow();
  }, []);

  const handleSelect = useCallback(
    async (entry: PaletteEntry): Promise<void> => {
      await window.pisces.launch(entry);
      close();
    },
    [close],
  );

  const handleHover = useCallback((index: number): void => {
    setSelectedIndex(index);
  }, []);

  const handleOpenTerminal = useCallback(async (): Promise<void> => {
    await window.pisces.openBlankTerminal();
    close();
  }, [close]);

  const handleOpenHistory = useCallback(async (): Promise<void> => {
    const entries = await window.pisces.getHistory();
    setHistoryEntries(entries);
    setHistoryIndex(0);
    setView('history');
  }, []);

  const handleBack = useCallback((): void => {
    setView('launcher');
  }, []);

  const handleHistorySelect = useCallback(
    async (entry: PaletteEntry): Promise<void> => {
      await window.pisces.launch(entry);
      close();
    },
    [close],
  );

  const handleHistoryHover = useCallback((index: number): void => {
    setHistoryIndex(index);
  }, []);

  const handleQueryChange = useCallback(
    (value: string): void => {
      setQuery(value);
      void runSearch(value);
    },
    [runSearch],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (view === 'history') {
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          setHistoryIndex((index) => Math.max(0, index - 1));
        } else if (event.key === 'ArrowDown') {
          event.preventDefault();
          setHistoryIndex((index) => Math.min(historyEntries.length - 1, index + 1));
        } else if (event.key === 'Enter') {
          event.preventDefault();
          const selected = historyEntries[historyIndex];
          if (selected) {
            void handleHistorySelect(selected.entry);
          }
        } else if (event.key === 'Escape') {
          event.preventDefault();
          setView('launcher');
        }
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex((index) => Math.max(0, index - 1));
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedIndex((index) => Math.min(results.length - 1, index + 1));
      } else if (event.key === 'Enter') {
        event.preventDefault();
        const selected = results[selectedIndex];
        if (selected) {
          void handleSelect(selected);
        }
      } else if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    view,
    results,
    selectedIndex,
    historyEntries,
    historyIndex,
    handleSelect,
    handleHistorySelect,
    close,
  ]);

  if (view === 'history') {
    return (
      <HistoryView
        entries={historyEntries}
        selectedIndex={historyIndex}
        language={language}
        onBack={handleBack}
        onSelect={handleHistorySelect}
        onHover={handleHistoryHover}
      />
    );
  }

  return (
    <LauncherView
      query={query}
      results={results}
      selectedIndex={selectedIndex}
      error={error}
      language={language}
      onQueryChange={handleQueryChange}
      onSelect={handleSelect}
      onHover={handleHover}
      onOpenTerminal={handleOpenTerminal}
      onOpenHistory={handleOpenHistory}
    />
  );
}
