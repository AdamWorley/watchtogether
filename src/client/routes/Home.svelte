<script lang="ts">
  import { shortName, SHOW_SLUGS, SHOWS, type ShowSlug } from '../../shared/shows';
  import { episodeWindow, liveEpisode, nextEpisode, type Episode } from '../../shared/window';
  import ChannelBadge from '../components/ChannelBadge.svelte';
  import WorldEmblem from '../components/WorldEmblem.svelte';
  import { getSchedule } from '../lib/api';
  import { useClock } from '../lib/clock.svelte';
  import { formatDuration, formatTime, formatWhen } from '../lib/format';
  import { VOICES } from '../lib/voice';

  const clock = useClock();
  // undefined = still loading, null = couldn't load (the door then stays a plain link).
  let schedules = $state<Partial<Record<ShowSlug, Episode[] | null>>>({});

  $effect(() => {
    for (const slug of SHOW_SLUGS) {
      getSchedule(slug)
        .then((s) => (schedules[slug] = s.episodes))
        .catch(() => (schedules[slug] = null));
    }
  });

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

  const liveCount = $derived(SHOW_SLUGS.filter((s) => doorState(s).kind === 'live').length);

  // Live shows first, then whatever airs soonest, then shows off the air.
  function rank(slug: ShowSlug): number {
    const d = doorState(slug);
    if (d.kind === 'live') return 0;
    if (d.kind === 'next') return 1 + Date.parse(d.episode.airstamp) / 1e15;
    if (d.kind === 'loading' || d.kind === 'unknown') return 3;
    return 4;
  }
  const ordered = $derived([...SHOW_SLUGS].sort((a, b) => rank(a) - rank(b)));
  // Doors that open (live, or schedule unknown) lead; everything else is "coming up".
  const opens = (slug: ShowSlug) => ['live', 'unknown'].includes(doorState(slug).kind);
  const liveSlugs = $derived(ordered.filter(opens));
  const restSlugs = $derived(ordered.filter((slug) => !opens(slug)));
</script>

<section class="container hero">
  <h1>The telly’s on. <span class="line2">Bring everyone.</span></h1>
  <div class="bars" aria-hidden="true">
    <span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span>
  </div>
  <p class="lead">
    Start a room when your show airs and share the invite link. Everyone gets their own bingo card and a live
    chat, whether they’re on your sofa or across the country. No sign-up, and rooms vanish an hour after the
    episode ends.
  </p>
  <p class="tonight" role="status">
    {#if liveCount > 0}
      <span class="dot" aria-hidden="true"></span>{liveCount === 1 ? 'One show' : `${liveCount} shows`} on air right
      now.
    {:else if SHOW_SLUGS.every((s) => doorState(s).kind !== 'loading')}
      Nothing on air right now. Rooms open 30 minutes before each episode.
    {/if}
  </p>
</section>

{#snippet door(slug: ShowSlug)}
  {@const d = doorState(slug)}
  {@const voice = VOICES[slug]}
  {#if d.kind === 'live' || d.kind === 'unknown'}
    <a class="door" class:live={d.kind === 'live'} href="/{slug}" data-world={SHOWS[slug].world}>
      {#if d.kind === 'live'}
        <span class="on-air" aria-hidden="true">On air</span>
      {/if}
      <WorldEmblem show={slug} />
      <div class="copy">
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
    <!-- Not on air: no rooms can exist yet, so the door is closed, not a link. -->
    <div class="door off" data-world={SHOWS[slug].world} aria-label="{SHOWS[slug].name}, not on air">
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

{#if liveSlugs.length > 0}
  <section class="container group" aria-labelledby="on-air-now">
    <h2 id="on-air-now" class="group-title">On air now</h2>
    <div class="doors live-doors">
      {#each liveSlugs as slug (slug)}{@render door(slug)}{/each}
    </div>
  </section>
{/if}

{#if restSlugs.length > 0}
  <section class="container group" aria-labelledby="coming-up">
    <h2 id="coming-up" class="group-title">{liveSlugs.length > 0 ? 'Coming up' : 'The shows'}</h2>
    <div class="doors rest-doors" class:compact={liveSlugs.length > 0}>
      {#each restSlugs as slug (slug)}{@render door(slug)}{/each}
    </div>
  </section>
{/if}

<style>
  .hero {
    padding-top: clamp(40px, 9vw, 110px);
    padding-bottom: clamp(24px, 4vw, 44px);
  }
  .hero h1 {
    font-size: clamp(3rem, 11vw, 7.2rem);
    font-weight: 800;
    letter-spacing: -0.04em;
    line-height: 0.92;
    max-width: 11ch;
    margin-bottom: 0.32em;
  }
  .line2 {
    display: block;
    color: #f2c230;
  }

  /* A telly test-card strip drawn from both worlds' colours. */
  .bars {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    width: min(100%, 560px);
    height: 14px;
    margin-bottom: 28px;
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
  .bars span:nth-child(8) {
    background: #a678ff;
  }

  .lead {
    font-size: clamp(1.05rem, 2vw, 1.25rem);
    max-width: 56ch;
    color: var(--muted);
  }
  .tonight {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 1.5em;
    margin: 18px 0 0;
    font-weight: 700;
  }
  .tonight .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
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

  /* Coming up: a compact secondary row. */
  .rest-doors.compact {
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 330px), 1fr));
  }
  .rest-doors.compact .door {
    min-height: 0;
    gap: 6px;
    padding: 18px 20px 20px;
    flex-direction: column;
    align-items: flex-start;
  }
  .rest-doors.compact :global(.emblem) {
    transform: scale(0.62);
    transform-origin: left top;
    margin: -4px 0 -52px;
  }
  .rest-doors.compact h3 {
    font-size: 1.45rem;
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

  /* The studio ON AIR lamp: lit while a show is on. */
  .on-air {
    position: absolute;
    top: 18px;
    right: 18px;
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
      padding-top: 56px;
    }
    .door :global(.emblem) {
      align-self: center;
    }
  }
</style>
