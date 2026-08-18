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
const MAX_VISIBLE_RESULTS = 8;

// Total width of the search box background area in terminal columns
const SEARCH_BOX_INNER_WIDTH = 62;

// Width of the left accent bar in terminal columns
const SEARCH_BAR_WIDTH = 1;

// Total palette panel width: accent bar + inner background area
const PALETTE_PANEL_WIDTH = SEARCH_BAR_WIDTH + SEARCH_BOX_INNER_WIDTH;

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
const SEARCH_HINT_TEXT = 'esc close  ·  enter launch';

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
 * Returns the icon glyph for a palette entry category.
 * @param entry - The palette entry to get the icon for.
 * @returns The icon character for the entry category.
 */
function entryIcon(entry: PaletteEntry): string {
  return entry.category === 'agent' ? '⚡' : '📁';
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
            <Text color={SEARCH_BAR_COLOR}>{'█'}</Text>
          </Text>
        ) : (
          <Text backgroundColor={SEARCH_BOX_BACKGROUND}>
            <Text color={SEARCH_BAR_COLOR}>{'█'}</Text>
            <Text dimColor>{SEARCH_PLACEHOLDER}</Text>
          </Text>
        )}
        <Text backgroundColor={SEARCH_BOX_BACKGROUND}>
          {BACKGROUND_FILL_CHAR.repeat(Math.max(0, queryLineFill))}
        </Text>
      </Text>
      {/* Hint line */}
      <Text>
        <Text backgroundColor={SEARCH_BAR_COLOR}> </Text>
        <Text backgroundColor={SEARCH_BOX_BACKGROUND}>{' '.repeat(SEARCH_BOX_LEFT_PADDING)}</Text>
        <Text backgroundColor={SEARCH_BOX_BACKGROUND} color={SELECTED_ROW_COLOR} bold>
          {'esc'}
        </Text>
        <Text backgroundColor={SEARCH_BOX_BACKGROUND} dimColor>
          {' close  ·  '}
        </Text>
        <Text backgroundColor={SEARCH_BOX_BACKGROUND} bold>
          {'enter'}
        </Text>
        <Text backgroundColor={SEARCH_BOX_BACKGROUND} dimColor>
          {' launch'}
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
  // Only render the first page of results to keep tall lists readable
  const visibleResults = results.slice(0, MAX_VISIBLE_RESULTS);

  return (
    <Box flexDirection="column" alignItems="center">
      <SearchBox query={query} />

      {/* Fixed-width panel keeps results and hints aligned with the search box */}
      <Box flexDirection="column" width={PALETTE_PANEL_WIDTH}>
        {/* Results list */}
        <Box flexDirection="column" marginTop={1}>
          {results.length === 0 ? (
            <Text dimColor>{'  No matching entries'}</Text>
          ) : (
            visibleResults.map((entry, index) => {
              const isSelected = index === selectedIndex;
              return (
                <Box key={`${entry.category}-${entry.label}-${entry.description}`}>
                  <Text color={isSelected ? SELECTED_ROW_COLOR : undefined} bold={isSelected}>
                    {isSelected ? '› ' : '  '}
                    {entryIcon(entry)} {entry.label}
                  </Text>
                  <Text dimColor wrap="truncate-end">
                    {' '}
                    {entry.description}
                  </Text>
                </Box>
              );
            })
          )}
          {results.length > MAX_VISIBLE_RESULTS && (
            <Text dimColor>{`  … ${results.length - MAX_VISIBLE_RESULTS} more`}</Text>
          )}
        </Box>

        {/* Hint bar */}
        <Box marginTop={1}>
          <Text dimColor>
            <Text bold color="#FFFFFF">
              {'↑↓'}
            </Text>
            {' navigate  '}
            <Text bold color="#FFFFFF">
              {'enter'}
            </Text>
            {' launch  '}
            <Text bold color="#FFFFFF">
              {'esc'}
            </Text>
            {' quit'}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
