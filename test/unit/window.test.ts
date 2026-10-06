import { describe, expect, it } from 'vitest';
import {
  demoEpisode,
  episodeWindow,
  EpisodeSchema,
  liveEpisode,
  nextEpisode,
  sameLondonDay,
  type Episode,
} from '../../src/shared/window';

const ep = (id: number, airstamp: string, runtime: number | null = 60): Episode => ({
  id,
  name: `Episode ${id}`,
  season: 1,
  number: id,
  airstamp,
  runtime,
});

const MIN = 60_000;

describe('episodeWindow', () => {
  it('opens 30 minutes before and closes an hour after the end', () => {
    const w = episodeWindow(ep(1, '2026-10-08T20:00:00+00:00', 65));
    expect(new Date(w.opensAt).toISOString()).toBe('2026-10-08T19:30:00.000Z');
    expect(new Date(w.closesAt).toISOString()).toBe('2026-10-08T22:05:00.000Z');
  });

  it('defaults a missing runtime to 60 minutes', () => {
    const w = episodeWindow(ep(1, '2026-10-08T20:00:00+00:00', null));
    expect(w.closesAt - w.opensAt).toBe(150 * MIN);
  });

  it('handles the BST -> GMT switch (airstamps are absolute instants)', () => {
    // Clocks go back at 02:00 BST on 25 Oct 2026. 9pm UK time either side:
    const bst = episodeWindow(ep(1, '2026-10-24T21:00:00+01:00'));
    const gmt = episodeWindow(ep(2, '2026-10-25T21:00:00+00:00'));
    expect(new Date(bst.opensAt).toISOString()).toBe('2026-10-24T19:30:00.000Z');
    expect(new Date(gmt.opensAt).toISOString()).toBe('2026-10-25T20:30:00.000Z');
  });
});

describe('liveEpisode / nextEpisode', () => {
  const a = ep(1, '2026-10-08T20:00:00Z');
  const b = ep(2, '2026-10-09T20:00:00Z');
  const list = [b, a];
  const at = (iso: string) => Date.parse(iso);

  it('is live exactly from opensAt and not at closesAt', () => {
    expect(liveEpisode(list, at('2026-10-08T19:29:59.999Z'))).toBeUndefined();
    expect(liveEpisode(list, at('2026-10-08T19:30:00Z'))?.id).toBe(1);
    expect(liveEpisode(list, at('2026-10-08T21:59:59.999Z'))?.id).toBe(1);
    expect(liveEpisode(list, at('2026-10-08T22:00:00Z'))).toBeUndefined();
  });

  it('prefers the most recent episode when windows overlap', () => {
    const late = ep(3, '2026-10-08T21:30:00Z');
    expect(liveEpisode([a, late], at('2026-10-08T21:15:00Z'))?.id).toBe(3);
  });

  it('finds the next episode whose window has not opened', () => {
    expect(nextEpisode(list, at('2026-10-08T12:00:00Z'))?.id).toBe(1);
    expect(nextEpisode(list, at('2026-10-08T20:00:00Z'))?.id).toBe(2);
    expect(nextEpisode(list, at('2026-10-10T00:00:00Z'))).toBeUndefined();
  });

  it('prefers a numbered episode over a special airing at the same time', () => {
    const special = { ...ep(9, '2026-10-08T20:00:00Z', 35), number: null };
    for (const list of [
      [special, a],
      [a, special],
    ]) {
      expect(liveEpisode(list, at('2026-10-08T20:10:00Z'))?.id).toBe(1);
      expect(nextEpisode(list, at('2026-10-08T12:00:00Z'))?.id).toBe(1);
    }
  });
});

describe('demoEpisode (Previews only)', () => {
  it('is live at every minute of the hour, and stays stable within the hour', () => {
    const base = Date.parse('2026-10-05T19:00:00Z');
    for (let m = 0; m < 60; m++) {
      const now = base + m * 60_000;
      const demo = demoEpisode(now);
      expect(liveEpisode([demo], now)).toEqual(demo);
      expect(demo.id).toBe(demoEpisode(base).id);
    }
    expect(demoEpisode(base + 3600_000).id).not.toBe(demoEpisode(base).id);
  });

  it('passes the episode schema', () => {
    expect(EpisodeSchema.safeParse(demoEpisode(Date.now())).success).toBe(true);
  });
});

describe('sameLondonDay', () => {
  it('compares UK calendar days, not UTC ones', () => {
    // 23:30 UTC in October is 00:30 BST the next day.
    expect(sameLondonDay(Date.parse('2026-10-06T23:30:00Z'), Date.parse('2026-10-06T12:00:00Z'))).toBe(false);
    expect(sameLondonDay(Date.parse('2026-10-06T22:30:00Z'), Date.parse('2026-10-06T00:00:00Z'))).toBe(true);
    // In winter (GMT) London and UTC days line up.
    expect(sameLondonDay(Date.parse('2026-12-01T23:30:00Z'), Date.parse('2026-12-01T00:30:00Z'))).toBe(true);
  });
});
