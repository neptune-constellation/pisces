import type { PaletteEntry } from '../config/loader.js';

/**
 * Filters palette entries by matching the user's input against location keys
 * followed by agent keys.
 *
 * The input is interpreted as `locationKey + agentKey`:
 * 1. The longest location key that is a prefix of the query is matched first.
 * 2. The remaining characters are matched against agent keys as a prefix.
 * 3. If no location key matches, the full query is matched against agent keys
 *    (producing agent-only entries for the current directory).
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

  // Collect unique location keys and agent keys from all entries
  const locationKeys = [
    ...new Set(entries.filter((e) => e.locationKey !== null).map((e) => e.locationKey!)),
  ];
  const agentKeys = [
    ...new Set(entries.filter((e) => e.agentKey !== null).map((e) => e.agentKey!)),
  ];

  // Find location keys that are a prefix of the query (longest match first)
  const matchingLocationKeys = locationKeys
    .filter((k) => lowerQuery.startsWith(k.toLowerCase()))
    .sort((a, b) => b.length - a.length);

  if (matchingLocationKeys.length > 0) {
    const matchedLocationKey = matchingLocationKeys[0]!;
    const remaining = lowerQuery.slice(matchedLocationKey.length);

    if (remaining.length === 0) {
      // Show all entries for this location: directory + every combo
      return entries.filter((e) => e.locationKey === matchedLocationKey);
    }

    // Find agent keys that start with the remaining query
    const matchingAgentKeys = agentKeys.filter((k) => k.toLowerCase().startsWith(remaining));

    if (matchingAgentKeys.length > 0) {
      return entries.filter(
        (e) =>
          e.locationKey === matchedLocationKey &&
          e.agentKey !== null &&
          matchingAgentKeys.includes(e.agentKey),
      );
    }

    return [];
  }

  // No location key matched — try matching agent keys only
  const matchingAgentKeys = agentKeys.filter((k) => k.toLowerCase().startsWith(lowerQuery));

  if (matchingAgentKeys.length > 0) {
    return entries.filter(
      (e) =>
        e.category === 'agent' && e.agentKey !== null && matchingAgentKeys.includes(e.agentKey),
    );
  }

  return [];
}
