import { env } from 'cloudflare:workers';
import { createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getSchedule, parseTvmaze, readSchedule, refreshSchedule } from '../../src/worker/schedule';

const now = Date.parse('2026-10-05T12:00:00Z');
const raw = (over: Record<string, unknown>) => ({
  id: 1,
  name: 'Ep',
  season: 2,
  number: 1,
  airstamp: '2026-10-08T20:00:00+00:00',
  runtime: 65,
  summary: '<p>ignored</p>',
  ...over,
});

describe('parseTvmaze', () => {
  it('keeps nearby episodes with valid times and drops the rest', () => {
    const eps = parseTvmaze(
      [
        raw({ id: 1 }),
        raw({ id: 2, airstamp: null }),
        raw({ id: 3, airstamp: 'not a date' }),
        raw({ id: 4, airstamp: '2020-01-01T20:00:00+00:00' }),
        raw({ id: 5, name: null, runtime: null, airstamp: '2026-10-07T20:00:00+00:00' }),
        'garbage',
      ],
      now,
    );
    expect(eps.map((e) => e.id)).toEqual([5, 1]);
    expect(eps[0]).toEqual({
      id: 5,
      name: '',
      season: 2,
      number: 1,
      airstamp: '2026-10-07T20:00:00+00:00',
      runtime: null,
    });
  });

  it('cleans episode names', () => {
    const [ep] = parseTvmaze([raw({ name: 'Week\u202E 1\n' })], now);
    expect(ep!.name).toBe('Week 1');
  });

  it('throws on a non-array payload', () => expect(() => parseTvmaze({}, now)).toThrow());
});

describe('refreshSchedule', () => {
  afterEach(() => vi.restoreAllMocks());

  it('fetches TVmaze and stores the result in KV', async () => {
    const airstamp = new Date(Date.now() + 86_400_000).toISOString();
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json([raw({ id: 42, airstamp })]));
    await refreshSchedule(env, 'strictly');
    expect(spy.mock.calls[0]![0]).toBe('https://api.tvmaze.com/shows/4395/episodes?specials=1');
    expect((await readSchedule(env, 'strictly'))?.episodes.map((e) => e.id)).toEqual([42]);
  });

  it('fails without touching KV when TVmaze errors', async () => {
    await env.KV.put('schedule:traitors', JSON.stringify({ episodes: [], updatedAt: 1 }));
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('down', { status: 503 }));
    await expect(refreshSchedule(env, 'traitors')).rejects.toThrow('503');
    expect((await readSchedule(env, 'traitors'))?.updatedAt).toBe(1);
  });

  it('round-trips manually added (negative id) episodes through KV', async () => {
    const episode = {
      id: -1,
      name: 'Added by hand',
      season: 2,
      number: 7,
      airstamp: '2026-10-22T19:00:00+00:00',
      runtime: 65,
    };
    await env.KV.put('schedule:traitors', JSON.stringify({ episodes: [episode], updatedAt: 5 }));
    expect((await readSchedule(env, 'traitors'))?.episodes).toEqual([episode]);
  });
});

describe('getSchedule', () => {
  afterEach(() => vi.restoreAllMocks());

  const stored = {
    id: 7,
    name: 'From TVmaze',
    season: 2,
    number: 3,
    airstamp: '2026-10-08T19:00:00+00:00',
    runtime: 65,
  };

  it('applies overrides on read without rewriting KV', async () => {
    await env.KV.put('schedule:traitors', JSON.stringify({ episodes: [stored], updatedAt: Date.now() }));
    const ctx = createExecutionContext();
    const result = await getSchedule(env, ctx, 'traitors', { patch: { 7: { runtime: 90 } } });
    await waitOnExecutionContext(ctx);
    expect(result.episodes[0]?.runtime).toBe(90);
    expect((await readSchedule(env, 'traitors'))?.episodes[0]?.runtime).toBe(65);
  });

  it('serves fresh KV data without calling TVmaze', async () => {
    await env.KV.put('schedule:traitors', JSON.stringify({ episodes: [stored], updatedAt: Date.now() }));
    const spy = vi.spyOn(globalThis, 'fetch');
    const ctx = createExecutionContext();
    await getSchedule(env, ctx, 'traitors');
    await waitOnExecutionContext(ctx);
    expect(spy).not.toHaveBeenCalled();
  });

  it('refreshes in the background once the daily cron has been missed for 36h', async () => {
    const old = Date.now() - 37 * 3600_000;
    await env.KV.put('schedule:traitors', JSON.stringify({ episodes: [stored], updatedAt: old }));
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json([]));
    const ctx = createExecutionContext();
    const result = await getSchedule(env, ctx, 'traitors');
    expect(result.episodes.map((e) => e.id)).toEqual([7]); // stale data served immediately
    await waitOnExecutionContext(ctx);
    expect(spy).toHaveBeenCalledOnce();
    expect((await readSchedule(env, 'traitors'))?.updatedAt).toBeGreaterThan(old);
  });
});
