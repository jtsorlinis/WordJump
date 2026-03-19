export type GameStatus = 'playing' | 'won' | 'lost';

export type Direction = 'Earlier' | 'Later' | 'Correct';

export type DistanceBucketId = 'exact' | 'veryClose' | 'close' | 'far' | 'veryFar';

export interface DistanceBucket {
  id: DistanceBucketId;
  emoji: string;
  label: string;
  min: number;
  max: number;
}

export interface Attempt {
  guess: string;
  distance: number;
  direction: Direction;
  guessRank: number;
  targetRank: number;
  bucket: DistanceBucket;
}

export interface PuzzleDefinition {
  puzzleNumber: number;
  melbourneDate: string;
  requiredLength: number;
  targetWord: string;
  seedKey: string;
  isPractice: boolean;
  practiceSeed?: string;
}

export interface DictionaryModel {
  normalizedWords: string[];
  buckets: Record<number, string[]>;
  bucketLookups: Record<number, Map<string, number>>;
}

export interface GameState {
  puzzle: PuzzleDefinition;
  maxGuesses: number;
  attempts: Attempt[];
  status: GameStatus;
}

export interface GameSnapshot {
  puzzleNumber: number;
  melbourneDate: string;
  requiredLength: number;
  targetWord: string;
  seedKey: string;
  isPractice: boolean;
  practiceSeed?: string;
  maxGuesses: number;
  attempts: Attempt[];
  status: GameStatus;
}

export interface SubmitGuessResult {
  state: GameState;
  valid: boolean;
  consumedAttempt: boolean;
  error?: string;
  attempt?: Attempt;
}

export interface DailyHistoryEntry {
  puzzleNumber: number;
  date: string;
  won: boolean;
  guessCount: number;
  emojiRow: string;
}

export interface WordJumpStats {
  totalPlayed: number;
  totalWins: number;
  currentStreak: number;
  maxStreak: number;
  winsGuessTotal: number;
  averageGuessesOnWins: number;
  historyByPuzzle: Record<string, DailyHistoryEntry>;
}
