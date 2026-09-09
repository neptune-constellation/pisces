import { useEffect, useRef } from 'react';
import type { PaletteEntry } from '@lysun001/pisces-core';

/**
 * Props for the launcher view.
 */
interface LauncherViewProps {
  /** The current search query string. */
  query: string;
  /** The filtered list of palette entries to display. */
  results: PaletteEntry[];
  /** The index of the currently selected entry. */
  selectedIndex: number;
  /** A displayable config error, or null when the config loaded cleanly. */
  error: string | null;
  /** Invoked when the search query changes. */
  onQueryChange: (value: string) => void;
  /** Invoked when an entry is selected (launch). */
  onSelect: (entry: PaletteEntry) => void;
  /** Invoked when the pointer hovers over an entry. */
  onHover: (index: number) => void;
  /** Invoked when the "Terminal" button is clicked. */
  onOpenTerminal: () => void;
  /** Invoked when the "Recent" button is clicked. */
  onOpenHistory: () => void;
}

/**
 * Returns the icon glyph for a palette entry.
 *
 * @param entry - The palette entry to get the icon for.
 * @returns The icon character for the entry.
 */
function entryIcon(entry: PaletteEntry): string {
  if (entry.editorCommand !== null) {
    return '💻';
  }
  return entry.category === 'agent' ? '🤖' : '📁';
}

/**
 * The launcher view: toolbar (Terminal / Recent), search box, and the result
 * list of configured entries. Selection is handled by the parent App via
 * keyboard, while mouse clicks select directly.
 */
export function LauncherView({
  query,
  results,
  selectedIndex,
  error,
  onQueryChange,
  onSelect,
  onHover,
  onOpenTerminal,
  onOpenHistory,
}: LauncherViewProps): React.ReactElement {
  const listRef = useRef<HTMLUListElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Keep the selected row in view when keyboard navigation moves past the
  // visible area of the scrollable results list.
  useEffect(() => {
    listRef.current?.children[selectedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  return (
    <div className="launcher">
      <div className="toolbar">
        <button type="button" className="btn toolbar-btn" onClick={onOpenTerminal}>
          Terminal
        </button>
        <button type="button" className="btn toolbar-btn" onClick={onOpenHistory}>
          Recent
        </button>
      </div>

      <div className="search-box" onClick={() => inputRef.current?.focus()}>
        <textarea
          ref={inputRef}
          className="search-input"
          rows={1}
          value={query}
          placeholder="Search projects & agents..."
          autoFocus
          onChange={(event) => onQueryChange(event.target.value)}
        />
        <div className="search-hint">↑↓ navigate · enter launch · esc quit</div>
      </div>

      {error !== null ? (
        <div className="error">{error}</div>
      ) : results.length === 0 ? (
        <div className="empty">No matching entries</div>
      ) : (
        <ul className="results" ref={listRef}>
          {results.map((entry, index) => (
            <li key={`${entry.category}-${entry.label}-${entry.description}`}>
              <button
                type="button"
                className={`result-row${index === selectedIndex ? ' selected' : ''}`}
                onClick={() => onSelect(entry)}
                onMouseEnter={() => onHover(index)}
              >
                <span className="result-icon">{entryIcon(entry)}</span>
                <span className="result-label">{entry.label}</span>
                <span className="result-desc">{entry.description}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
