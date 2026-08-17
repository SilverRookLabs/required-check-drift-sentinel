import { describe, expect, it } from 'vitest';
import { analyzeDrift } from '../src/drift.js';

describe('analyzeDrift', () => {
  it('detects required contexts without matching emitters', () => {
    const result = analyzeDrift({
      required: [
        { context: 'CI / Unit Tests', source: 'ruleset:default' },
        { context: 'CI / Integration', source: 'ruleset:default' },
      ],
      emitted: [{ context: 'CI / Unit Tests', source: '.github/workflows/ci.yml' }],
    });

    expect(result.matched.map((item) => item.context)).toEqual(['CI / Unit Tests']);
    expect(result.missing.map((item) => item.context)).toEqual(['CI / Integration']);
  });

  it('normalizes whitespace and case', () => {
    const result = analyzeDrift({
      required: [{ context: 'ci / unit tests', source: 'ruleset:default' }],
      emitted: [{ context: 'CI   /   Unit Tests', source: '.github/workflows/ci.yml' }],
    });

    expect(result.missing).toHaveLength(0);
  });
});
