import { describe, expect, it } from 'vitest';
import { applyOverrides } from '../../src/shared/schedule-overrides';
import type { Episode } from '../../src/shared/window';

const ep = (id: number): Episode => ({
  id,
  name: 'x',
  season: 1,
  number: id,
  airstamp: '2026-10-08T20:00:00Z',
  runtime: 60,
});

describe('applyOverrides', () => {
  it('patches, removes and adds episodes', () => {
    const result = applyOverrides([ep(1), ep(2)], {
      patch: { 1: { runtime: 90 } },
      remove: [2],
      add: [ep(-1)],
    });
    expect(result.map((e) => [e.id, e.runtime])).toEqual([
      [1, 90],
      [-1, 60],
    ]);
  });

  it('is a no-op without an override', () => expect(applyOverrides([ep(1)], undefined)).toEqual([ep(1)]));
});
