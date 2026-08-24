import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { PaletteEntry } from '../config/loader.js';

/**
 * Filters palette entries by matching the user's input against location keys
 * followed by agent or editor keys.
 *
 * The input is interpreted as `locationKey + agentKey` or `locationKey + editorKey`:
 * 1. The longest location key that is a prefix of the query is matched first.
 * 2. The remaining characters are matched against agent keys and editor keys
 *    as a prefix; entries of either kind that match are returned.
 * 3. If no location key matches, the full query is matched against agent keys
 *    and editor keys (producing agent-only / editor-only entries for the
 *    current directory).
 *
 * A location, agent, or editor may declare multiple keys, so an entry matches
 * when any of its keys satisfies the corresponding prefix rule.
 *
 * When the query is empty, all entries are returned (caller filters combos out).
 *
 * @param query - The user's search query string.
 * @param entries - The full list of palette entries to search.
 * @returns Filtered palette entries matching the key-based query.
 */
export function searchEntries(query: string, entries: PaletteEntry[]): PaletteEntry[] {
  if (query.length === 0) {
    return entries;
  }

  const lowerQuery = query.toLowerCase();

  // Collect unique location, agent, and editor keys from all entries
  const locationKeys = [...new Set(entries.flatMap((e) => e.locationKeys))];
  const agentKeys = [...new Set(entries.flatMap((e) => e.agentKeys))];
  const editorKeys = [...new Set(entries.flatMap((e) => e.editorKeys))];

  // Find location keys that are a prefix of the query (longest match first)
  const matchingLocationKeys = locationKeys
    .filter((k) => lowerQuery.startsWith(k.toLowerCase()))
    .sort((a, b) => b.length - a.length);

  if (matchingLocationKeys.length > 0) {
    const matchedLocationKey = matchingLocationKeys[0]!;
    const remaining = lowerQuery.slice(matchedLocationKey.length);

    if (remaining.length === 0) {
      // Show all entries for this location: directory + every combo
      return entries.filter((e) => e.locationKeys.includes(matchedLocationKey));
    }

    // Find agent and editor keys that start with the remaining query
    const matchingAgentKeys = agentKeys.filter((k) => k.toLowerCase().startsWith(remaining));
    const matchingEditorKeys = editorKeys.filter((k) => k.toLowerCase().startsWith(remaining));

    if (matchingAgentKeys.length > 0 || matchingEditorKeys.length > 0) {
      return entries.filter(
        (e) =>
          e.locationKeys.includes(matchedLocationKey) &&
          (e.agentKeys.some((k) => matchingAgentKeys.includes(k)) ||
            e.editorKeys.some((k) => matchingEditorKeys.includes(k))),
      );
    }

    return [];
  }

  // No location key matched — try matching agent and editor keys only
  const matchingAgentKeys = agentKeys.filter((k) => k.toLowerCase().startsWith(lowerQuery));
  const matchingEditorKeys = editorKeys.filter((k) => k.toLowerCase().startsWith(lowerQuery));

  if (matchingAgentKeys.length > 0 || matchingEditorKeys.length > 0) {
    return entries.filter(
      (e) =>
        (e.category === 'agent' && e.agentKeys.some((k) => matchingAgentKeys.includes(k))) ||
        (e.category === 'editor' && e.editorKeys.some((k) => matchingEditorKeys.includes(k))),
    );
  }

  return [];
}

/**
 * Reads subdirectories of a parent path and returns them as palette entries,
 * filtered by an optional prefix string.
 *
 * Hidden directories (names starting with `.`) are excluded.
 *
 * @param parentPath - The absolute path to read subdirectories from.
 * @param filter - An optional prefix filter for subdirectory names (case-insensitive).
 * @returns Palette entries for the matching subdirectories, sorted alphabetically.
 */
function readSubdirectories(parentPath: string, filter: string): PaletteEntry[] {
  let subdirs: string[];
  try {
    subdirs = readdirSync(parentPath, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
      .map((d) => d.name);
  } catch {
    return [];
  }

  const lowerFilter = filter.toLowerCase();
  if (lowerFilter.length > 0) {
    subdirs = subdirs.filter((name) => name.toLowerCase().startsWith(lowerFilter));
  }

  subdirs.sort((a, b) => a.localeCompare(b));

  return subdirs.map((name) => ({
    label: name,
    description: join(parentPath, name),
    directory: join(parentPath, name),
    agentCommand: null,
    agentArgs: [],
    editorCommand: null,
    editorArgs: [],
    locationKeys: [],
    agentKeys: [],
    editorKeys: [],
    category: 'directory' as const,
  }));
}

/**
 * Returns palette entries for subdirectories of a location matched by the
 * portion of the query before a `/` or `\` separator.
 *
 * When the query contains `/` or `\`, the part before the separator is matched
 * against location keys, and the part after the separator is used to filter
 * the subdirectories of the matched location. No agents are shown in this mode.
 *
 * @param query - The user's search query string containing a separator.
 * @param entries - The full list of palette entries (used to look up location paths).
 * @returns Palette entries for matching subdirectories, or empty if no location matches.
 */
export function getSubdirectoryEntries(query: string, entries: PaletteEntry[]): PaletteEntry[] {
  const separatorIndex = Math.max(query.indexOf('/'), query.indexOf('\\'));
  if (separatorIndex === -1) return [];

  const locationKey = query.slice(0, separatorIndex).toLowerCase();
  const subdirFilter = query.slice(separatorIndex + 1);

  // Find the matching location from directory entries
  const dirEntry = entries.find(
    (e) =>
      e.category === 'directory' && e.locationKeys.some((k) => k.toLowerCase() === locationKey),
  );
  if (!dirEntry) return [];

  return readSubdirectories(dirEntry.directory, subdirFilter);
}
