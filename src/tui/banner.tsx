import { Box, Text } from 'ink';

/**
 * The pisces banner displayed at the top of the TUI.
 *
 * Shows a stylized pisces logo, version number, and tagline.
 * Uses the primary brand color (violet/purple) for the logo text.
 */
export function Banner(): React.ReactElement {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box flexDirection="column">
        <Text color="#7C3AED" bold>
          {'╭──────────────────────────────────────╮'}
        </Text>
        <Text color="#7C3AED" bold>
          {'│           pisces v0.1.0               │'}
        </Text>
        <Text color="#7C3AED" bold>
          {'│         launch anything              │'}
        </Text>
        <Text color="#7C3AED" bold>
          {'╰──────────────────────────────────────╯'}
        </Text>
      </Box>
    </Box>
  );
}
