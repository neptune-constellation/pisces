import type { PaletteEntry } from '../config/loader.js';

/**
 * Matches characters that occupy two terminal columns (Hangul jamo, CJK
 * radicals/kana, CJK ideographs, Hangul syllables, CJK compat, fullwidth
 * forms, emoji, …).
 *
 * Written with explicit \u escapes so narrow punctuation such as … (U+2026)
 * or · (U+00B7) is never miscounted as full-width, which would otherwise skew
 * the background fill and break the box's right-edge alignment.
 */
export const FULL_WIDTH_CHAR_REGEX =
  /[\u1100-\u11FF\u2E80-\u303E\u3041-\u33FF\u3400-\u4DBF\u4E00-\u9FFF\uAC00-\uD7A3\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFFEF\u{1F000}-\u{1FAFF}]/u;

/**
 * Approximates the terminal display width of a string, counting full-width
 * characters as two columns.
 * @param text - The string to measure.
 * @returns The estimated number of terminal columns the string occupies.
 */
export function displayWidth(text: string): number {
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
export function truncateToWidth(text: string, maxWidth: number): string {
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
export function truncateWithEllipsis(text: string, maxWidth: number): string {
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
export function entryIcon(entry: PaletteEntry): string {
  if (entry.editorCommand !== null) {
    return '💻';
  }
  return entry.category === 'agent' ? '🤖' : '📁';
}
