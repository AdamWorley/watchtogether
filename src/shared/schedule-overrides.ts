import type { ShowSlug } from './shows';
import type { Episode } from './window';

export interface ScheduleOverride {
  /** Episodes missing from TVmaze. Use negative ids to avoid clashing with real ones. */
  add?: Episode[];
  /** Corrections keyed by TVmaze episode id. */
  patch?: Record<number, Partial<Pick<Episode, 'airstamp' | 'runtime' | 'name'>>>;
  /** TVmaze episode ids to hide. */
  remove?: number[];
}

// Edit via PR when the listings are wrong. Example:
//   traitors: { patch: { 1234567: { airstamp: '2026-10-08T20:00:00+00:00', runtime: 65 } } },
export const SCHEDULE_OVERRIDES: Partial<Record<ShowSlug, ScheduleOverride>> = {};

export function applyOverrides(episodes: Episode[], override: ScheduleOverride | undefined): Episode[] {
  if (!override) return episodes;
  const removed = new Set(override.remove ?? []);
  const patched = episodes
    .filter((ep) => !removed.has(ep.id))
    .map((ep) => ({ ...ep, ...override.patch?.[ep.id] }));
  return [...patched, ...(override.add ?? [])];
}
