<script lang="ts">
  import { untrack } from 'svelte';
  import { shortName, SHOW_SLUGS, SHOWS, type ShowSlug } from '../../shared/shows';
  import { episodeWindow, liveEpisode, nextEpisode, type Episode } from '../../shared/window';
  import ChannelBadge from '../components/ChannelBadge.svelte';
  import HeroTelly from '../components/HeroTelly.svelte';
  import WorldEmblem from '../components/WorldEmblem.svelte';
  import { getSchedule } from '../lib/api';
  import { useClock } from '../lib/clock.svelte';
  import { formatDuration, formatTime, formatWhen } from '../lib/format';
  import { listNames, VOICES } from '../lib/voice';

  const clock = useClock();
  // undefined = still loading, null = couldn't load (the door then stays a plain link).
  let schedules = $state<Partial<Record<ShowSlug, Episode[] | null>>>({});

  function load(slugs: readonly ShowSlug[]) {
    for (const slug of slugs) {
      delete schedules[slug];
      getSchedule(slug)
        .then((s) => (schedules[slug] = s.episodes))
        .catch(() => (schedules[slug] = null));
    }
  }

  $effect(() => untrack(() => load(SHOW_SLUGS)));

  type DoorState =
    | { kind: 'loading' }
    | { kind: 'unknown' }
    | { kind: 'live'; episode: Episode; premiere: boolean }
    | { kind: 'next'; episode: Episode; newSeries: boolean }
    | { kind: 'dark' };

  function doorState(slug: ShowSlug): DoorState {
    const episodes = schedules[slug];
    if (episodes === undefined) return { kind: 'loading' };
    if (episodes === null) return { kind: 'unknown' };
    const live = liveEpisode(episodes, clock.now);
    if (live) return { kind: 'live', episode: live, premiere: live.number === 1 };
    const next = nextEpisode(episodes, clock.now);
    if (next) return { kind: 'next', episode: next, newSeries: next.number === 1 };
    return { kind: 'dark' };
  }

  const loading = $derived(SHOW_SLUGS.some((s) => doorState(s).kind === 'loading'));

  // Live shows first, then whatever airs soonest, then shows off the air.
  function rank(slug: ShowSlug): number {
    const d = doorState(slug);
    if (d.kind === 'live') return 0;
    if (d.kind === 'next') return 1 + Date.parse(d.episode.airstamp) / 1e15;
    if (d.kind === 'loading' || d.kind === 'unknown') return 3;
    return 4;
  }
  const ordered = $derived([...SHOW_SLUGS].sort((a, b) => rank(a) - rank(b)));
  const kindOf = (slug: ShowSlug) => doorState(slug).kind;
  const liveSlugs = $derived(ordered.filter((s) => kindOf(s) === 'live'));
  // Couldn't load the times: still a door you can open, but never presented as on air.
  const unknownSlugs = $derived(ordered.filter((s) => kindOf(s) === 'unknown'));
  const restSlugs = $derived(ordered.filter((s) => !['live', 'unknown'].includes(kindOf(s))));
  const isLive = $derived(liveSlugs.length > 0);
  // The soonest show that isn't on yet, for "Next up".
  const upNext = $derived.by(() => {
    const slug = ordered.find((s) => kindOf(s) === 'next');
    const d = slug ? doorState(slug) : undefined;
    return slug && d?.kind === 'next'
      ? { slug, when: formatWhen(Date.parse(d.episode.airstamp), clock.now) }
      : undefined;
  });
  // Tonight means something is on, or will be later today.
  const tonight = $derived(isLive || (upNext?.when.startsWith('today') ?? false));
  // The telly quotes what's on, then what's next, rather than shows nobody can watch.
  const tellyShows = $derived(ordered.filter((s) => ['live', 'next'].includes(kindOf(s))));

  // Tonight, as a TV listings page: what happens when, from doors open to lights out.
  const RUNNING_ORDER = [
    {
      when: 'Half an hour before',
      title: 'Doors open',
      body: 'One of you starts a room and drops the link in the group chat. Everyone else is in with just a name. No sign-ups, no apps, no faff.',
    },
    {
      when: 'On air',
      title: 'Eyes down',
      body: 'Everyone gets their own bingo card of the show’s clichés. Mark them as they land, call LINE before anyone else, then be insufferable about it in the chat.',
    },
    {
      when: 'Before the verdict',
      title: 'Place your bets',
      body: 'Who’s getting banished? Murdered? Sent home? Who’s Star Baker? Everyone picks, the tally’s there for all to see, and the host reveals who called it.',
    },
    {
      when: 'An hour after',
      title: 'Lights out',
      body: 'The room closes, and the chat, the cards and every terrible take are deleted for good. Same time next week?',
    },
  ] as const;
</script>

<section class="container hero" class:live-night={isLive}>
  {#if isLive || loading}
    <h1>The telly’s on. <span class="line2">Bring everyone.</span></h1>
  {:else}
    <h1>The telly’s off. <span class="line2">Not for long.</span></h1>
  {/if}
  <div class="bars" aria-hidden="true">
    <span></span><span></span><span></span><span></span><span></span><span></span><span></span>
  </div>
  <p class="hook">You already shout at the telly. Now it’s a game.</p>
  <div class="tonight" role="status">
    {#if isLive}
      <span class="dot" aria-hidden="true"></span>
      <p>{listNames(liveSlugs.map(shortName))} {liveSlugs.length === 1 ? 'is' : 'are'} on now.</p>
    {:else if loading}
      <p class="quiet">Checking tonight’s schedule…</p>
    {:else if unknownSlugs.length > 0}
      <p>Couldn’t check tonight’s times. You can still open any show below.</p>
      <button class="btn small secondary" type="button" onclick={() => load(unknownSlugs)}>Try again</button>
    {:else if upNext}
      <p>Nothing’s on just yet. Next up: {shortName(upNext.slug)}, {upNext.when}.</p>
    {:else}
      <p>Nothing’s on just yet. Rooms open half an hour before each episode.</p>
    {/if}
  </div>
</section>

{#snippet pitch()}
  <section class="container pitch" aria-label="How it works">
    <p class="lead">
      One of you starts a room when the show’s on and drops the link in the group chat. Everyone gets their
      own bingo card of the show’s clichés, a chat that’s watching the same thing, and a vote on who’s going
      home. Same sofa or opposite ends of the country, you’re all in the same room.
    </p>
    <div class="hero-telly">
      <HeroTelly shows={tellyShows} />
    </div>
  </section>
{/snippet}

{#snippet door(slug: ShowSlug)}
  {@const d = doorState(slug)}
  {@const voice = VOICES[slug]}
  {#if d.kind === 'live' || d.kind === 'unknown'}
    <a class="door" class:live={d.kind === 'live'} href="/{slug}" data-world={SHOWS[slug].world}>
      <WorldEmblem show={slug} />
      <div class="copy">
        {#if d.kind === 'live'}
          <span class="on-air" aria-hidden="true">On air</span>
        {/if}
        <h3>{shortName(slug)}</h3>
        <ChannelBadge show={slug} />
        <p class="tagline">{voice.tagline}</p>
        {#if d.kind === 'live'}
          <p class="when">
            {d.premiere
              ? 'Series premiere'
              : d.episode.number === null
                ? 'Special'
                : `Series ${d.episode.season}, episode ${d.episode.number}`} · rooms open until {formatTime(
              episodeWindow(d.episode).closesAt,
            )}
          </p>
        {/if}
        <span class="enter">{voice.enter}</span>
      </div>
    </a>
  {:else}
    <!-- Not on air (or not known yet): no rooms can exist, so the door is closed, not a link. -->
    <div
      class="door"
      class:off={d.kind !== 'loading'}
      class:pending={d.kind === 'loading'}
      data-world={SHOWS[slug].world}
      aria-label="{SHOWS[slug].name}, {d.kind === 'loading' ? 'checking the schedule' : 'not on air'}"
    >
      {#if d.kind === 'next' && d.newSeries}
        <span class="new-series">New series</span>
      {/if}
      <WorldEmblem show={slug} />
      <div class="copy">
        <h3>{shortName(slug)}</h3>
        <ChannelBadge show={slug} />
        {#if d.kind === 'loading'}
          <p class="when">Checking the schedule…</p>
        {:else if d.kind === 'next'}
          {@const w = episodeWindow(d.episode)}
          {@const when = formatWhen(Date.parse(d.episode.airstamp), clock.now)}
          <p class="when">
            {d.newSeries
              ? `Series ${d.episode.season} starts ${when}`
              : when.startsWith('today')
                ? `On ${when}`
                : `Next on ${when}`}
          </p>
          <p class="opens">
            Rooms open at {formatTime(w.opensAt)} · in {formatDuration(w.opensAt - clock.now)}
          </p>
        {:else}
          <p class="when">Off air until the next series is announced.</p>
        {/if}
      </div>
    </div>
  {/if}
{/snippet}

<!-- A live night leads with the doors; any other night leads with the pitch. -->
{#if isLive}
  <section class="container group live-group" aria-labelledby="on-air-now">
    <h2 id="on-air-now" class="group-title">On air now</h2>
    <div class="doors live-doors">
      {#each liveSlugs as slug (slug)}{@render door(slug)}{/each}
    </div>
  </section>
{/if}

{@render pitch()}

{#if unknownSlugs.length > 0}
  <section class="container group" aria-labelledby="times-unknown">
    <h2 id="times-unknown" class="group-title">The shows <span class="aside">· times unavailable</span></h2>
    <div class="doors rest-doors">
      {#each unknownSlugs as slug (slug)}{@render door(slug)}{/each}
    </div>
  </section>
{/if}

{#if restSlugs.length > 0}
  <section class="container group" aria-labelledby="coming-up">
    <h2 id="coming-up" class="group-title">
      {isLive || unknownSlugs.length > 0 ? 'Coming up' : 'The shows'}
    </h2>
    <div class="doors rest-doors">
      {#each restSlugs as slug (slug)}{@render door(slug)}{/each}
    </div>
  </section>
{/if}

<section class="container listings" aria-labelledby="running-order">
  <h2 id="running-order" class="group-title">{tonight ? 'Tonight’s running order' : 'The running order'}</h2>
  <ol>
    {#each RUNNING_ORDER as slot (slot.title)}
      <li>
        <p class="slot-when">{slot.when}</p>
        <div>
          <h3>{slot.title}</h3>
          <p>{slot.body}</p>
        </div>
      </li>
    {/each}
  </ol>
</section>

<style>
  .hero {
    padding-top: clamp(32px, 7vw, 96px);
    padding-bottom: clamp(20px, 3vw, 32px);
  }
  .hero h1 {
    font-size: clamp(3rem, 11vw, 6rem);
    font-weight: 800;
    letter-spacing: -0.04em;
    line-height: 0.92;
    max-width: 11ch;
    margin-bottom: 0.32em;
  }
  /* A live night is about the doors: the hero tightens so they arrive in the first screen. */
  .hero.live-night {
    padding-top: clamp(20px, 4vw, 56px);
  }
  .hero.live-night h1 {
    font-size: clamp(2.6rem, 8vw, 4.6rem);
  }
  .hook {
    margin: 0;
    font-size: clamp(1.15rem, 2.2vw, 1.4rem);
    font-weight: 700;
    line-height: 1.3;
    text-wrap: balance;
  }
  .line2 {
    display: block;
    color: #f2c230;
  }

  /* A telly test-card strip drawn from both worlds' colours. */
  /* The brand's test-card bars (src/client/lib/brand.ts BARS), the same seven as the logo's screen. */
  .bars {
    grid-area: bars;
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    width: min(100%, 560px);
    height: 14px;
    margin-bottom: clamp(18px, 2.5vw, 28px);
    border-radius: 2px;
    overflow: hidden;
  }
  .bars span:nth-child(1) {
    background: #e6dfcd;
  }
  .bars span:nth-child(2) {
    background: #f2c230;
  }
  .bars span:nth-child(3) {
    background: #19d3c5;
  }
  .bars span:nth-child(4) {
    background: #23c06b;
  }
  .bars span:nth-child(5) {
    background: #ff2e93;
  }
  .bars span:nth-child(6) {
    background: #d8402b;
  }
  .bars span:nth-child(7) {
    background: #2c4bb0;
  }

  /* The pitch: the lead beside the telly on wide screens, the telly under it on phones. */
  .pitch {
    display: grid;
    gap: 24px;
    align-items: center;
    margin-top: clamp(28px, 4vw, 48px);
  }
  .live-group + .pitch {
    margin-top: clamp(40px, 6vw, 72px);
  }
  .lead {
    font-size: clamp(1.05rem, 2vw, 1.25rem);
    max-width: 52ch;
    color: var(--muted);
    margin: 0;
    text-wrap: pretty;
  }
  .hero-telly {
    width: min(58%, 240px);
    margin: 0 auto;
  }
  @media (min-width: 860px) {
    .pitch {
      grid-template-columns: minmax(0, 1fr) minmax(260px, 0.55fr);
      column-gap: clamp(28px, 5vw, 72px);
    }
    .hero-telly {
      width: 100%;
      max-width: 360px;
      margin: 0 0 0 auto;
    }
  }
  .tonight {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 10px;
    min-height: 1.5em;
    margin: 14px 0 0;
    font-weight: 700;
  }
  .tonight p {
    margin: 0;
    flex: 0 1 auto;
    text-wrap: pretty;
  }
  .tonight .quiet {
    color: var(--muted);
    font-weight: 500;
  }
  .tonight .dot {
    flex: none;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    animation: lamp-dot 2.6s ease-in-out infinite;
    background: #ff3b30;
    box-shadow: 0 0 0 3px rgb(255 59 48 / 0.25);
  }

  .doors {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 460px), 1fr));
    gap: clamp(16px, 2vw, 24px);
  }

  /* Each door is rendered inside its own world: tokens come from [data-world]. */
  .door {
    position: relative;
    display: flex;
    align-items: center;
    gap: clamp(18px, 4vw, 36px);
    min-height: clamp(260px, 30vw, 340px);
    padding: clamp(22px, 4vw, 40px);
    background: var(--bg);
    color: var(--text);
    border: var(--keyline) solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    text-decoration: none;
    font-family: var(--font-body);
    transition:
      transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1),
      box-shadow 0.25s ease-out;
  }
  a.door:hover {
    transform: translateY(-4px);
  }
  .door.live {
    border-color: color-mix(in srgb, var(--accent) 70%, transparent);
    box-shadow:
      0 2px 6px rgb(0 0 0 / 0.35),
      0 24px 60px color-mix(in srgb, var(--accent) 22%, transparent);
  }
  .copy {
    min-width: 0;
  }
  .group {
    margin-top: clamp(20px, 3vw, 36px);
  }
  .group-title {
    font-family: var(--font-body);
    font-size: clamp(1.3rem, 2.4vw, 1.7rem);
    font-weight: 800;
    letter-spacing: -0.02em;
    margin-bottom: 14px;
  }

  /* On air now: hero doors. An odd one out spans the full width. */
  .live-doors {
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 520px), 1fr));
  }
  .live-doors > :global(:nth-child(odd):last-child) {
    grid-column: 1 / -1;
  }
  .live-doors .door {
    min-height: clamp(300px, 34vw, 400px);
  }
  .live-doors :global(.emblem) {
    transform: scale(1.12);
    margin: 0 clamp(6px, 1.5vw, 20px);
  }
  /* A lone (full-width) live door gets the emblem at full hero scale. */
  .live-doors > :global(:nth-child(odd):last-child .emblem) {
    transform: scale(1.4);
    margin: 0 clamp(16px, 4vw, 56px);
  }
  .live-doors h3 {
    font-size: clamp(1.9rem, 3.4vw, 3rem);
  }
  .live-doors > :global(:nth-child(odd):last-child h3) {
    font-size: clamp(2.2rem, 5vw, 3.6rem);
  }
  .copy {
    flex: 1;
  }
  .enter {
    white-space: nowrap;
  }

  /* Everything that isn't on: a compact row, so an off night isn't six screens of closed doors. */
  .rest-doors {
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 330px), 1fr));
  }
  .rest-doors .door {
    min-height: 0;
    gap: 6px;
    padding: 18px 20px 20px;
    flex-direction: column;
    align-items: flex-start;
  }
  .rest-doors :global(.emblem) {
    transform: scale(0.62);
    transform-origin: left top;
    margin: -4px 0 -52px;
  }
  .rest-doors h3 {
    font-size: 1.45rem;
  }
  .aside {
    color: var(--muted);
    font-weight: 600;
    font-size: 0.7em;
    letter-spacing: 0;
  }

  .door h3 {
    font-size: clamp(1.8rem, 4.4vw, 2.8rem);
    margin-bottom: 0.3em;
  }
  .tagline {
    color: var(--muted);
    margin-bottom: 14px;
  }
  .when {
    margin: 0 0 6px;
    font-weight: 700;
  }
  .opens {
    margin: 0;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }
  .live .when {
    font-weight: 500;
    color: var(--muted);
    margin-bottom: 16px;
  }
  .enter {
    display: inline-flex;
    align-items: center;
    min-height: 48px;
    padding: 0 22px;
    border-radius: var(--radius-control);
    background: var(--accent);
    color: var(--accent-text);
    font-family: var(--font-display);
    font-size: 1.12rem;
  }

  /* The studio ON AIR lamp: lit while a show is on. It sits above the title, so a long name never runs under it. */
  .on-air {
    display: inline-block;
    margin-bottom: 14px;
    padding: 6px 12px 5px;
    border-radius: 6px;
    border: 2px solid #3a0b07;
    background: #e3261b;
    color: #fff4ef;
    font-family: system-ui, sans-serif;
    font-size: 0.82rem;
    font-weight: 900;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    box-shadow:
      0 2px 4px rgb(0 0 0 / 0.5),
      0 6px 22px rgb(227 38 27 / 0.55);
    animation: lamp 2.6s ease-in-out infinite;
  }
  @keyframes lamp-dot {
    50% {
      box-shadow: 0 0 0 6px rgb(255 59 48 / 0.08);
    }
  }

  /* Tonight's running order: a listings page, times on the left in the test-card colours. */
  .listings {
    margin-top: clamp(40px, 6vw, 72px);
  }
  .listings ol {
    list-style: none;
    margin: 0;
    padding: 0;
    border-top: 1px solid var(--border);
  }
  .listings li {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 2px;
    padding: 18px 0;
    border-bottom: 1px solid var(--border);
  }
  .slot-when {
    margin: 0;
    font-weight: 800;
    font-size: 0.82rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-variant-numeric: tabular-nums;
  }
  .listings li:nth-child(1) .slot-when {
    color: #f2c230;
  }
  .listings li:nth-child(2) .slot-when {
    color: #19d3c5;
  }
  .listings li:nth-child(3) .slot-when {
    color: #ff2e93;
  }
  .listings li:nth-child(4) .slot-when {
    color: #e6dfcd;
  }
  .listings h3 {
    font-family: var(--font-body);
    font-size: clamp(1.25rem, 2.4vw, 1.6rem);
    font-weight: 800;
    letter-spacing: -0.02em;
    margin: 0 0 4px;
  }
  .listings li p:not(.slot-when) {
    margin: 0;
    color: var(--muted);
    max-width: 62ch;
  }
  @media (min-width: 720px) {
    .listings li {
      grid-template-columns: 13rem minmax(0, 1fr);
      gap: 24px;
      padding: 22px 0;
    }
    .slot-when {
      padding-top: 0.5em;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .tonight .dot,
    .on-air {
      animation: none;
    }
  }

  @keyframes lamp {
    50% {
      background: #c81e15;
      box-shadow:
        0 2px 4px rgb(0 0 0 / 0.5),
        0 6px 12px rgb(227 38 27 / 0.3);
    }
  }

  /* Off air: faded, desaturated, plainly not a door you can open yet. */
  .door.off {
    cursor: default;
    box-shadow: none;
    border-style: dashed;
  }
  .door.off :global(.emblem) {
    filter: grayscale(0.85) brightness(0.7);
    opacity: 0.7;
  }
  .door.off h3,
  .door.off .copy {
    opacity: 0.78;
  }
  /* Still checking: a solid, quiet door, so it never reads as closed before we know. */
  .door.pending {
    cursor: progress;
    box-shadow: none;
  }
  .door.pending :global(.emblem),
  .door.pending .copy {
    opacity: 0.55;
  }

  .new-series {
    position: absolute;
    top: 18px;
    right: 18px;
    padding: 5px 12px;
    border-radius: var(--radius-control);
    background: var(--accent);
    color: var(--accent-text);
    font-family: var(--font-display);
    font-size: 0.95rem;
    transform: rotate(3deg);
    box-shadow: 0 3px 8px rgb(0 0 0 / 0.4);
  }

  @media (max-width: 560px) {
    .door {
      flex-direction: column;
      align-items: flex-start;
    }
    .door :global(.emblem) {
      align-self: center;
    }
  }
</style>
