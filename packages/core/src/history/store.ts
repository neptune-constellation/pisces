import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { PaletteEntry } from '../config/loader.js';

// Directory under ~/.pisces that holds runtime caches (currently just history).
const HISTORY_DIR = join(homedir(), '.pisces', '.cache');

// Absolute path to the recently-opened history file.
const HISTORY_FILE = join(HISTORY_DIR, 'history.json');

// Maximum number of recent opens retained (older entries are dropped).
const MAX_HISTORY = 10;

/**
 * A single entry in the recently-opened history: the palette entry that was
 * launched plus the time it was opened.
 */
export interface HistoryEntry {
  /** The palette entry snapshot that was launched. */
  entry: PaletteEntry;
  /** The time the entry was opened, as an ISO 8601 string. */
  openedAt: string;
}

/**
 * Type guard that validates a value read from the history file has the
 * minimal shape needed to display and re-launch it.
 *
 * @param value - The unknown value parsed from the JSON file.
 * @returns True when the value looks like a valid history entry.
 */
function isHistoryEntry(value: unknown): value is HistoryEntry {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.openedAt !== 'string') {
    return false;
  }
  const entry = record.entry;
  if (typeof entry !== 'object' || entry === null) {
    return false;
  }
  const palette = entry as Record<string, unknown>;
  return (
    typeof palette.label === 'string' &&
    typeof palette.description === 'string' &&
    typeof palette.directory === 'string'
  );
}

/**
 * Validates a value parsed from the history file and returns only the valid
 * entries, capped to the retention limit. A corrupt cache therefore degrades
 * gracefully to an empty (or partial) list instead of breaking the palette.
 *
 * @param parsed - The unknown value parsed from the JSON file.
 * @returns The valid history entries, newest first, up to MAX_HISTORY.
 */
export function sanitizeHistory(parsed: unknown): HistoryEntry[] {
  if (!Array.isArray(parsed)) {
    return [];
  }
  return parsed.filter(isHistoryEntry).slice(0, MAX_HISTORY);
}

/**
 * Loads the recently-opened history from disk.
 *
 * Returns an empty array when the file does not exist yet or is malformed,
 * so a corrupt cache never prevents the palette from opening.
 *
 * @returns The list of history entries, newest first.
 */
export function loadHistory(): HistoryEntry[] {
  if (!existsSync(HISTORY_FILE)) {
    return [];
  }

  let raw: string;
  try {
    raw = readFileSync(HISTORY_FILE, 'utf-8');
  } catch {
    return [];
  }

  try {
    return sanitizeHistory(JSON.parse(raw) as unknown);
  } catch {
    return [];
  }
}

/**
 * Records a launch in the recently-opened history, prepending it so the newest
 * entry is first and dropping anything beyond the retention cap.
 *
 * @param entry - The palette entry that was just launched.
 */
export function recordOpen(entry: PaletteEntry): void {
  const nextEntry: HistoryEntry = { entry, openedAt: new Date().toISOString() };
  const updated = [nextEntry, ...loadHistory()].slice(0, MAX_HISTORY);

  mkdirSync(HISTORY_DIR, { recursive: true });
  writeFileSync(HISTORY_FILE, JSON.stringify(updated, null, 2), 'utf-8');
}

/**
 * Formats an ISO 8601 timestamp as local `YYYY-MM-DD HH:mm`.
 *
 * @param iso - The ISO 8601 timestamp string.
 * @returns The formatted timestamp, or an empty string when invalid.
 */
export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const pad = (value: number): string => value.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  return `${year}-${month}-${day} ${hour}:${minute}`;
}
