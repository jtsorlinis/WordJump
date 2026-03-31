import { describe, expect, it } from 'vitest';
import { TOP_COMMON_WORDS } from '../src/game/commonTargets';

describe('commonTargets', () => {
  it('excludes obvious personal names while keeping ambiguous common words', () => {
    expect(TOP_COMMON_WORDS).not.toContain('john');
    expect(TOP_COMMON_WORDS).not.toContain('sarah');
    expect(TOP_COMMON_WORDS).not.toContain('kevin');
    expect(TOP_COMMON_WORDS).not.toContain('angela');

    expect(TOP_COMMON_WORDS).toContain('will');
    expect(TOP_COMMON_WORDS).toContain('mark');
  });
});
