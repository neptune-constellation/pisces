import { useEffect, useRef, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { writeSettings } from '../config/loader.js';
import { detectInstalledAgents, toAgentEntries } from '../config/known-agents.js';

/** Onboarding phase: initial choice, background detection, or manual selection. */
type Phase = 'choose' | 'detecting' | 'selecting';

/** The three first-run choices, in display order. */
const CHOICES = [
  { label: 'Yes, configure all detected agents', value: 'yes' },
  { label: 'Select which agents to configure', value: 'select' },
  { label: "No, I'll configure manually", value: 'no' },
] as const;

type Choice = (typeof CHOICES)[number]['value'];

const ACCENT_COLOR = '#7C3AED';
const HIGHLIGHT_COLOR = '#06B6D4';

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
 * Lets the user opt in to scanning for already-installed agents, pick a subset
 * of them, or skip setup entirely before the palette opens.
 *
 * @param props - The onboarding props.
 */
export function Onboarding({ onComplete }: OnboardingProps): React.ReactElement {
  const [phase, setPhase] = useState<Phase>('choose');
  const [choice, setChoice] = useState<Choice | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [detected, setDetected] = useState<string[]>([]);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  // Keep the latest onComplete without re-running the detection effect.
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Run detection once the user opts in (yes or select).
  useEffect(() => {
    if (phase !== 'detecting' || choice === null) {
      return;
    }
    let cancelled = false;
    detectInstalledAgents()
      .then((commands) => {
        if (cancelled) {
          return;
        }
        if (choice === 'yes') {
          writeSettings({ locations: [], agents: toAgentEntries(commands) });
          onCompleteRef.current();
          return;
        }
        // "select" path: no detections fall through to an empty config.
        setDetected(commands);
        if (commands.length === 0) {
          writeSettings({ locations: [], agents: [] });
          onCompleteRef.current();
          return;
        }
        setChecked(new Set());
        setSelectedIndex(0);
        setPhase('selecting');
      })
      .catch(() => {
        if (!cancelled) {
          writeSettings({ locations: [], agents: [] });
          onCompleteRef.current();
        }
      });
    return () => {
      cancelled = true;
    };
  }, [phase, choice]);

  useInput((input, key) => {
    if (key.escape) {
      onCompleteRef.current();
      return;
    }

    if (phase === 'choose') {
      if (key.upArrow) {
        setSelectedIndex((prev) => Math.max(0, prev - 1));
      } else if (key.downArrow) {
        setSelectedIndex((prev) => Math.min(CHOICES.length - 1, prev + 1));
      } else if (key.return) {
        const selected = CHOICES[selectedIndex];
        if (selected) {
          if (selected.value === 'no') {
            onCompleteRef.current();
          } else {
            setChoice(selected.value);
            setPhase('detecting');
          }
        }
      }
      return;
    }

    if (phase === 'selecting') {
      if (key.upArrow) {
        setSelectedIndex((prev) => Math.max(0, prev - 1));
      } else if (key.downArrow) {
        setSelectedIndex((prev) => Math.min(detected.length - 1, prev + 1));
      } else if (input === ' ') {
        const command = detected[selectedIndex];
        if (command) {
          setChecked((prev) => {
            const next = new Set(prev);
            if (next.has(command)) {
              next.delete(command);
            } else {
              next.add(command);
            }
            return next;
          });
        }
      } else if (key.return) {
        const chosen = detected.filter((command) => checked.has(command));
        writeSettings({ locations: [], agents: toAgentEntries(chosen) });
        onCompleteRef.current();
      }
    }
  });

  if (phase === 'detecting') {
    return (
      <Box flexDirection="column" alignItems="center" paddingTop={3}>
        <Text color={ACCENT_COLOR} bold>
          {'Detecting installed agents…'}
        </Text>
      </Box>
    );
  }

  if (phase === 'selecting') {
    return (
      <Box flexDirection="column" paddingX={2} paddingTop={2}>
        <Text bold>{'Select the agents you want to configure:'}</Text>
        <Box flexDirection="column" marginTop={1}>
          {detected.map((command, index) => {
            const isSelected = index === selectedIndex;
            const marker = isSelected ? '› ' : '  ';
            const box = checked.has(command) ? '[✓]' : '[ ]';
            return (
              <Text
                key={command}
                color={isSelected ? HIGHLIGHT_COLOR : undefined}
                bold={isSelected}
              >
                {marker}
                {box} {command}
              </Text>
            );
          })}
        </Box>
        <Box marginTop={1}>
          <Text dimColor>{'Press space to select · enter to confirm · esc to skip'}</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" alignItems="center" paddingTop={3} paddingX={2}>
      <Text bold>{'Allow scanning for already-installed agents to initialize your config?'}</Text>
      <Text dimColor>
        {"If you decline, it won't affect anything — you can configure agents yourself later."}
      </Text>
      <Box flexDirection="column" marginTop={1}>
        {CHOICES.map((option, index) => {
          const isSelected = index === selectedIndex;
          return (
            <Text
              key={option.value}
              color={isSelected ? HIGHLIGHT_COLOR : undefined}
              bold={isSelected}
            >
              {isSelected ? '› ' : '  '}
              {option.label}
            </Text>
          );
        })}
      </Box>
      <Box marginTop={1}>
        <Text dimColor>{'↑↓ navigate · enter confirm · esc skip'}</Text>
      </Box>
    </Box>
  );
}
