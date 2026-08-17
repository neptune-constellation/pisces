import { Box, Text } from 'ink';

// Current package version, shown next to the logo and in the bottom status bar
export const PISCES_VERSION = '0.1.0';

// Block-style ASCII logo for "pisces", drawn as a readable pattern grid:
//   F = full block (█), T = top half block (▀), space = empty.
// The "p" gets an extra descender line so it reads clearly.
const LOGO_PATTERN = [
  'FTT F FTT FTT FTT FTT',
  'F F F TTF F   FTT TTF',
  'FTT F TTT TTT TTT TTT',
  'F',
];

// Maps pattern characters to their terminal glyph
const PATTERN_GLYPH_MAP: Record<string, string> = {
  F: '█',
  T: '▀',
  ' ': ' ',
};

// Left half of the logo, rendered in the brand violet
const LOGO_LEFT_COLOR = '#7C3AED';

// Right half of the logo, rendered in a lighter tint for a two-tone look
const LOGO_RIGHT_COLOR = '#C4B5FD';

// Column where the logo splits into the two tones
const LOGO_SPLIT_COLUMN = 10;

// Braille blank (U+2800): invisible in the terminal but not whitespace,
// so Ink 5's per-line trimEnd() cannot strip the padding that keeps the
// short "p" descender line left-aligned under the rest of the logo.
const LOGO_PAD_CHAR = '⠀';

/**
 * Converts one pattern line into its block-glyph string.
 * @param patternLine - One line of the LOGO_PATTERN grid.
 * @returns The line rendered with █ / ▀ / space glyphs.
 */
function patternToGlyphs(patternLine: string): string {
  let glyphLine = '';
  for (const patternChar of patternLine) {
    glyphLine += PATTERN_GLYPH_MAP[patternChar] ?? ' ';
  }
  return glyphLine;
}

/**
 * The centered pisces banner shown on the idle screen.
 *
 * Renders a large two-tone block logo with the version number
 * underneath, echoing opencode's centered hero layout while
 * keeping the pisces violet brand color.
 */
export function Banner(): React.ReactElement {
  // Pad every line to the widest one so short lines (the "p" descender)
  // stay left-aligned with the rest of the logo when centered
  const logoFullWidth = Math.max(...LOGO_PATTERN.map((patternLine) => patternLine.length));

  return (
    <Box flexDirection="column" alignItems="center" marginBottom={1}>
      {LOGO_PATTERN.map((patternLine, lineIndex) => {
        const glyphLine = patternToGlyphs(patternLine).padEnd(logoFullWidth, LOGO_PAD_CHAR);
        // Left (violet) and right (light) halves of the line
        const leftHalf = glyphLine.slice(0, LOGO_SPLIT_COLUMN);
        const rightHalf = glyphLine.slice(LOGO_SPLIT_COLUMN);
        return (
          <Text key={lineIndex} bold>
            <Text color={LOGO_LEFT_COLOR}>{leftHalf}</Text>
            <Text color={LOGO_RIGHT_COLOR}>{rightHalf}</Text>
          </Text>
        );
      })}
      <Box marginTop={1}>
        <Text dimColor>
          {'pisces v'}
          {PISCES_VERSION}
          {' · launch anything'}
        </Text>
      </Box>
    </Box>
  );
}
