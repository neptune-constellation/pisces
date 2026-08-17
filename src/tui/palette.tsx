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

/**
 * The palette view component that renders the search input, results list, and hint bar.
 *
 * This is a pure presentational component — it receives all state as props.
 * Input handling is managed by the parent App component.
 */
export function PaletteView({
  query,
  results,
  selectedIndex,
}: PaletteViewProps): React.ReactElement {
  return (
    <Box flexDirection="column">
      {/* Search input */}
      <Box marginBottom={1}>
        <Text color="#06B6D4" bold>
          {'/ '}
        </Text>
        <Text>{query}</Text>
        <Text dimColor>|</Text>
      </Box>

      {/* Results list */}
      <Box flexDirection="column" marginBottom={1}>
        {results.length === 0 ? (
          <Text dimColor>No matching entries</Text>
        ) : (
          results.map((entry, index) => {
            const isSelected = index === selectedIndex;
            const icon = entry.category === 'agent' ? '⚡' : '📁';
            const color = isSelected ? '#06B6D4' : undefined;

            return (
              <Box key={`${entry.category}-${entry.label}-${entry.description}`}>
                <Text color={color}>
                  {isSelected ? '> ' : '  '}
                  {icon} {entry.label}
                </Text>
                <Text dimColor> {entry.description}</Text>
              </Box>
            );
          })
        )}
      </Box>

      {/* Hint bar */}
      <Box>
        <Text dimColor>{'↑/↓ navigate  Enter launch  Esc close'}</Text>
      </Box>
    </Box>
  );
}
