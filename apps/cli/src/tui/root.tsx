import { useCallback, useState } from 'react';
import { App } from './app.js';
import { Onboarding } from './onboarding.js';
import { hasSettingsFile } from '../config/loader.js';

/**
 * Root component that gates first-run onboarding before the palette.
 *
 * When no settings file exists yet, shows onboarding. Once onboarding finishes
 * (or when a settings file already exists), renders the main App.
 */
export function Root(): React.ReactElement {
  const [ready, setReady] = useState(hasSettingsFile);
  const handleComplete = useCallback(() => setReady(true), []);

  if (!ready) {
    return <Onboarding onComplete={handleComplete} />;
  }
  return <App />;
}
