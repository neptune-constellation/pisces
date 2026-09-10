import { describe, it, expect } from 'vitest';
import { sanitizeHistory, formatTimestamp, type HistoryEntry } from '../../src/history/store.js';
import type { PaletteEntry } from '../../src/config/loader.js';

/**
 * A minimal, valid palette entry used to build history records in tests.
 */
function makeEntry(label: string): PaletteEntry {
  return {
    label,
    description: 'C:\\code\\project',
    directory: 'C:\\code\\project',
    agentCommand: 'claude',
    agentArgs: [],
    editorCommand: null,
    editorArgs: [],
    locationKeys: ['p'],
    agentKeys: ['cl'],
    editorKeys: [],
    category: 'combo',
  };
}

describe('sanitizeHistory', () => {
  it('returns an empty array for non-array input', () => {
    expect(sanitizeHistory(null)).toEqual([]);
    expect(sanitizeHistory('nope')).toEqual([]);
    expect(sanitizeHistory({ entry: {} })).toEqual([]);
  });

  it('filters out malformed entries', () => {
    const valid: HistoryEntry = { entry: makeEntry('a'), openedAt: '2026-08-24T08:18:30.000Z' };
    const malformed = [{ openedAt: 'x' }, { entry: null }, 42, 'str'];
    const result = sanitizeHistory([malformed, valid, { entry: makeEntry('b') }]);
    expect(result).toHaveLength(1);
    expect(result[0]?.entry.label).toBe('a');
  });

  it('keeps newest-first order up to the retention cap', () => {
    const entries: HistoryEntry[] = Array.from({ length: 12 }, (_, index) => ({
      entry: makeEntry(`entry-${index}`),
      openedAt: '2026-08-24T08:18:30.000Z',
    }));
    const result = sanitizeHistory(entries);
    expect(result).toHaveLength(10);
    expect(result[0]?.entry.label).toBe('entry-0');
    expect(result[9]?.entry.label).toBe('entry-9');
  });
});

describe('formatTimestamp', () => {
  it('formats an ISO timestamp as YYYY-MM-DD HH:mm', () => {
    const formatted = formatTimestamp('2026-08-24T08:18:30.000Z');
    expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
  });

  it('returns an empty string for an invalid timestamp', () => {
    expect(formatTimestamp('not-a-date')).toBe('');
  });
});
