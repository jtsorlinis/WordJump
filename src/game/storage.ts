import { createEmptyStats } from './stats';
import type { GameSnapshot, PuzzleDefinition, WordJumpStats } from './types';

const NAMESPACE = 'wordjump:v1';
const STATS_KEY = `${NAMESPACE}:stats`;
const THEME_KEY = `${NAMESPACE}:theme`;
const HELP_SEEN_KEY = `${NAMESPACE}:help_seen`;

function canUseLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readJson<T>(key: string): T | null {
  if (!canUseLocalStorage()) {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(key);
    if (!rawValue) {
      return null;
    }

    return JSON.parse(rawValue) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures.
  }
}

export function getGameStorageKey(puzzle: PuzzleDefinition): string {
  if (puzzle.isPractice) {
    return `${NAMESPACE}:game:practice:${puzzle.practiceSeed ?? 'default'}`;
  }

  return `${NAMESPACE}:game:daily:${puzzle.melbourneDate}`;
}

export function loadGameSnapshot(storageKey: string): GameSnapshot | null {
  return readJson<GameSnapshot>(storageKey);
}

export function saveGameSnapshot(storageKey: string, snapshot: GameSnapshot): void {
  writeJson(storageKey, snapshot);
}

export function loadStats(): WordJumpStats {
  return readJson<WordJumpStats>(STATS_KEY) ?? createEmptyStats();
}

export function saveStats(stats: WordJumpStats): void {
  writeJson(STATS_KEY, stats);
}

export function loadTheme(): 'light' | 'dark' {
  const storedTheme = readJson<'light' | 'dark'>(THEME_KEY);
  return storedTheme === 'dark' ? 'dark' : 'light';
}

export function saveTheme(theme: 'light' | 'dark'): void {
  writeJson(THEME_KEY, theme);
}

export function hasSeenHelpModal(): boolean {
  return readJson<boolean>(HELP_SEEN_KEY) === true;
}

export function markHelpModalSeen(): void {
  writeJson(HELP_SEEN_KEY, true);
}
