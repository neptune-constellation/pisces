import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Box, Text } from 'ink';

/**
 * Walks up the directory tree from the given directory looking for package.json.
 * @param startDir - The directory to start searching from.
 * @returns The path to the nearest package.json, or null if not found.
 */
function findPackageJson(startDir: string): string | null {
  let dir = startDir;
  while (true) {
    const candidate = join(dir, 'package.json');
    if (existsSync(candidate)) {
      return candidate;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      return null;
    }
    dir = parent;
  }
}

/**
 * Reads the current package version from package.json at runtime.
 *
 * Locates package.json by walking up from the module directory, so the version
 * is read dynamically rather than hardcoded — it always matches the installed
 * package.json. Falls back to 0.0.0 if the file cannot be read or parsed.
 *
 * @returns The version string from package.json.
 */
function readPackageVersion(): string {
  try {
    const moduleDir = dirname(fileURLToPath(import.meta.url));
    const packageJsonPath = findPackageJson(moduleDir);
    if (packageJsonPath === null) {
      return '0.0.0';
    }
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as {
      version?: string;
    };
    return packageJson.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

// Current package version, read dynamically from package.json at runtime
export const PISCES_VERSION = readPackageVersion();

// Block-style ASCII logo for "pisces", drawn as a readable pattern grid:
//   F = full block (█), T = top half block (▀), space = empty.
// The "p" gets an extra descender line so it reads clearly.
const LOGO_PATTERN = [
  'FTT F FTT FTT FTT FTT',
  'F F F TTF F   FTT TTF',
  'FTT F TTT TTT TTT TTT',
  'F',
];

// Uniform scale factor applied to the base pattern on both axes.
// 1 renders the logo at its natural (half-size) block resolution.
const LOGO_SCALE = 1;

// Left half of the logo, rendered in the brand violet
const LOGO_LEFT_COLOR = '#7C3AED';

// Right half of the logo, rendered in a lighter tint for a two-tone look
const LOGO_RIGHT_COLOR = '#C4B5FD';

// Column where the logo splits into the two tones (in base-pattern columns)
const LOGO_SPLIT_COLUMN = 10;

// Braille blank (U+2800): invisible in the terminal but not whitespace,
// so Ink 5's per-line trimEnd() cannot strip the padding that keeps the
// short "p" descender line left-aligned under the rest of the logo.
const LOGO_PAD_CHAR = '⠀';

// Extra blank rows above the logo so the hero block is not glued to the
// top edge of the terminal, mirroring opencode's breathing room.
const LOGO_TOP_MARGIN = 2;

/**
 * Expands the pattern grid into a bitmap of half-row subrows (0/1 per cell):
 * F fills both halves, T fills only the top half, space fills nothing.
 * @param pattern - The LOGO_PATTERN grid.
 * @returns A matrix of 0/1 subrows, two per pattern line.
 */
function patternToSubrows(pattern: string[]): number[][] {
  const subrows: number[][] = [];
  for (const patternLine of pattern) {
    const topHalf: number[] = [];
    const bottomHalf: number[] = [];
    for (const patternChar of patternLine) {
      topHalf.push(patternChar === 'F' || patternChar === 'T' ? 1 : 0);
      bottomHalf.push(patternChar === 'F' ? 1 : 0);
    }
    subrows.push(topHalf, bottomHalf);
  }
  return subrows;
}

/**
 * Scales a subrow bitmap by repeating every cell `factor` times on both axes.
 * @param subrows - The 0/1 matrix to scale.
 * @param factor - The integer scale factor for both width and height.
 * @returns The scaled 0/1 matrix.
 */
function scaleSubrows(subrows: number[][], factor: number): number[][] {
  const scaledSubrows: number[][] = [];
  for (const subrow of subrows) {
    const widenedRow = subrow.flatMap((cell) => Array<number>(factor).fill(cell));
    for (let repeat = 0; repeat < factor; repeat++) {
      scaledSubrows.push(widenedRow);
    }
  }
  return scaledSubrows;
}

/**
 * Encodes pairs of subrows back into terminal glyphs (█ / ▀ / ▄ / space).
 * @param subrows - The scaled 0/1 matrix (even number of rows).
 * @returns One glyph string per terminal line.
 */
function subrowsToGlyphs(subrows: number[][]): string[] {
  const glyphLines: string[] = [];
  for (let rowIndex = 0; rowIndex < subrows.length; rowIndex += 2) {
    const topHalf = subrows[rowIndex];
    if (!topHalf) {
      break;
    }
    const bottomHalf = subrows[rowIndex + 1] ?? topHalf.map(() => 0);
    let glyphLine = '';
    for (let columnIndex = 0; columnIndex < topHalf.length; columnIndex++) {
      const top = topHalf[columnIndex] === 1;
      const bottom = bottomHalf[columnIndex] === 1;
      glyphLine += top && bottom ? '█' : top ? '▀' : bottom ? '▄' : ' ';
    }
    glyphLines.push(glyphLine);
  }
  return glyphLines;
}

// The final scaled logo lines, computed once at module load
const LOGO_LINES = subrowsToGlyphs(scaleSubrows(patternToSubrows(LOGO_PATTERN), LOGO_SCALE));

// Column where the scaled logo splits into the two tones
const LOGO_SPLIT_SCALED = LOGO_SPLIT_COLUMN * LOGO_SCALE;

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
  const logoFullWidth = Math.max(...LOGO_LINES.map((glyphLine) => glyphLine.length));

  return (
    <Box flexDirection="column" alignItems="center" marginTop={LOGO_TOP_MARGIN} marginBottom={1}>
      {LOGO_LINES.map((glyphLine, lineIndex) => {
        const paddedLine = glyphLine.padEnd(logoFullWidth, LOGO_PAD_CHAR);
        // Left (violet) and right (light) halves of the line
        const leftHalf = paddedLine.slice(0, LOGO_SPLIT_SCALED);
        const rightHalf = paddedLine.slice(LOGO_SPLIT_SCALED);
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
