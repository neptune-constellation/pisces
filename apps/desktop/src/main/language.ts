import { loadConfig, type Language } from '@lysun001/pisces-core';

/**
 * Reads the configured UI language, falling back to English when the config
 * cannot be loaded or fails validation.
 *
 * @returns The UI language code.
 */
export function readLanguage(): Language {
  try {
    return loadConfig().language;
  } catch {
    return 'en';
  }
}
