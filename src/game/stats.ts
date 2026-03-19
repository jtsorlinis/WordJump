import type { DailyHistoryEntry, WordJumpStats } from './types';

export function createEmptyStats(): WordJumpStats {
  return {
    totalPlayed: 0,
    totalWins: 0,
    currentStreak: 0,
    maxStreak: 0,
    winsGuessTotal: 0,
    averageGuessesOnWins: 0,
    historyByPuzzle: {}
  };
}

export interface ApplyResultInput {
  puzzleNumber: number;
  date: string;
  won: boolean;
  guessCount: number;
  emojiRow: string;
}

export function applyResultToStats(current: WordJumpStats, input: ApplyResultInput): WordJumpStats {
  const historyKey = String(input.puzzleNumber);

  if (current.historyByPuzzle[historyKey]) {
    return current;
  }

  const totalPlayed = current.totalPlayed + 1;
  const totalWins = current.totalWins + (input.won ? 1 : 0);
  const winsGuessTotal = current.winsGuessTotal + (input.won ? input.guessCount : 0);
  const averageGuessesOnWins = totalWins > 0 ? winsGuessTotal / totalWins : 0;
  const currentStreak = input.won ? current.currentStreak + 1 : 0;
  const maxStreak = Math.max(current.maxStreak, currentStreak);

  const historyEntry: DailyHistoryEntry = {
    puzzleNumber: input.puzzleNumber,
    date: input.date,
    won: input.won,
    guessCount: input.guessCount,
    emojiRow: input.emojiRow
  };

  return {
    totalPlayed,
    totalWins,
    currentStreak,
    maxStreak,
    winsGuessTotal,
    averageGuessesOnWins,
    historyByPuzzle: {
      ...current.historyByPuzzle,
      [historyKey]: historyEntry
    }
  };
}
