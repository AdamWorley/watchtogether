// Every show speaks in its own persona (PRODUCT.md › Brand Commitments: "full camp, per show").
// Rule of thumb: headings, empty states, celebrations and system messages wear the costume;
// buttons name their action plainly; anything blocking or erroring says the fix first.
//
// Glossary (keep consistent): room · room code · invite link · host · mark · call · LINE · FULL HOUSE.
import type { ClaimKind } from '../../shared/bingo';
import { SHOWS, type ShowSlug, type WorldSlug } from '../../shared/shows';

interface Titled {
  heading: string;
  body: string;
}

export interface ShowVoice {
  tagline: string;
  /** The FREE centre square: a world name plus the plain word FREE. */
  free: { name: string; sub: string };
  /** Decorative emblem copy (aria-hidden). */
  emblem: readonly { n: string; t: string }[];
  /** Link text on the home page card. */
  enter: string;
  liveBlurb: (closesAt: string) => string;
  nextHeading: string;
  dark: Titled;
  joinCard: Titled;
  joinPage: Titled;
  namePlaceholder: string;
  shareText: string;
  connecting: string;
  ended: Titled;
  kicked: Titled;
  rejoin: Titled;
  noCode: Titled;
  chatEmpty: string;
  chatPlaceholder: string;
  hint: string;
  claim: (name: string, kind: ClaimKind, first: boolean) => string;
  joined: (name: string) => string;
  removed: (name: string) => string;
  locked: string;
  unlocked: string;
  filter: (on: boolean) => string;
  rateLimited: string;
  badClaim: string;
  /** Large-screen sidebar tally: what a mark is called in this world, and whether to count in roman numerals. */
  tally: { unit: string; roman: boolean };
  /** The full-house finale, played for the whole room. */
  finale: { title: string; line: (name: string) => string };
  /** Telly mode's leaderboard heading. */
  board: string;
}

const REJOIN_BODY =
  'This room has closed, or your place in it has lapsed. Try joining again with the same link.';
const NO_CODE_BODY = 'This link is missing its room code. Ask whoever sent it for the code.';

const traitors = (show: string): ShowVoice => ({
  free: { name: 'The Fool', sub: 'FREE' },
  emblem: [
    { n: 'XIII', t: 'The Banished' },
    { n: '0', t: 'The Fool' },
    { n: 'VI', t: 'The Shield' },
  ],
  tagline: 'Faithful or Traitor? Gather at the round table, mark your suspicions and trust no one.',
  enter: 'Enter the castle',
  liveBlurb: (t) => `The round table sits until ${t}. Start a room and summon your Faithfuls.`,
  nextHeading: 'The castle awaits',
  dark: {
    heading: 'The castle is dark',
    body: 'No episodes are scheduled. Rooms will open when the next series is announced.',
  },
  joinCard: {
    heading: 'Been summoned?',
    body: 'Enter the room code you were sent. Whisper it, never shout it.',
  },
  joinPage: {
    heading: 'You have been summoned',
    body: `Someone has gathered a round table for ${show}. Choose the name you will be known by.`,
  },
  namePlaceholder: 'The name the castle will know you by',
  shareText: `You have been summoned to my ${show} round table.`,
  connecting: 'Opening the castle doors…',
  ended: {
    heading: 'The castle doors have closed',
    body: 'This room has ended, and every word said in it has been destroyed. Until the next round table.',
  },
  kicked: { heading: 'You have been banished', body: 'The host has removed you from this room.' },
  rejoin: { heading: 'The doors won’t open', body: REJOIN_BODY },
  noCode: { heading: 'No code, no entry', body: NO_CODE_BODY },
  chatEmpty: 'Silence at the table. Suspicious. Be the first to speak.',
  chatPlaceholder: 'Make an accusation…',
  hint: 'Mark a square when it happens on screen. When you call, everyone sees your card, so leave the lying to the Traitors.',
  claim: (name, kind, first) =>
    kind === 'line'
      ? first
        ? `${name} called the first LINE. Suspiciously quick…`
        : `${name} called a LINE.`
      : first
        ? `${name} called FULL HOUSE. The game is won.`
        : `${name} called FULL HOUSE too.`,
  joined: (name) => `${name} has entered the castle`,
  removed: (name) => `${name} has been banished by the host`,
  locked: 'The host has barred the doors. No one new can join.',
  unlocked: 'The doors are open again. New people can join.',
  filter: (on) =>
    on
      ? 'The host turned the swearing filter on.'
      : 'The host turned the swearing filter off. Brace yourselves.',
  rateLimited: 'Steady. Too much talking draws suspicion. Wait a moment.',
  badClaim: 'Not yet. Your marked squares don’t make that.',
  tally: { unit: 'fates turned', roman: true },
  finale: { title: 'The reading is complete', line: (name) => `${name} has turned every fate.` },
  board: 'The round table',
});

const strictly = (): ShowVoice => ({
  free: { name: 'Fab-u-lous', sub: 'FREE' },
  emblem: [{ n: '10', t: 'A ten from us' }],
  tagline: 'Keep dancing, keep playing. Sequins optional, enthusiasm compulsory.',
  enter: 'Take to the floor',
  liveBlurb: (t) => `The ballroom is open until ${t}. Start a room and get your friends on the floor.`,
  nextHeading: 'Warming up the ballroom',
  dark: {
    heading: 'The ballroom is dark',
    body: 'No episodes are scheduled. Rooms will open when the next series is announced.',
  },
  joinCard: {
    heading: 'On the guest list?',
    body: 'Pop in the room code your friend sent you, darling.',
  },
  joinPage: {
    heading: 'You’re on the guest list!',
    body: 'Someone has started a Strictly watch party. What shall we call you, darling?',
  },
  namePlaceholder: 'Your name in lights',
  shareText: 'Come and watch Strictly with me. Bring your scorecard, darling.',
  connecting: 'Warming up the ballroom…',
  ended: {
    heading: 'That’s the last dance!',
    body: 'This room has closed, and everything in it has been swept off the dancefloor. Same time next week, darling?',
  },
  kicked: { heading: 'Sent home early', body: 'The host has removed you from this room.' },
  rejoin: { heading: 'You missed your cue', body: REJOIN_BODY },
  noCode: { heading: 'No code, no dance', body: NO_CODE_BODY },
  chatEmpty: 'The floor’s empty. Who’s brave enough to go first?',
  chatPlaceholder: 'Hold up your scorecard…',
  hint: 'Mark a square when it happens on screen. When you call, everyone sees your card, so no fudging the scores.',
  claim: (name, kind, first) =>
    kind === 'line'
      ? first
        ? `${name} called the first LINE. Fab-u-lous!`
        : `${name} called a LINE. Lovely footwork.`
      : first
        ? `${name} called FULL HOUSE. That’s a ten from us!`
        : `${name} called FULL HOUSE too.`,
  joined: (name) => `${name} has sashayed in`,
  removed: (name) => `${name} has been sent home by the host`,
  locked: 'The host has closed the guest list. No one new can join.',
  unlocked: 'The guest list is open again. New people can join.',
  filter: (on) =>
    on
      ? 'The host turned the swearing filter on. Keep it family-friendly, darlings.'
      : 'The host turned the swearing filter off.',
  rateLimited: 'It’s a waltz, not a quickstep! Slow down a moment.',
  badClaim: 'Not quite, darling. Your marked squares don’t make that.',
  tally: { unit: 'squares sewn', roman: false },
  finale: { title: 'A perfect ten!', line: (name) => `${name} has danced every square, darling.` },
  board: 'The leaderboard',
});

const jungle = (): ShowVoice => ({
  free: { name: 'Bushtucker', sub: 'FREE' },
  emblem: [{ n: '', t: 'Camp' }],
  tagline: 'Rice, beans and a bingo card. Earn your stars before the trial does.',
  enter: 'Enter the camp',
  liveBlurb: (t) => `Camp is lit until ${t}. Start a room and get your campmates round the fire.`,
  nextHeading: 'The camp is being built',
  dark: {
    heading: 'The jungle is quiet',
    body: 'No episodes are scheduled. Rooms will open when the next series is announced.',
  },
  joinCard: { heading: 'Got your camp code?', body: 'Enter the room code your campmate sent you.' },
  joinPage: {
    heading: 'Welcome to camp!',
    body: 'Someone has lit the campfire for I’m a Celeb. What should your campmates call you?',
  },
  namePlaceholder: 'Your name on the camp board',
  shareText: 'Join my I’m a Celeb camp. Bring a torch and a strong stomach.',
  connecting: 'Lighting the campfire…',
  ended: {
    heading: 'Camp has been cleared',
    body: 'This room has closed and everything in it has gone with the dunny. Same time tomorrow?',
  },
  kicked: { heading: 'You’ve been voted out', body: 'The host has removed you from this room.' },
  rejoin: { heading: 'The bridge is up', body: REJOIN_BODY },
  noCode: { heading: 'No code, no camp', body: NO_CODE_BODY },
  chatEmpty: 'Quiet round the campfire. Someone say something before the bugs do.',
  chatPlaceholder: 'Shout across the camp…',
  hint: 'Mark a square when it happens on screen. When you call, everyone sees your card, so no hiding stars down your top.',
  claim: (name, kind, first) =>
    kind === 'line'
      ? first
        ? `${name} called the first LINE. That’s a star for camp!`
        : `${name} called a LINE.`
      : first
        ? `${name} called FULL HOUSE. King or Queen of the Jungle!`
        : `${name} called FULL HOUSE too.`,
  joined: (name) => `${name} has arrived at camp`,
  removed: (name) => `${name} has been voted out by the host`,
  locked: 'The host has raised the bridge. No one new can join.',
  unlocked: 'The bridge is down again. New people can join.',
  filter: (on) =>
    on ? 'The host turned the swearing filter on. Bleep!' : 'The host turned the swearing filter off.',
  rateLimited: 'Steady on, you’ll scare the wildlife. Wait a moment.',
  badClaim: 'Not yet. Your marked squares don’t make that.',
  tally: { unit: 'stars earned', roman: false },
  finale: { title: 'Jungle royalty', line: (name) => `${name} has earned every star in camp.` },
  board: 'The camp board',
});

const bakeoff = (): ShowVoice => ({
  free: { name: 'Star Baker', sub: 'FREE' },
  emblem: [{ n: '1', t: 'Star Baker' }],
  tagline: 'On your marks, get set, bingo. No soggy bottoms allowed.',
  enter: 'Step into the tent',
  liveBlurb: (t) => `The tent is open until ${t}. Start a room and get your bakers to their benches.`,
  nextHeading: 'The ovens are warming up',
  dark: {
    heading: 'The tent is packed away',
    body: 'No episodes are scheduled. Rooms will open when the next series is announced.',
  },
  joinCard: { heading: 'Got a bench number?', body: 'Pop in the room code your fellow baker sent you.' },
  joinPage: {
    heading: 'Your bench is ready',
    body: 'Someone has opened the tent for Bake Off. What name goes on your bench?',
  },
  namePlaceholder: 'The name on your bench',
  shareText: 'Join my Bake Off room. Bring cake.',
  connecting: 'Preheating the oven…',
  ended: {
    heading: 'Bakers, please step away from your bakes',
    body: 'This room has closed and every crumb in it has been swept up. See you next week.',
  },
  kicked: { heading: 'You’ve left the tent', body: 'The host has removed you from this room.' },
  rejoin: { heading: 'The tent flap’s closed', body: REJOIN_BODY },
  noCode: { heading: 'No code, no cake', body: NO_CODE_BODY },
  chatEmpty: 'Nothing in the tent but the hum of mixers. Say hello.',
  chatPlaceholder: 'Judge the bakes…',
  hint: 'Mark a square when it happens on screen. When you call, everyone sees your card, so no sneaking a finished bake in.',
  claim: (name, kind, first) =>
    kind === 'line'
      ? first
        ? `${name} called the first LINE. That deserves a handshake.`
        : `${name} called a LINE. Lovely bake.`
      : first
        ? `${name} called FULL HOUSE. Star Baker!`
        : `${name} called FULL HOUSE too.`,
  joined: (name) => `${name} has taken their bench`,
  removed: (name) => `${name} has been asked to leave the tent by the host`,
  locked: 'The host has closed the tent. No one new can join.',
  unlocked: 'The tent is open again. New people can join.',
  filter: (on) =>
    on
      ? 'The host turned the swearing filter on. Keep it sweet.'
      : 'The host turned the swearing filter off.',
  rateLimited: 'Let it prove a moment. Slow down.',
  badClaim: 'Not quite baked. Your marked squares don’t make that.',
  tally: { unit: 'squares iced', roman: false },
  finale: { title: 'Star Baker!', line: (name) => `${name} has iced every square.` },
  board: 'The bench',
});

const ice = (): ShowVoice => ({
  free: { name: 'Bolero', sub: 'FREE' },
  emblem: [{ n: '6.0', t: 'Perfect' }],
  tagline: 'Spins, splits and the odd wobble. Lace up and play along.',
  enter: 'Step onto the ice',
  liveBlurb: (t) => `The rink is open until ${t}. Start a room and get your skaters on the ice.`,
  nextHeading: 'The ice is being laid',
  dark: {
    heading: 'The rink is closed',
    body: 'No episodes are scheduled. Rooms will open when the next series is announced.',
  },
  joinCard: { heading: 'Got your skate ticket?', body: 'Enter the room code your friend sent you.' },
  joinPage: {
    heading: 'Your skates are laced',
    body: 'Someone has opened the rink for Dancing on Ice. What name goes on the scoreboard?',
  },
  namePlaceholder: 'Your name on the scoreboard',
  shareText: 'Come and watch Dancing on Ice with me. Mind the toe picks.',
  connecting: 'Resurfacing the ice…',
  ended: {
    heading: 'The lights are down on the rink',
    body: 'This room has closed and everything in it has melted away. See you next week.',
  },
  kicked: { heading: 'You’ve been skated off', body: 'The host has removed you from this room.' },
  rejoin: { heading: 'The rink door’s shut', body: REJOIN_BODY },
  noCode: { heading: 'No ticket, no skate', body: NO_CODE_BODY },
  chatEmpty: 'Clean ice and no one on it. Who’s first out?',
  chatPlaceholder: 'Hold up your scores…',
  hint: 'Mark a square when it happens on screen. When you call, everyone sees your card, so no skating round the rules.',
  claim: (name, kind, first) =>
    kind === 'line'
      ? first
        ? `${name} called the first LINE. Clean landing!`
        : `${name} called a LINE.`
      : first
        ? `${name} called FULL HOUSE. A perfect six!`
        : `${name} called FULL HOUSE too.`,
  joined: (name) => `${name} has stepped onto the ice`,
  removed: (name) => `${name} has been skated off by the host`,
  locked: 'The host has closed the rink. No one new can join.',
  unlocked: 'The rink is open again. New people can join.',
  filter: (on) =>
    on ? 'The host turned the swearing filter on.' : 'The host turned the swearing filter off.',
  rateLimited: 'Easy, you’ll lose an edge. Wait a moment.',
  badClaim: 'Not yet. Your marked squares don’t make that.',
  tally: { unit: 'squares landed', roman: false },
  finale: { title: 'A perfect 6.0', line: (name) => `${name} has landed every square.` },
  board: 'The scoreboard',
});

const WORLD_VOICES: Record<WorldSlug, (showName: string) => ShowVoice> = {
  traitors,
  strictly,
  jungle,
  bakeoff,
  ice,
};

export const VOICES = Object.fromEntries(
  (Object.keys(SHOWS) as ShowSlug[]).map((slug) => [slug, WORLD_VOICES[SHOWS[slug].world](SHOWS[slug].name)]),
) as Record<ShowSlug, ShowVoice>;

/** Messages that mean the same thing in every show. Plain on purpose. */
export const COMMON = {
  rotated: 'The host changed the room code. Old links no longer work.',
  alreadyClaimed: 'You’ve already called that.',
};
