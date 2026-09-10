import { useEffect, useRef } from 'react';
import { getMessages, type Language } from '@lysun001/pisces-core/i18n';
import type { HistoryEntry, PaletteEntry } from '@lysun001/pisces-core';

/**
 * Props for the history view.
 */
interface HistoryViewProps {
  /** The recently-opened entries, newest first. */
  entries: HistoryEntry[];
  /** The index of the currently selected entry. */
  selectedIndex: number;
  /** The UI language for the view's labels. */
  language: Language;
  /** Invoked to return to the launcher view. */
  onBack: () => void;
  /** Invoked when a history entry is selected (re-launch). */
  onSelect: (entry: PaletteEntry) => void;
  /** Invoked when the pointer hovers over an entry. */
  onHover: (index: number) => void;
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
 * Formats an ISO 8601 timestamp as local `YYYY-MM-DD HH:mm`.
 *
 * @param iso - The ISO 8601 timestamp string.
 * @returns The formatted timestamp, or an empty string when invalid.
 */
function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const pad = (value: number): string => value.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

/**
 * The recently-opened view: a list of the last launches (label + path with a
 * dimmed timestamp beneath), plus a back button to return to the launcher.
 */
export function HistoryView({
  entries,
  selectedIndex,
  language,
  onBack,
  onSelect,
  onHover,
}: HistoryViewProps): React.ReactElement {
  const messages = getMessages(language);
  const listRef = useRef<HTMLUListElement | null>(null);

  // Keep the selected row in view when keyboard navigation moves past the
  // visible area of the scrollable results list.
  useEffect(() => {
    listRef.current?.children[selectedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  return (
    <div className="history">
      <div className="history-header">
        <button type="button" className="btn back-btn" onClick={onBack}>
          {messages.backLabel}
        </button>
        <span className="history-title">{messages.recentlyOpened}</span>
      </div>

      {entries.length === 0 ? (
        <div className="empty">{messages.noRecentOpens}</div>
      ) : (
        <ul className="results" ref={listRef}>
          {entries.map((history, index) => (
            <li key={`${history.openedAt}-${history.entry.label}`}>
              <button
                type="button"
                className={`result-row${index === selectedIndex ? ' selected' : ''}`}
                onClick={() => onSelect(history.entry)}
                onMouseEnter={() => onHover(index)}
              >
                <span className="result-icon">{entryIcon(history.entry)}</span>
                <span className="result-main">
                  <span className="result-label">{history.entry.label}</span>
                  <span className="result-desc">{history.entry.description}</span>
                  <span className="result-time">{formatTimestamp(history.openedAt)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
