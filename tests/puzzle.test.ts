import { describe, expect, it } from 'vitest';
import { createDictionaryModel } from '../src/game/buckets';
import { normalizeDictionary } from '../src/game/normalize';
import { createInitialGameState, createPuzzleDefinition, submitGuess } from '../src/game/puzzle';
import type { PuzzleDefinition } from '../src/game/types';

const TEST_WORDS = [
  'apple',
  'berry',
  'chase',
  'delta',
  'eagle',
  'fable',
  'giant',
  'habit',
  'icily',
  'joker',
  'knack',
  'lemon',
  'mango',
  'noble',
  'olive',
  'pride',
  'quest',
  'racer',
  'saint',
  'tiger'
];

function makePuzzle(targetWord: string): PuzzleDefinition {
  return {
    puzzleNumber: 1,
    melbourneDate: '2026-01-01',
    requiredLength: 5,
    targetWord,
    seedKey: 'manual-test',
    isPractice: false
  };
}

describe('puzzle', () => {
  it('normalizes dictionary words, strips punctuation, de-duplicates, and sorts', () => {
    const normalized = normalizeDictionary(['Apple', 'apple', "can't", 'c ant', 'beta', 'beta!', '']);

    expect(normalized).toEqual(['apple', 'beta', 'cant']);
  });

  it('returns same puzzle for same Melbourne date input', () => {
    const model = createDictionaryModel(TEST_WORDS, [5]);
    const referenceDate = new Date('2026-02-25T12:00:00+11:00');

    const puzzleA = createPuzzleDefinition({
      dictionary: model,
      referenceDate,
      allowedLengths: [5],
      minBucketSize: 1,
      commonTargetWords: TEST_WORDS
    });

    const puzzleB = createPuzzleDefinition({
      dictionary: model,
      referenceDate,
      allowedLengths: [5],
      minBucketSize: 1,
      commonTargetWords: TEST_WORDS
    });

    expect(puzzleA).toEqual(puzzleB);
  });

  it('changes puzzle metadata for different Melbourne dates', () => {
    const model = createDictionaryModel(TEST_WORDS, [5]);

    const puzzleA = createPuzzleDefinition({
      dictionary: model,
      referenceDate: new Date('2026-02-25T08:00:00+11:00'),
      allowedLengths: [5],
      minBucketSize: 1,
      commonTargetWords: TEST_WORDS
    });

    const puzzleB = createPuzzleDefinition({
      dictionary: model,
      referenceDate: new Date('2026-02-26T08:00:00+11:00'),
      allowedLengths: [5],
      minBucketSize: 1,
      commonTargetWords: TEST_WORDS
    });

    expect(puzzleA.seedKey).not.toBe(puzzleB.seedKey);
    expect(puzzleA.puzzleNumber).not.toBe(puzzleB.puzzleNumber);
  });

  it('chooses targets only from the common target subset', () => {
    const model = createDictionaryModel(['apple', 'berry', 'chase', 'delta'], [5]);

    const puzzle = createPuzzleDefinition({
      dictionary: model,
      referenceDate: new Date('2026-02-25T10:00:00+11:00'),
      allowedLengths: [5],
      minBucketSize: 1,
      commonTargetWords: ['berry']
    });

    expect(puzzle.targetWord).toBe('berry');
  });

  it('does not consume attempts for invalid guesses', () => {
    const model = createDictionaryModel(TEST_WORDS, [5]);
    const state = createInitialGameState(makePuzzle('apple'), 6);

    const malformed = submitGuess(state, 'a1ple', model);
    expect(malformed.valid).toBe(false);
    expect(malformed.consumedAttempt).toBe(false);
    expect(malformed.state.attempts).toHaveLength(0);

    const wrongLength = submitGuess(state, 'pear', model);
    expect(wrongLength.valid).toBe(false);
    expect(wrongLength.consumedAttempt).toBe(false);
    expect(wrongLength.state.attempts).toHaveLength(0);

    const unknownWord = submitGuess(state, 'zzzzz', model);
    expect(unknownWord.valid).toBe(false);
    expect(unknownWord.consumedAttempt).toBe(false);
    expect(unknownWord.state.attempts).toHaveLength(0);
  });

  it('rejects guesses outside discovered upper/lower bounds', () => {
    const model = createDictionaryModel(TEST_WORDS, [5]);
    const initial = createInitialGameState(makePuzzle('mango'), 8);

    const afterLowerBound = submitGuess(initial, 'joker', model).state; // Later
    const boundedState = submitGuess(afterLowerBound, 'olive', model).state; // Earlier
    expect(boundedState.attempts).toHaveLength(2);

    const tooLow = submitGuess(boundedState, 'fable', model);
    expect(tooLow.valid).toBe(false);
    expect(tooLow.consumedAttempt).toBe(false);
    expect(tooLow.state.attempts).toHaveLength(2);

    const tooHigh = submitGuess(boundedState, 'saint', model);
    expect(tooHigh.valid).toBe(false);
    expect(tooHigh.consumedAttempt).toBe(false);
    expect(tooHigh.state.attempts).toHaveLength(2);

    const withinBounds = submitGuess(boundedState, 'lemon', model);
    expect(withinBounds.valid).toBe(true);
    expect(withinBounds.consumedAttempt).toBe(true);
    expect(withinBounds.state.attempts).toHaveLength(3);
  });

  it('rejects guesses that match the current visible upper/lower bounds', () => {
    const model = createDictionaryModel(TEST_WORDS, [5]);
    const initial = createInitialGameState(makePuzzle('mango'), 8);

    const afterLowerBound = submitGuess(initial, 'joker', model).state;
    const boundedState = submitGuess(afterLowerBound, 'olive', model).state;

    const repeatedLowerBound = submitGuess(boundedState, 'joker', model);
    expect(repeatedLowerBound.valid).toBe(false);
    expect(repeatedLowerBound.consumedAttempt).toBe(false);
    expect(repeatedLowerBound.state.attempts).toHaveLength(2);

    const repeatedUpperBound = submitGuess(boundedState, 'olive', model);
    expect(repeatedUpperBound.valid).toBe(false);
    expect(repeatedUpperBound.consumedAttempt).toBe(false);
    expect(repeatedUpperBound.state.attempts).toHaveLength(2);
  });

  it('supports win condition and max-guess loss flow', () => {
    const model = createDictionaryModel(TEST_WORDS, [5]);

    const winState = createInitialGameState(makePuzzle('apple'), 6);
    const firstWinGuess = submitGuess(winState, 'berry', model).state;
    expect(firstWinGuess.status).toBe('playing');

    const winningGuess = submitGuess(firstWinGuess, 'apple', model).state;
    expect(winningGuess.status).toBe('won');
    expect(winningGuess.attempts).toHaveLength(2);

    const loseState = createInitialGameState(makePuzzle('apple'), 2);
    const firstLossGuess = submitGuess(loseState, 'delta', model).state;
    expect(firstLossGuess.status).toBe('playing');

    const secondLossGuess = submitGuess(firstLossGuess, 'berry', model).state;
    expect(secondLossGuess.status).toBe('lost');
    expect(secondLossGuess.attempts).toHaveLength(2);
  });
});
