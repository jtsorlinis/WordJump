import { DEFAULT_WORD_LENGTHS } from './buckets';
import { TOP_COMMON_WORDS } from './commonTargets';
import { getDirection, getDistanceBucket } from './feedback';
import { normalizeWord } from './normalize';
import { rankDistance } from './ranking';
import { createSeededRandom, hashStringToSeed } from './seed';
import { daysBetweenIsoDates, getMelbourneIsoDate } from './timezone';
import type { DictionaryModel, GameState, PuzzleDefinition, SubmitGuessResult } from './types';

export const GAME_VERSION = 'v2';
export const PUZZLE_EPOCH = '2026-01-01';
export const MAX_GUESSES = 10;
export const MIN_BUCKET_SIZE = 500;
const PUZZLE_SEED_NAMESPACE = 'wordjump';

export interface CreatePuzzleOptions {
  dictionary: DictionaryModel;
  referenceDate?: Date;
  allowedLengths?: readonly number[];
  minBucketSize?: number;
  practiceSeed?: string;
  commonTargetWords?: readonly string[];
}

function pickLength(
  targetBuckets: Record<number, string[]>,
  allowedLengths: readonly number[],
  minBucketSize: number,
  random: () => number
): number {
  const preferred = allowedLengths.filter((length) => (targetBuckets[length]?.length ?? 0) >= minBucketSize);

  if (preferred.length > 0) {
    return preferred[Math.floor(random() * preferred.length)];
  }

  const fallback = [...allowedLengths]
    .filter((length) => (targetBuckets[length]?.length ?? 0) > 0)
    .sort((left, right) => (targetBuckets[right]?.length ?? 0) - (targetBuckets[left]?.length ?? 0));

  if (fallback.length === 0) {
    throw new Error('No common target words available for the configured lengths.');
  }

  return fallback[Math.floor(random() * fallback.length)];
}

function buildCommonTargetBuckets(
  dictionary: DictionaryModel,
  allowedLengths: readonly number[],
  commonTargetWords: readonly string[]
): Record<number, string[]> {
  const commonTargetSet = new Set(
    commonTargetWords
      .map((word) => normalizeWord(word))
      .filter((word) => word.length > 0)
  );

  const targetBuckets: Record<number, string[]> = {};

  for (const length of allowedLengths) {
    const guessBucket = dictionary.buckets[length] ?? [];
    targetBuckets[length] = guessBucket.filter((word) => commonTargetSet.has(word));
  }

  return targetBuckets;
}

export function createPuzzleDefinition({
  dictionary,
  referenceDate = new Date(),
  allowedLengths = DEFAULT_WORD_LENGTHS,
  minBucketSize = MIN_BUCKET_SIZE,
  practiceSeed,
  commonTargetWords = TOP_COMMON_WORDS
}: CreatePuzzleOptions): PuzzleDefinition {
  const melbourneDate = getMelbourneIsoDate(referenceDate);
  const isPractice = typeof practiceSeed === 'string' && practiceSeed.trim().length > 0;
  const normalizedPracticeSeed = practiceSeed?.trim();
  // Seed format is versioned so puzzle generation can evolve without breaking old results.
  const seedKey = isPractice
    ? `${PUZZLE_SEED_NAMESPACE}|practice|${normalizedPracticeSeed}|${GAME_VERSION}`
    : `${PUZZLE_SEED_NAMESPACE}|${melbourneDate}|${GAME_VERSION}`;

  const random = createSeededRandom(seedKey);
  const targetBuckets = buildCommonTargetBuckets(dictionary, allowedLengths, commonTargetWords);
  const requiredLength = pickLength(targetBuckets, allowedLengths, minBucketSize, random);
  const targetBucket = targetBuckets[requiredLength] ?? [];

  if (targetBucket.length === 0) {
    throw new Error(`No common target words available for required length ${requiredLength}.`);
  }

  const targetWord = targetBucket[Math.floor(random() * targetBucket.length)];

  const puzzleNumber = isPractice
    ? hashStringToSeed(seedKey) % 1_000_000
    : daysBetweenIsoDates(PUZZLE_EPOCH, melbourneDate);

  return {
    puzzleNumber,
    melbourneDate,
    requiredLength,
    targetWord,
    seedKey,
    isPractice,
    practiceSeed: normalizedPracticeSeed
  };
}

export function createInitialGameState(puzzle: PuzzleDefinition, maxGuesses = MAX_GUESSES): GameState {
  return {
    puzzle,
    maxGuesses,
    attempts: [],
    status: 'playing'
  };
}

export function hydrateGameState(
  puzzle: PuzzleDefinition,
  maxGuesses: number,
  attempts: GameState['attempts'],
  status: GameState['status']
): GameState {
  return {
    puzzle,
    maxGuesses,
    attempts,
    status
  };
}

function isAlphabeticWord(value: string): boolean {
  return /^[a-zA-Z]+$/.test(value);
}

function getGuessBounds(attempts: GameState['attempts']): {
  lowerBoundRank?: number;
  upperBoundRank?: number;
} {
  let lowerBoundRank: number | undefined;
  let upperBoundRank: number | undefined;

  for (const attempt of attempts) {
    if (attempt.direction === 'Later') {
      if (lowerBoundRank === undefined || attempt.guessRank > lowerBoundRank) {
        lowerBoundRank = attempt.guessRank;
      }
      continue;
    }

    if (attempt.direction === 'Earlier') {
      if (upperBoundRank === undefined || attempt.guessRank < upperBoundRank) {
        upperBoundRank = attempt.guessRank;
      }
    }
  }

  return { lowerBoundRank, upperBoundRank };
}

export function submitGuess(state: GameState, rawGuess: string, dictionary: DictionaryModel): SubmitGuessResult {
  if (state.status !== 'playing') {
    return {
      state,
      valid: false,
      consumedAttempt: false,
      error: 'This puzzle is already complete.'
    };
  }

  const trimmedGuess = rawGuess.trim();

  if (trimmedGuess.length === 0) {
    return {
      state,
      valid: false,
      consumedAttempt: false,
      error: 'Enter a guess first.'
    };
  }

  if (!isAlphabeticWord(trimmedGuess)) {
    return {
      state,
      valid: false,
      consumedAttempt: false,
      error: 'Use alphabetic letters only.'
    };
  }

  const guess = normalizeWord(trimmedGuess);

  if (guess.length !== state.puzzle.requiredLength) {
    return {
      state,
      valid: false,
      consumedAttempt: false,
      error: `Use exactly ${state.puzzle.requiredLength} letters.`
    };
  }

  const lookup = dictionary.bucketLookups[state.puzzle.requiredLength];

  if (!lookup || lookup.size === 0) {
    return {
      state,
      valid: false,
      consumedAttempt: false,
      error: 'This puzzle bucket is unavailable.'
    };
  }

  const guessRank = lookup.get(guess);

  if (guessRank === undefined) {
    return {
      state,
      valid: false,
      consumedAttempt: false,
      error: 'Word is not in the official WordJump dictionary.'
    };
  }

  const targetRank = lookup.get(state.puzzle.targetWord);

  if (targetRank === undefined) {
    return {
      state,
      valid: false,
      consumedAttempt: false,
      error: 'Target word is missing from dictionary bucket.'
    };
  }

  // Prevent guesses outside the best known lower/upper bounds from ↑/↓ hints.
  const { lowerBoundRank, upperBoundRank } = getGuessBounds(state.attempts);
  const bucketWords = dictionary.buckets[state.puzzle.requiredLength] ?? [];

  if (lowerBoundRank !== undefined && guessRank < lowerBoundRank) {
    const lowerBoundWord = bucketWords[lowerBoundRank] ?? 'known lower bound';
    return {
      state,
      valid: false,
      consumedAttempt: false,
      error: `Guess is outside your current range. Try a word after ${lowerBoundWord.toUpperCase()}.`
    };
  }

  if (upperBoundRank !== undefined && guessRank > upperBoundRank) {
    const upperBoundWord = bucketWords[upperBoundRank] ?? 'known upper bound';
    return {
      state,
      valid: false,
      consumedAttempt: false,
      error: `Guess is outside your current range. Try a word before ${upperBoundWord.toUpperCase()}.`
    };
  }

  const distance = rankDistance(guessRank, targetRank);
  // Direction is based on rank ordering, not lexical string compare at guess time.
  const direction = getDirection(guessRank, targetRank);
  const bucket = getDistanceBucket(distance);

  const attempt = {
    guess,
    distance,
    direction,
    guessRank,
    targetRank,
    bucket
  };

  const attempts = [...state.attempts, attempt];
  let status: GameState['status'] = 'playing';

  if (distance === 0) {
    status = 'won';
  } else if (attempts.length >= state.maxGuesses) {
    status = 'lost';
  }

  return {
    state: {
      ...state,
      attempts,
      status
    },
    valid: true,
    consumedAttempt: true,
    attempt
  };
}
