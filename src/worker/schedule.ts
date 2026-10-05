import { z } from '../shared/zod';
import { applyOverrides, SCHEDULE_OVERRIDES, type ScheduleOverride } from '../shared/schedule-overrides';
import { SHOW_SLUGS, SHOWS, type ShowSlug } from '../shared/shows';
import { demoEpisode, EpisodeSchema, type Episode } from '../shared/window';
import { log, readCapped } from './http';

const TVMAZE = 'https://api.tvmaze.com';
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;
const MAX_EPISODES = 200;
const KEEP_PAST_MS = 7 * 24 * 3600_000;
const KEEP_FUTURE_MS = 180 * 24 * 3600_000;
/**
 * The daily cron keeps KV fresh. If it has failed for longer than this, the next request
 * triggers a background refresh instead (a safety net, not the normal path).
 */
const STALE_AFTER_MS = 36 * 3600_000;

const StoredSchedule = z.strictObject({ episodes: z.array(EpisodeSchema), updatedAt: z.number() });
export type StoredSchedule = z.infer<typeof StoredSchedule>;

// Only the fields we use; TVmaze sends many more, which are ignored (non-strict on purpose).
const TvmazeEpisode = z.object({
  id: z.number(),
  name: z.string().nullable(),
  season: z.number(),
  number: z.number().nullable(),
  airstamp: z.string().nullable(),
  runtime: z.number().nullable(),
});

const key = (show: ShowSlug) => `schedule:${show}`;

/** Convert raw TVmaze JSON into validated episodes near "now". Exported for tests. */
export function parseTvmaze(raw: unknown, now: number): Episode[] {
  if (!Array.isArray(raw)) throw new Error('tvmaze: expected array');
  const episodes: Episode[] = [];
  for (const item of raw) {
    const base = TvmazeEpisode.safeParse(item);
    if (!base.success || !base.data.airstamp) continue;
    const ep = EpisodeSchema.safeParse({
      id: base.data.id,
      name: base.data.name ?? '',
      season: base.data.season,
      number: base.data.number,
      airstamp: base.data.airstamp,
      runtime: base.data.runtime,
    });
    if (!ep.success) continue;
    const at = Date.parse(ep.data.airstamp);
    if (at < now - KEEP_PAST_MS || at > now + KEEP_FUTURE_MS) continue;
    episodes.push(ep.data);
  }
  return episodes.sort((a, b) => Date.parse(a.airstamp) - Date.parse(b.airstamp)).slice(0, MAX_EPISODES);
}

export async function refreshSchedule(env: Env, show: ShowSlug): Promise<StoredSchedule> {
  const res = await fetch(`${TVMAZE}/shows/${SHOWS[show].tvmazeId}/episodes?specials=1`, {
    headers: { Accept: 'application/json', 'User-Agent': 'watchtogether.uk schedule sync' },
  });
  if (!res.ok) {
    await res.body?.cancel();
    throw new Error(`tvmaze: HTTP ${res.status}`);
  }
  const text = await readCapped(res.body, MAX_RESPONSE_BYTES);
  if (text === null) throw new Error('tvmaze: response too large');
  const now = Date.now();
  // Raw TVmaze data is stored; overrides are applied on read so a fix ships with the deploy.
  const stored: StoredSchedule = { episodes: parseTvmaze(JSON.parse(text), now), updatedAt: now };
  await env.KV.put(key(show), JSON.stringify(stored));
  log('schedule.refreshed', { show, episodes: stored.episodes.length });
  return stored;
}

export async function readSchedule(env: Env, show: ShowSlug): Promise<StoredSchedule | null> {
  const raw = await env.KV.get(key(show), 'json');
  const parsed = StoredSchedule.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

/**
 * KV first; fetch from TVmaze if missing, refresh in the background if stale.
 * Overrides from schedule-overrides.ts are applied here, so they take effect as soon as they're deployed.
 * On Previews (DEMO_EPISODES=on) an always-live test episode is added.
 */
export async function getSchedule(
  env: Env,
  ctx: ExecutionContext,
  show: ShowSlug,
  overrides: ScheduleOverride | undefined = SCHEDULE_OVERRIDES[show],
): Promise<StoredSchedule> {
  let stored = await readSchedule(env, show);
  if (!stored) {
    stored = await refreshSchedule(env, show);
  } else if (Date.now() - stored.updatedAt > STALE_AFTER_MS) {
    ctx.waitUntil(refreshSchedule(env, show).catch(() => log('schedule.refresh_failed', { show })));
  }
  const episodes = applyOverrides(stored.episodes, overrides);
  // Set only in the `previews` block of wrangler.jsonc; production is always "off".
  if (env.DEMO_EPISODES === 'on') episodes.push(demoEpisode(Date.now()));
  return { ...stored, episodes };
}

export async function refreshAll(env: Env): Promise<void> {
  const results = await Promise.allSettled(SHOW_SLUGS.map((show) => refreshSchedule(env, show)));
  results.forEach((r, i) => {
    if (r.status === 'rejected') log('schedule.refresh_failed', { show: SHOW_SLUGS[i]! });
  });
}
