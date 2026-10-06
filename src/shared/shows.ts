/** A visual world (src/client/themes/<world>.css). Several shows can share one. */
export type WorldSlug = 'traitors' | 'strictly' | 'jungle' | 'bakeoff' | 'ice';

/** UK channel a show airs on. Logos live in src/client/assets/channels/<slug>.svg. */
export type ChannelSlug = 'bbc-one' | 'itv1' | 'channel-4';

export const CHANNELS: Record<ChannelSlug, { name: string }> = {
  'bbc-one': { name: 'BBC One' },
  itv1: { name: 'ITV1' },
  'channel-4': { name: 'Channel 4' },
};

export interface ShowConfig {
  slug: string;
  name: string;
  /** Optional shorter name for tight spaces (home doors). */
  shortName?: string;
  /** TVmaze show id used to fetch air times (verified against api.tvmaze.com). */
  tvmazeId: number;
  world: WorldSlug;
  channel: ChannelSlug;
}

export const SHOWS = {
  'celebrity-traitors': {
    slug: 'celebrity-traitors',
    name: 'The Celebrity Traitors',
    tvmazeId: 79108,
    world: 'traitors',
    channel: 'bbc-one',
  },
  traitors: {
    slug: 'traitors',
    name: 'The Traitors',
    tvmazeId: 58174,
    world: 'traitors',
    channel: 'bbc-one',
  },
  strictly: {
    slug: 'strictly',
    name: 'Strictly Come Dancing',
    tvmazeId: 4395,
    world: 'strictly',
    channel: 'bbc-one',
  },
  'im-a-celeb': {
    slug: 'im-a-celeb',
    name: 'I’m a Celebrity… Get Me Out of Here!',
    shortName: 'I’m a Celeb',
    tvmazeId: 849,
    world: 'jungle',
    channel: 'itv1',
  },
  'bake-off': {
    slug: 'bake-off',
    name: 'The Great British Bake Off',
    tvmazeId: 2950,
    world: 'bakeoff',
    channel: 'channel-4',
  },
  'dancing-on-ice': {
    slug: 'dancing-on-ice',
    name: 'Dancing on Ice',
    tvmazeId: 8627,
    world: 'ice',
    channel: 'itv1',
  },
} as const satisfies Record<string, ShowConfig>;

export type ShowSlug = keyof typeof SHOWS;

export const SHOW_SLUGS = Object.keys(SHOWS) as ShowSlug[];

export function isShowSlug(value: unknown): value is ShowSlug {
  return typeof value === 'string' && Object.hasOwn(SHOWS, value);
}

export function shortName(show: ShowSlug): string {
  const config: ShowConfig = SHOWS[show];
  return config.shortName ?? config.name;
}

export function worldOf(show: ShowSlug): WorldSlug {
  return SHOWS[show].world;
}
