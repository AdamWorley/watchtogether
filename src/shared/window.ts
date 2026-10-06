import { z } from './zod';
import { cleanText } from './sanitize';

export const OPEN_BEFORE_MS = 30 * 60_000;
export const CLOSE_AFTER_MS = 60 * 60_000;
/** Used when a listing has no runtime. */
export const DEFAULT_RUNTIME_MIN = 60;

export const EpisodeSchema = z.strictObject({
  /** TVmaze id; manual additions in schedule-overrides.ts use negative ids. */
  id: z
    .number()
    .int()
    .refine((n) => n !== 0),
  name: z
    .string()
    .max(500)
    .transform((s) => cleanText(s).slice(0, 120)),
  season: z.number().int().nonnegative(),
  number: z.number().int().nonnegative().nullable(),
  airstamp: z.iso.datetime({ offset: true }),
  runtime: z.number().int().positive().max(600).nullable(),
});

export type Episode = z.infer<typeof EpisodeSchema>;

export interface EpisodeWindow {
  opensAt: number;
  closesAt: number;
}

export function episodeWindow(ep: Pick<Episode, 'airstamp' | 'runtime'>): EpisodeWindow {
  const airsAt = Date.parse(ep.airstamp);
  const runtimeMs = (ep.runtime ?? DEFAULT_RUNTIME_MIN) * 60_000;
  return { opensAt: airsAt - OPEN_BEFORE_MS, closesAt: airsAt + runtimeMs + CLOSE_AFTER_MS };
}

/** Earlier air time first; on a tie, specials (no episode number) sort before numbered episodes. */
function byAirtime(a: Episode, b: Episode): number {
  return (
    Date.parse(a.airstamp) - Date.parse(b.airstamp) || Number(a.number !== null) - Number(b.number !== null)
  );
}

/**
 * The episode whose watch window contains `now`. If windows overlap, the most recently aired wins,
 * and a numbered episode beats a special airing at the same time.
 */
export function liveEpisode(episodes: readonly Episode[], now: number): Episode | undefined {
  return episodes
    .filter((ep) => {
      const w = episodeWindow(ep);
      return now >= w.opensAt && now < w.closesAt;
    })
    .sort(byAirtime)
    .at(-1);
}

/** The next episode whose window has not yet opened (numbered episodes beat same-time specials). */
export function nextEpisode(episodes: readonly Episode[], now: number): Episode | undefined {
  const upcoming = episodes.filter((ep) => episodeWindow(ep).opensAt > now).sort(byAirtime);
  const first = upcoming[0];
  if (!first) return undefined;
  const firstAt = Date.parse(first.airstamp);
  return upcoming.filter((ep) => Date.parse(ep.airstamp) === firstAt).at(-1);
}

const HOUR_MS = 3600_000;

/**
 * Preview deployments only: a fake episode that is always live, so rooms can be tested at any time.
 * It airs on the hour and runs 60 minutes, so its window (30 min before to 60 min after) always covers now.
 * A room opened from it closes at most two hours later.
 */
export function demoEpisode(now: number): Episode {
  const hour = Math.floor(now / HOUR_MS);
  return {
    id: -1_000_000 - hour,
    name: 'Preview test episode',
    season: 0,
    number: null,
    airstamp: new Date(hour * HOUR_MS).toISOString(),
    runtime: 60,
  };
}

const londonDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/London',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** True when both instants fall on the same UK calendar day (BST/GMT aware). */
export function sameLondonDay(a: number, b: number): boolean {
  return londonDate.format(a) === londonDate.format(b);
}
