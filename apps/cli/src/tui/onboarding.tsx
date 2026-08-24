import { useEffect, useRef } from 'react';
import { Box, Text } from 'ink';
import { writeSettings } from '../config/loader.js';
import { detectInstalledAgents, toAgentEntries } from '../config/known-agents.js';
import { detectInstalledEditors } from '../config/known-editors.js';

// Accent color for the detecting screen
const ACCENT_COLOR = '#7C3AED';

/**
 * Props for the first-run onboarding component.
 */
interface OnboardingProps {
  /** Invoked when onboarding finishes and the palette should be shown. */
  onComplete: () => void;
}

/**
 * First-run onboarding shown when no settings file exists yet.
 *
 * Automatically scans for already-installed agents and editors and writes
 * everything detected into the initial config — no user prompt. When nothing
 * is detected (or detection fails), an empty config is written instead. Either
 * way the settings file is created and the palette opens.
 *
 * @param props - The onboarding props.
 */
export function Onboarding({ onComplete }: OnboardingProps): React.ReactElement {
  // Keep the latest onComplete without re-running the detection effect.
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Detect installed agents and editors once on mount and write the config.
  useEffect(() => {
    let cancelled = false;
    Promise.all([detectInstalledAgents(), detectInstalledEditors()])
      .then(([commands, editors]) => {
        if (cancelled) {
          return;
        }
        writeSettings({
          locations: [],
          agents: toAgentEntries(commands),
          editors,
        });
        onCompleteRef.current();
      })
      .catch(() => {
        if (!cancelled) {
          writeSettings({ locations: [], agents: [], editors: [] });
          onCompleteRef.current();
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Box flexDirection="column" alignItems="center" paddingTop={3}>
      <Text color={ACCENT_COLOR} bold>
        {'Detecting installed agents…'}
      </Text>
    </Box>
  );
}
