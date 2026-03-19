import { describe, expect, it } from 'vitest';
import { createSeededRandom, hashStringToSeed } from '../src/game/seed';

describe('seed', () => {
  it('produces deterministic hash values', () => {
    expect(hashStringToSeed('wordjump|2026-02-25|v1')).toBe(hashStringToSeed('wordjump|2026-02-25|v1'));
  });

  it('produces deterministic random sequences for the same seed', () => {
    const rngA = createSeededRandom('stable-seed');
    const rngB = createSeededRandom('stable-seed');

    const sequenceA = [rngA(), rngA(), rngA(), rngA()];
    const sequenceB = [rngB(), rngB(), rngB(), rngB()];

    expect(sequenceA).toEqual(sequenceB);
  });

  it('changes output sequence for a different seed', () => {
    const rngA = createSeededRandom('seed-a');
    const rngB = createSeededRandom('seed-b');

    const sequenceA = [rngA(), rngA(), rngA()];
    const sequenceB = [rngB(), rngB(), rngB()];

    expect(sequenceA).not.toEqual(sequenceB);
  });
});
