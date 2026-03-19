import { describe, expect, it } from 'vitest';
import { buildEmojiRow, buildShareText, SHARE_URL } from '../src/game/share';
import type { Attempt } from '../src/game/types';

function makeAttempt(guess: string, distance: number): Attempt {
  return {
    guess,
    distance,
    direction: distance === 0 ? 'Correct' : 'Later',
    guessRank: 0,
    targetRank: distance,
    bucket: {
      id: 'veryFar',
      emoji: '⬛',
      label: '250+ away',
      min: 250,
      max: Number.POSITIVE_INFINITY
    }
  };
}

describe('share', () => {
  it('builds one-row emoji output from distance buckets', () => {
    const row = buildEmojiRow([
      makeAttempt('aaaa', 120),
      makeAttempt('bbbb', 30),
      makeAttempt('cccc', 8),
      makeAttempt('dddd', 3),
      makeAttempt('eeee', 0)
    ]);

    expect(row).toBe('🟥🟧🟨🟨🟩');
  });

  it('does not pad winning rows beyond actual guesses', () => {
    const row = buildEmojiRow([makeAttempt('aaaa', 30), makeAttempt('bbbb', 0)]);
    expect(row).toBe('🟧🟩');
  });

  it('builds spoiler-free share text with no guesses/arrows/distances', () => {
    const attempts: Attempt[] = [makeAttempt('apple', 7), makeAttempt('berry', 0)];
    const text = buildShareText(54, attempts);
    const [header, row, playLine] = text.split('\n').filter(Boolean);

    expect(header).toBe('WordJump #54');
    expect(row).toMatch(/^[⬛🟥🟧🟨🟩]+$/u);
    expect(playLine).toBe(`Play here: ${SHARE_URL}`);
    expect(text.toLowerCase()).not.toContain('apple');
    expect(text.toLowerCase()).not.toContain('berry');
    expect(text).not.toMatch(/[↔↕←→↑↓]/u);
    expect(row).not.toMatch(/\d/);
  });
});
