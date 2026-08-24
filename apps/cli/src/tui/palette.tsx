import { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import type { PaletteEntry } from '../config/loader.js';

/**
 * Props for the PaletteView component.
 */
interface PaletteViewProps {
  /** The current search query string. */
  query: string;
  /** The filtered and ranked list of palette entries. */
  results: PaletteEntry[];
  /** The index of the currently selected entry in the results list. */
  selectedIndex: number;
}

// Accent color for the vertical bar on the left edge of the search box
const SEARCH_BAR_COLOR = '#7C3AED';

// Background fill for the search box body
const SEARCH_BOX_BACKGROUND = '#262626';

// Accent color for the selected result row
const SELECTED_ROW_COLOR = '#06B6D4';

// Maximum number of result rows shown at once
const MAX_VISIBLE_RESULTS = 10;

// Maximum display width (in columns) available for a result row's
// name + description portion, after the marker, icon and padding.
const ROW_CONTENT_MAX_WIDTH = 54;

// Total width of the search box background area in terminal columns
const SEARCH_BOX_INNER_WIDTH = 62;

// Width of the left accent bar in terminal columns
const SEARCH_BAR_WIDTH = 1;

// Total palette panel width: accent bar + inner background area
const PALETTE_PANEL_WIDTH = SEARCH_BAR_WIDTH + SEARCH_BOX_INNER_WIDTH;

// Fixed column widths used to right-align the scrollbar glyph to the same
// column on every row, regardless of each row's content width.
const MARKER_WIDTH = 2; // selection marker "› " or "  "
const ICON_WIDTH = 2; // emoji icons (📁 / 🤖 / 💻) occupy two terminal columns
const ICON_GAP_WIDTH = 1; // single space between icon and name
const DESC_GAP_WIDTH = 1; // single space between name and description
const SCROLLBAR_GLYPH_WIDTH = 1; // the scrollbar glyph (│ or █)
const ROW_TOTAL_WIDTH = PALETTE_PANEL_WIDTH; // full row width, scrollbar included

// Blank columns between the accent bar and the query text
const SEARCH_BOX_LEFT_PADDING = 1;

// Width of the block cursor glyph in terminal columns
const CURSOR_COLUMN_WIDTH = 1;

// Placeholder shown on the query line when no query has been typed
const SEARCH_PLACEHOLDER = 'Search projects & agents…';

// Static hint text rendered on the second line of the search box.
// Must match the segments rendered below exactly, character for character,
// because its display width determines the trailing background fill that
// keeps the hint line's right edge aligned with the query line.
const SEARCH_HINT_TEXT = '↑↓ navigate  ·  enter launch  ·  esc quit';

// Braille blank (U+2800): renders as an empty cell but is not whitespace,
// so Ink 5's per-line trimEnd() cannot strip the trailing background fill.
const BACKGROUND_FILL_CHAR = '⠀';

// Matches characters that occupy two terminal columns (Hangul jamo, CJK radicals/kana,
// CJK ideographs, Hangul syllables, CJK compat, fullwidth forms, emoji, …).
// Written with explicit \u escapes so narrow punctuation such as … (U+2026)
// or · (U+00B7) is never miscounted as full-width, which would otherwise
// skew the background fill and break the box's right-edge alignment.
const FULL_WIDTH_CHAR_REGEX =
  /[\u1100-\u11FF\u2E80-\u303E\u3041-\u33FF\u3400-\u4DBF\u4E00-\u9FFF\uAC00-\uD7A3\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFFEF\u{1F000}-\u{1FAFF}]/u;

/**
 * Approximates the terminal display width of a string,
 * counting full-width characters as two columns.
 * @param text - The string to measure.
 * @returns The estimated number of terminal columns the string occupies.
 */
function displayWidth(text: string): number {
  let totalWidth = 0;
  for (const char of text) {
    totalWidth += FULL_WIDTH_CHAR_REGEX.test(char) ? 2 : 1;
  }
  return totalWidth;
}

/**
 * Truncates a string so its display width never exceeds the given maximum.
 * @param text - The string to truncate.
 * @param maxWidth - The maximum allowed display width in columns.
 * @returns The truncated string.
 */
function truncateToWidth(text: string, maxWidth: number): string {
  let truncatedText = '';
  let usedWidth = 0;
  for (const char of text) {
    const charWidth = FULL_WIDTH_CHAR_REGEX.test(char) ? 2 : 1;
    if (usedWidth + charWidth > maxWidth) {
      break;
    }
    truncatedText += char;
    usedWidth += charWidth;
  }
  return truncatedText;
}

/**
 * Truncates a string to fit within the given display width, appending an
 * ellipsis when the original text is longer than the allowed width.
 * @param text - The string to truncate.
 * @param maxWidth - The maximum allowed display width in columns.
 * @returns The truncated string, with a trailing ellipsis if truncated.
 */
function truncateWithEllipsis(text: string, maxWidth: number): string {
  if (displayWidth(text) <= maxWidth) {
    return text;
  }
  const ellipsis = '…';
  return truncateToWidth(text, maxWidth - displayWidth(ellipsis)) + ellipsis;
}

/**
 * Returns the icon glyph for a palette entry.
 *
 * Editor entries (and location+editor combos) show a laptop, agent-only
 * entries a robot, everything else a folder.
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
 * Computes the start index of the visible result window so that the selected
 * entry always stays within view, roughly centered when the list is long enough.
 * @param selectedIndex - The index of the selected entry in the full results list.
 * @param total - The total number of results.
 * @param maxVisible - The maximum number of results shown at once.
 * @returns The index of the first visible result.
 */
function computeScrollStart(selectedIndex: number, total: number, maxVisible: number): number {
  if (total <= maxVisible) {
    return 0;
  }
  const half = Math.floor(maxVisible / 2);
  let start = selectedIndex - half;
  if (start < 0) {
    start = 0;
  }
  const maxStart = total - maxVisible;
  if (start > maxStart) {
    start = maxStart;
  }
  return start;
}

/**
 * Computes the display name and description for a result row, applying the
 * truncation rules so the row never wraps:
 * 1. Name alone exceeds the budget → truncate the name with an ellipsis, no path.
 * 2. Otherwise → show the full name, then the path truncated with an ellipsis
 *    to fill whatever width remains.
 * @param entry - The palette entry to compute texts for.
 * @returns The name and description strings to render.
 */
function computeRowTexts(entry: PaletteEntry): { nameText: string; descText: string } {
  const nameWidth = displayWidth(entry.label);

  // Name alone exceeds the budget — truncate the name, hide the path
  if (nameWidth >= ROW_CONTENT_MAX_WIDTH) {
    return {
      nameText: truncateWithEllipsis(entry.label, ROW_CONTENT_MAX_WIDTH),
      descText: '',
    };
  }

  // Full name + path truncated to fill the remaining width (1 col for the space)
  const remainingForDesc = ROW_CONTENT_MAX_WIDTH - nameWidth - 1;
  if (remainingForDesc <= 0) {
    return { nameText: entry.label, descText: '' };
  }
  return {
    nameText: entry.label,
    descText: truncateWithEllipsis(entry.description, remainingForDesc),
  };
}

/**
 * A full-width background-filled line used as vertical padding inside the
 * search box, giving it the taller, roomier look of opencode's input panel.
 */
function BoxPaddingLine(): React.ReactElement {
  return (
    <Text>
      <Text backgroundColor={SEARCH_BAR_COLOR}> </Text>
      <Text backgroundColor={SEARCH_BOX_BACKGROUND}>
        {BACKGROUND_FILL_CHAR.repeat(SEARCH_BOX_INNER_WIDTH)}
      </Text>
    </Text>
  );
}

/**
 * Renders a single result row with its scrollbar glyph right-aligned to a
 * fixed column, so the scrollbar stays a straight vertical line across all
 * rows regardless of how wide each row's content is.
 */
function ResultRow({
  entry,
  isSelected,
  showThumb,
}: {
  /** The palette entry to render. */
  entry: PaletteEntry;
  /** Whether this row is the currently selected entry. */
  isSelected: boolean;
  /** Whether this row shows the scrollbar thumb (█) rather than the track (│). */
  showThumb: boolean;
}): React.ReactElement {
  const marker = isSelected ? '› ' : '  ';
  const { nameText, descText } = computeRowTexts(entry);

  // Exact width of the row content: marker + icon + gap + name (+ gap + description)
  const contentWidth =
    MARKER_WIDTH +
    ICON_WIDTH +
    ICON_GAP_WIDTH +
    displayWidth(nameText) +
    (descText !== '' ? DESC_GAP_WIDTH + displayWidth(descText) : 0);

  // Padding so the scrollbar glyph lands on the same column on every row
  const paddingWidth = ROW_TOTAL_WIDTH - SCROLLBAR_GLYPH_WIDTH - contentWidth;

  return (
    <Text>
      <Text color={isSelected ? SELECTED_ROW_COLOR : undefined} bold={isSelected}>
        {marker}
        {entryIcon(entry)} {nameText}
      </Text>
      {descText !== '' && <Text dimColor> {descText}</Text>}
      <Text>{' '.repeat(Math.max(0, paddingWidth))}</Text>
      {showThumb ? (
        <Text color={SELECTED_ROW_COLOR} bold>
          {'█'}
        </Text>
      ) : (
        <Text dimColor>{'│'}</Text>
      )}
    </Text>
  );
}

/**
 * A blinking block cursor for the search box, toggling between a filled block
 * and a blank cell to mimic a real terminal cursor.
 */
function Cursor(): React.ReactElement {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => setVisible((prev) => !prev), 800);
    return () => clearInterval(interval);
  }, []);
  return <Text color={SEARCH_BAR_COLOR}>{visible ? '█' : ' '}</Text>;
}

/**
 * The opencode-style search box: a filled panel with a violet accent bar
 * on the left edge, the block cursor plus query on the first line and
 * a shortcut hint on the second line, padded vertically like opencode.
 *
 * Ink 5 has no Box background support, so each line is rendered as Text
 * segments carrying the background color, padded to a fixed width.
 *
 * @param query - The current search query string.
 */
function SearchBox({ query }: { query: string }): React.ReactElement {
  // Maximum columns available for the query text itself
  const maxQueryWidth = SEARCH_BOX_INNER_WIDTH - SEARCH_BOX_LEFT_PADDING - CURSOR_COLUMN_WIDTH;
  // Visible portion of the query, truncated to fit the box
  const visibleQuery = truncateToWidth(query, maxQueryWidth);
  // First-line text whose width determines the trailing fill
  const queryLineText = query.length > 0 ? visibleQuery : SEARCH_PLACEHOLDER;
  // Trailing background fill columns on the query line
  const queryLineFill =
    SEARCH_BOX_INNER_WIDTH -
    SEARCH_BOX_LEFT_PADDING -
    displayWidth(queryLineText) -
    CURSOR_COLUMN_WIDTH;
  // Trailing background fill columns on the hint line
  const hintLineFill =
    SEARCH_BOX_INNER_WIDTH - SEARCH_BOX_LEFT_PADDING - displayWidth(SEARCH_HINT_TEXT);

  return (
    <Box flexDirection="column">
      {/* Top padding line */}
      <BoxPaddingLine />
      {/* Query line — the cursor sits at the head while the query is empty */}
      <Text>
        <Text backgroundColor={SEARCH_BAR_COLOR}> </Text>
        <Text backgroundColor={SEARCH_BOX_BACKGROUND}>{' '.repeat(SEARCH_BOX_LEFT_PADDING)}</Text>
        {query.length > 0 ? (
          <Text backgroundColor={SEARCH_BOX_BACKGROUND}>
            {visibleQuery}
            <Cursor />
          </Text>
        ) : (
          <Text backgroundColor={SEARCH_BOX_BACKGROUND}>
            <Cursor />
            <Text dimColor>{SEARCH_PLACEHOLDER}</Text>
          </Text>
        )}
        <Text backgroundColor={SEARCH_BOX_BACKGROUND}>
          {BACKGROUND_FILL_CHAR.repeat(Math.max(0, queryLineFill))}
        </Text>
      </Text>
      {/* Spacer between query and hint lines */}
      <BoxPaddingLine />
      {/* Hint line */}
      <Text>
        <Text backgroundColor={SEARCH_BAR_COLOR}> </Text>
        <Text backgroundColor={SEARCH_BOX_BACKGROUND}>{' '.repeat(SEARCH_BOX_LEFT_PADDING)}</Text>
        <Text backgroundColor={SEARCH_BOX_BACKGROUND} color={SELECTED_ROW_COLOR} bold>
          {'↑↓'}
        </Text>
        <Text backgroundColor={SEARCH_BOX_BACKGROUND} dimColor>
          {' navigate  ·  '}
        </Text>
        <Text backgroundColor={SEARCH_BOX_BACKGROUND} bold>
          {'enter'}
        </Text>
        <Text backgroundColor={SEARCH_BOX_BACKGROUND} dimColor>
          {' launch  ·  '}
        </Text>
        <Text backgroundColor={SEARCH_BOX_BACKGROUND} color={SELECTED_ROW_COLOR} bold>
          {'esc'}
        </Text>
        <Text backgroundColor={SEARCH_BOX_BACKGROUND} dimColor>
          {' quit'}
        </Text>
        <Text backgroundColor={SEARCH_BOX_BACKGROUND}>
          {BACKGROUND_FILL_CHAR.repeat(Math.max(0, hintLineFill))}
        </Text>
      </Text>
      {/* Bottom padding line */}
      <BoxPaddingLine />
    </Box>
  );
}

/**
 * The palette view component that renders the search box, results list, and hint bar.
 *
 * This is a pure presentational component — it receives all state as props.
 * Input handling is managed by the parent App component.
 */
export function PaletteView({
  query,
  results,
  selectedIndex,
}: PaletteViewProps): React.ReactElement {
  // Scroll window so the selected entry stays visible within the list
  const startIndex = computeScrollStart(selectedIndex, results.length, MAX_VISIBLE_RESULTS);
  const visibleResults = results.slice(startIndex, startIndex + MAX_VISIBLE_RESULTS);

  // Whether a scrollbar is needed, and which visible row shows the thumb.
  // The thumb tracks the selected entry's position within the full list.
  const hasScrollbar = results.length > MAX_VISIBLE_RESULTS;
  const thumbIndex = hasScrollbar
    ? Math.round((selectedIndex / (results.length - 1)) * (MAX_VISIBLE_RESULTS - 1))
    : -1;

  return (
    <Box flexDirection="column" alignItems="center">
      <SearchBox query={query} />

      {/* Fixed-width panel keeps results and hints aligned with the search box */}
      <Box flexDirection="column" width={PALETTE_PANEL_WIDTH}>
        {/* Results list with an inline, right-aligned scrollbar glyph per row */}
        <Box flexDirection="column" marginTop={1}>
          {results.length === 0 ? (
            <Text dimColor>{'  No matching entries'}</Text>
          ) : (
            visibleResults.map((entry, index) => {
              const globalIndex = startIndex + index;
              const isSelected = globalIndex === selectedIndex;
              const showThumb = hasScrollbar && index === thumbIndex;
              return (
                <ResultRow
                  key={`${entry.category}-${entry.label}-${entry.description}`}
                  entry={entry}
                  isSelected={isSelected}
                  showThumb={showThumb}
                />
              );
            })
          )}
        </Box>

        {/* Scroll position indicator */}
        {hasScrollbar && <Text dimColor>{`  ${selectedIndex + 1}/${results.length}`}</Text>}

        {/* Hint bar */}
        <Box marginTop={1}>
          <Text dimColor>
            <Text bold color="#FFFFFF">
              {'ctrl'}
            </Text>
            {'   +c (quit)   '}
            {'+d (open default)'}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
