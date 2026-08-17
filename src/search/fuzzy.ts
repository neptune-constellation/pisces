import Fuse from 'fuse.js';
import type { PaletteEntry } from '../config/loader.js';

/**
 * Performs a character-by-character AND pre-filter followed by Fuse.js fuzzy ranking.
 *
 * Each character in the query must appear (case-insensitive) in the entry's search text.
 * The pre-filtered results are then scored and sorted by Fuse.js.
 * Results are sorted by Fuse.js score (best match first), then by category
 * (directories first, then combos, then agent-only).
 *
 * @param query - The user's search query string.
 * @param entries - The full list of palette entries to search.
 * @returns Filtered and ranked palette entries.
 */
export function searchEntries(query: string, entries: PaletteEntry[]): PaletteEntry[] {
  if (query.length === 0) {
    return entries;
  }

  const lowerQuery = query.toLowerCase();
  const chars = lowerQuery.split('');

  // Pre-filter: each character must appear in the search text
  const filtered = entries.filter((entry) => {
    const searchText = entry.searchText.toLowerCase();
    return chars.every((char) => searchText.includes(char));
  });

  if (filtered.length === 0) {
    return [];
  }

  // Fuse.js ranking — use threshold 1.0 so Fuse.js only scores and ranks,
  // never filters. The pre-filter already enforces the character-by-character
  // AND constraint. All pre-filtered entries are returned, sorted by Fuse score.
  const fuse = new Fuse(filtered, {
    keys: ['searchText'],
    threshold: 1.0,
    includeScore: true,
  });

  const results = fuse.search(lowerQuery);

  // Sort by score, then by category
  const categoryOrder: Record<PaletteEntry['category'], number> = {
    directory: 0,
    combo: 1,
    agent: 2,
  };

  return results
    .sort((a, b) => {
      // Sort by category first (directories before combos before agents)
      const catDiff = categoryOrder[a.item.category] - categoryOrder[b.item.category];
      if (catDiff !== 0) {
        return catDiff;
      }
      // Then by Fuse score within the same category (best match first)
      return (a.score ?? 1) - (b.score ?? 1);
    })
    .map((r) => r.item);
}
