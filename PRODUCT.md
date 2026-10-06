# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Friends and family watching UK reality TV live, as it airs. A typical group is mixed: some people share a sofa,
others watch from their own homes. Everyone has a phone (sometimes a laptop) out next to the telly. One person
starts a room and shares the link in a group chat; the others join by typing just their name. They glance
between the TV and the screen in their hand. Attention belongs to the show, and the app is the running commentary
and game layer around it.

## Product Purpose

WatchTogether turns watching a live episode into a shared game, even when the group isn't all in one room. Each
person gets their own bingo card of the show's clichés, marks squares as things happen on screen, and calls a line
or full house to the room. A live chat carries the reactions. Success means a group uses it for a whole episode
and comes back next week. They should never think about accounts, settings or the app itself.

## Positioning

This is a personal project for the owner's own circles, not a growth product. It's an unofficial fan site and
isn't affiliated with the BBC or the shows' producers. What makes it what it is:

- Rooms exist only around a broadcast: they open 30 minutes before an episode and close an hour after it ends.
  Everything is then deleted. There's no history, archive or feed.
- There are no accounts. A name and a link (or a 10-character code) are the whole onboarding.
- Each show has its own themed area with its own personality, not a generic skin.

## Operating Context

- **Live and time-boxed.** Use happens in the evening during a broadcast, with the TV as the main screen. The
  phone is used in short glances, often one-handed, sometimes in a dim room.
- **Links come from group chats.** Joins arrive from WhatsApp, iMessage and similar, so the first screen is
  usually a deep link to a room asking for a name.
- **Shows and timing.**
  - The Celebrity Traitors (UK) is on BBC One, usually Wednesday and Thursday evenings.
  - Strictly Come Dancing is on BBC One on Saturdays, with a shorter Sunday results show.
  - Air times come from TVmaze, with manual overrides in the repo.
- **Outside a live window**, a show's area shows a countdown to when its next room can open.

## Capabilities and Constraints

- **Rooms.**
  - Anyone can create one, but only during a live window.
  - Up to 20 people per room.
  - People join through a share link (the code sits in the URL fragment) or by typing the code.
  - Display names are unique within a room.
- **Bingo.**
  - A unique server-generated 5×5 card per person, with a FREE centre square.
  - Squares come from a per-show pool of about 50 clichés, curated by the owner in `src/shared/content/`.
  - Self-marked on the honour system. Calling LINE or FULL HOUSE is checked against your own marks and shown to
    the room with the card as evidence. The first caller is announced.
- **Predictions.** Everyone picks who they think goes tonight (Traitors: murdered and banished; Bake Off: Star
  Baker and who leaves; the others: who's voted or skated off). The tally is open: everyone sees who picked whom.
  The host records what actually happened, which locks that question and tells the room who called it. The
  line-up comes from `src/shared/content/cast.ts`, curated by the owner per series (mark leavers `out: true`);
  the host can add or remove names in a room if it's behind. Picks vanish with the room like everything else.
- **Chat.** Live text, up to 280 characters per message, with the last 100 messages kept. It's rate-limited.
  There's a display-only profanity filter the host can toggle.
- **Host controls.** Remove a person (they're banned from the room), lock the room, rotate the code (old links
  stop working), toggle the filter, fix the predictions line-up and record results. If the host leaves, nobody inherits these.
- **Ephemeral by design.**
  - Names, chat and marks are deleted when the room closes.
  - There are no cookies or analytics.
  - The session lives in the browser tab's session storage.
- **Hard constraints.**
  - No XSS or other exploits: a strict CSP and Trusted Types, and no inline scripts or styles.
  - Heavy CDN caching.
  - Responsive and mobile-first.
  - Hosted on Cloudflare Workers with Durable Objects at `watchtogether.uk`, with a Worker Preview per PR instead of a staging site.
  - Deployed by GitHub Actions, with build and tests gating every PR.
  - First-load JavaScript is budgeted at 60 KB gzipped.
- **Undecided.** Which shows come after the first two. Whether host controls should pass to someone else when
  the host leaves.

## Brand Commitments

- **Name:** WatchTogether. **Domain:** watchtogether.uk.
- **Labelling:** always label it an unofficial fan site, not affiliated with or endorsed by the BBC, ITV,
  Channel 4 or the producers. Channel logos (BBC One, ITV1, Channel 4) may appear, small and monochrome, only to
  show where a programme airs (owner's decision, October 2026). Don't use show logos, official artwork or
  presenters' likenesses.
- **Voice: full camp, per show.** Each show's area leans hard into that show's persona:
  - **The Celebrity Traitors:** sinister, theatrical and conspiratorial. Round tables, murders, banishments,
    cloaks and suspicion.
  - **Strictly Come Dancing:** glittery, gushing and showbiz. Sequins, scores and the ballroom.
  - **Shared spaces** (the home page, privacy, errors that aren't tied to a show) stay warm and playful.
- **Clarity first.** The voice is a costume, not a barrier. Errors and instructions must still be instantly
  clear, even mid-joke.
- **Presenters.** Tess Daly and Claudia Winkleman left Strictly after the 2025 series, and the 2026 presenters
  aren't recorded here. Don't reference Strictly presenters by name until this is confirmed. Claudia Winkleman
  presents The Celebrity Traitors.

## Evidence on Hand

- Bingo square pools: `src/shared/content/traitors.ts` and `src/shared/content/strictly.ts`. These are drafts
  awaiting the owner's curation.
- Air-time data from the TVmaze API (CC BY-SA, credited in the footer).
- There are no testimonials, user numbers, press, partnerships or official imagery. Don't fabricate any of them.

## Product Principles

1. **The telly comes first.** Every screen is read in a glance and used in seconds. Never compete with the
   broadcast for attention.
2. **Zero friction to join.** A link and a name, nothing else: no sign-up, no install, no settings to understand
   first.
3. **Each show is its own world.** The persona is the point. A Traitors room and a Strictly room should feel
   unmistakably different.
4. **Here for the episode, gone after.** Ephemerality is a feature: no history, no tracking. Say so plainly
   wherever it matters.
5. **Friends' game, honour system.** Trust the room, make calling bingo a social moment, and keep the tools for
   handling a bad actor simple and quiet.
