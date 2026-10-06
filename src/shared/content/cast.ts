// Who's in each show this series, for the room's predictions ("who goes home tonight?").
// Curated by hand: when someone leaves, set `out: true` (keep the entry so the history reads true).
// A list only applies to rooms for the series it names; any other series starts with an empty line-up,
// which the host fills in from the room. Hosts can also add or remove names in a room if this is behind.
import type { ShowSlug } from '../shows';

export interface Contestant {
  readonly name: string;
  /** Left the show (murdered, banished, voted off…). Hidden from new rooms' line-ups. */
  readonly out?: boolean;
}

export interface Cast {
  /** TVmaze season number this line-up belongs to. */
  readonly season: number;
  readonly people: readonly Contestant[];
}

export const CAST: Partial<Record<ShowSlug, Cast>> = {
  // Series 2, from 1 October 2026.
  'celebrity-traitors': {
    season: 2,
    people: [
      { name: 'Amol Rajan', out: true }, // murdered, episode 2
      { name: 'Bella Ramsey' },
      { name: 'Hannah Fry' },
      { name: 'James Acaster' },
      { name: 'James Blunt' },
      { name: 'Jerry Hall' },
      { name: 'Joanne McNally' },
      { name: 'Joe Lycett' },
      { name: 'Julie Hesmondhalgh' },
      { name: 'King Kenny' },
      { name: 'Leigh-Anne Pinnock' },
      { name: 'Maya Jama' },
      { name: 'Michael Sheen' },
      { name: 'Miranda Hart' },
      { name: 'Myha’la' },
      { name: 'Richard E. Grant' },
      { name: 'Rob Beckett' },
      { name: 'Romesh Ranganathan' },
      { name: 'Ross Kemp' },
      { name: 'Sebastian Croft' },
      { name: 'Sharon Rooney' },
    ],
  },
  // Series 24, from September 2026.
  strictly: {
    season: 24,
    people: [
      { name: 'Bethany Antonia' },
      { name: 'Cach Mercer' },
      { name: 'Chris Appleton', out: true }, // week 2
      { name: 'Dani Dyer' },
      { name: 'Delta Goodrem' },
      { name: 'Graeme Hall' },
      { name: 'Jaime Winstone' },
      { name: 'John Nellis' },
      { name: 'Lacey Turner' },
      { name: 'Lawrence Robb' },
      { name: 'Melanie Walters' },
      { name: 'Sarah Storey' },
      { name: 'Shaun Wright-Phillips' },
      { name: 'Tabby Stoecker' },
      { name: 'Will Best' },
    ],
  },
  // Series 17, from 22 September 2026.
  'bake-off': {
    season: 17,
    people: [
      { name: 'Clara' },
      { name: 'Connie' },
      { name: 'Danni', out: true }, // week 2
      { name: 'Gabe' },
      { name: 'Gary' },
      { name: 'Mo' },
      { name: 'Molly' },
      { name: 'Moyin' },
      { name: 'Nikki' },
      { name: 'Shannon' },
      { name: 'Tom' },
      { name: 'Yannis' },
    ],
  },
};

/** The starting line-up for a room: everyone still in, if the curated list is for this series. */
export function startingLineup(show: ShowSlug, season: number): string[] {
  const cast = CAST[show];
  if (!cast || cast.season !== season) return [];
  return cast.people.filter((p) => !p.out).map((p) => p.name);
}
