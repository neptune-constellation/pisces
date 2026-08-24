import { Box, Text } from 'ink';
import type { HistoryEntry } from '../history/store.js';
import { formatTimestamp } from '../history/store.js';
import { displayWidth, truncateWithEllipsis, entryIcon } from './display.js';

/**
 * Props for the HistoryView component.
 */
interface HistoryViewProps {
  /** The recently-opened entries, newest first. */
  entries: HistoryEntry[];
  /** The index of the currently selected entry. */
  selectedIndex: number;
}

// Accent color for the title and selected rows.
const ACCENT_COLOR = '#7C3AED';

// Accent color for the selected result row.
const SELECTED_ROW_COLOR = '#06B6D4';

// Maximum display width (in columns) for a history row's name + description.
const HISTORY_CONTENT_MAX_WIDTH = 54;

// Fixed column widths shared with the palette result rows.
const MARKER_WIDTH = 2; // selection marker "› " or "  "
const ICON_WIDTH = 2; // emoji icons occupy two terminal columns
const ICON_GAP_WIDTH = 1; // single space between icon and name

// Indentation for the timestamp line so it aligns under the row's name.
const TIMESTAMP_INDENT = MARKER_WIDTH + ICON_WIDTH + ICON_GAP_WIDTH;

/**
 * Computes the display name and description for a history row, truncating so
 * the row never wraps.
 * @param label - The entry label (e.g. "cloud-admin + claude").
 * @param description - The entry description (usually the directory path).
 * @returns The name and description strings to render.
 */
function computeRowTexts(
  label: string,
  description: string,
): { nameText: string; descText: string } {
  const nameWidth = displayWidth(label);

  if (nameWidth >= HISTORY_CONTENT_MAX_WIDTH) {
    return {
      nameText: truncateWithEllipsis(label, HISTORY_CONTENT_MAX_WIDTH),
      descText: '',
    };
  }

  const remainingForDesc = HISTORY_CONTENT_MAX_WIDTH - nameWidth - 1;
  if (remainingForDesc <= 0) {
    return { nameText: label, descText: '' };
  }
  return {
    nameText: label,
    descText: truncateWithEllipsis(description, remainingForDesc),
  };
}

/**
 * Renders a single recently-opened entry: a main line (marker + icon + name +
 * path) with the timestamp on a dim, indented line beneath it.
 */
function HistoryRow({
  entry,
  isSelected,
}: {
  /** The history entry to render. */
  entry: HistoryEntry;
  /** Whether this row is the currently selected entry. */
  isSelected: boolean;
}): React.ReactElement {
  const marker = isSelected ? '› ' : '  ';
  const { nameText, descText } = computeRowTexts(entry.entry.label, entry.entry.description);
  const timeText = formatTimestamp(entry.openedAt);

  return (
    <Box flexDirection="column">
      <Text>
        <Text color={isSelected ? SELECTED_ROW_COLOR : undefined} bold={isSelected}>
          {marker}
          {entryIcon(entry.entry)} {nameText}
        </Text>
        {descText !== '' && <Text dimColor> {descText}</Text>}
      </Text>
      <Text dimColor>
        {' '.repeat(TIMESTAMP_INDENT)}
        {timeText}
      </Text>
    </Box>
  );
}

/**
 * The recently-opened popup shown when the user presses the history shortcut.
 *
 * Lists the most recent launches (agents, editors, and directories) with the
 * open time displayed beneath each row. It replaces the palette while open;
 * input handling (navigation, reopen, back) lives in the parent App component.
 */
export function HistoryView({ entries, selectedIndex }: HistoryViewProps): React.ReactElement {
  return (
    <Box flexDirection="column" alignItems="center" marginTop={1}>
      <Box
        flexDirection="column"
        width={HISTORY_CONTENT_MAX_WIDTH + MARKER_WIDTH + ICON_WIDTH + ICON_GAP_WIDTH + 1}
      >
        <Text bold color={ACCENT_COLOR}>
          {'Recently opened'}
        </Text>
        <Text dimColor>{'─'.repeat(18)}</Text>

        <Box marginTop={1}>
          <Text dimColor>
            <Text bold color="#FFFFFF">
              {'↑↓'}
            </Text>
            {' navigate  ·  '}
            <Text bold color="#FFFFFF">
              {'enter'}
            </Text>
            {' reopen  ·  '}
            <Text bold color="#FFFFFF">
              {'esc'}
            </Text>
            {' back'}
          </Text>
        </Box>

        {entries.length === 0 ? (
          <Box marginTop={1}>
            <Text dimColor>{'  No recent opens yet'}</Text>
          </Box>
        ) : (
          <Box flexDirection="column" marginTop={1}>
            {entries.map((entry, index) => (
              <HistoryRow
                key={`${entry.openedAt}-${entry.entry.label}`}
                entry={entry}
                isSelected={index === selectedIndex}
              />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
