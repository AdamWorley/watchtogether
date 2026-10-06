<script lang="ts">
  import { SHOWS, type ShowSlug } from '../../shared/shows';
  import { episodeWindow, liveEpisode, nextEpisode, type Episode } from '../../shared/window';
  import JoinCodeForm from '../components/JoinCodeForm.svelte';
  import NameForm from '../components/NameForm.svelte';
  import WorldEmblem from '../components/WorldEmblem.svelte';
  import CardTaster from '../components/CardTaster.svelte';
  import ChannelBadge from '../components/ChannelBadge.svelte';
  import { createRoom, errorMessage, getSchedule } from '../lib/api';
  import { useClock } from '../lib/clock.svelte';
  import { formatDuration, formatTime, formatWhen } from '../lib/format';
  import { router } from '../lib/router.svelte';
  import { saveSession } from '../lib/session';
  import { VOICES } from '../lib/voice';

  let { show }: { show: ShowSlug } = $props();

  const clock = useClock();
  const voice = $derived(VOICES[show]);
  let episodes = $state<Episode[] | null>(null);
  let loadError = $state(false);
  let busy = $state(false);
  let createError = $state<string | null>(null);

  $effect(() => {
    getSchedule(show)
      .then((s) => (episodes = s.episodes))
      .catch(() => (loadError = true));
  });

  const live = $derived(episodes ? liveEpisode(episodes, clock.now) : undefined);
  const next = $derived(episodes ? nextEpisode(episodes, clock.now) : undefined);

  function label(ep: Episode): string {
    // Non-breaking spaces keep "Series 2" and "episode 3" together when the heading wraps.
    const num = ep.number === null ? 'Special' : `Series\u00a0${ep.season}, episode\u00a0${ep.number}`;
    // TVmaze often names episodes just "Episode 3"; don't repeat it.
    return ep.name && !/^episode \d+$/i.test(ep.name) ? `${num}: ${ep.name}` : num;
  }

  async function start(name: string) {
    busy = true;
    createError = null;
    try {
      const session = await createRoom(show, name);
      saveSession(session);
      router.navigate(`/${session.show}/room#${session.code}`);
    } catch (err) {
      createError = errorMessage(err);
    } finally {
      busy = false;
    }
  }
</script>

<section class="container hero">
  <div class="intro">
    <h1>{SHOWS[show].name}</h1>
    <p class="muted tagline">{voice.tagline}</p>
    <ChannelBadge {show} />
  </div>
  <WorldEmblem {show} />
</section>

<section class="container layout">
  <div class="card">
    {#if episodes === null && !loadError}
      <p class="muted">Checking tonight’s schedule…</p>
    {:else if live}
      {@const w = episodeWindow(live)}
      <h2>On now: {label(live)}</h2>
      <p class="muted">{voice.liveBlurb(formatTime(w.closesAt))}</p>
      <NameForm
        submitLabel="Start a room"
        busyLabel="Starting your room…"
        placeholder={voice.namePlaceholder}
        {busy}
        error={createError}
        onsubmit={start}
      />
    {:else if next}
      {@const w = episodeWindow(next)}
      <h2>{voice.nextHeading}</h2>
      <p>{label(next)}</p>
      <p class="muted">
        Airs {formatWhen(Date.parse(next.airstamp), clock.now)}. Rooms open at {formatTime(w.opensAt)}, 30
        minutes before.
      </p>
      <p class="countdown" aria-live="off">
        <span class="countdown-label">Rooms open in</span>
        {formatDuration(w.opensAt - clock.now)}
      </p>
    {:else}
      {#if loadError}
        <h2>Schedule unavailable</h2>
        <p class="muted">
          We couldn’t load the air times just now. Refresh to try again. If a friend has sent you a room code,
          you can still join below.
        </p>
      {:else}
        <h2>{voice.dark.heading}</h2>
        <p class="muted">{voice.dark.body}</p>
      {/if}
    {/if}
  </div>

  <div class="card">
    <h2>{voice.joinCard.heading}</h2>
    <p class="muted">{voice.joinCard.body}</p>
    <JoinCodeForm {show} />
  </div>
</section>

<CardTaster {show} />

<style>
  .hero {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 24px;
    padding-top: clamp(20px, 5vw, 48px);
    padding-bottom: 24px;
  }
  .intro {
    min-width: 0;
  }
  .hero h1 {
    font-size: clamp(2.2rem, 8vw, 4.2rem);
  }
  /* Large screens: the world's emblem steps up to stage scale. */
  @media (min-width: 1100px) {
    .hero :global(.emblem) {
      transform: scale(1.55);
      transform-origin: right bottom;
      /* room above for the scaled emblem, so it never runs off the top of the page */
      margin: 90px 0 0 80px;
    }
  }
  @media (max-width: 560px) {
    .hero {
      flex-direction: column-reverse;
      align-items: flex-start;
      gap: 8px;
    }
    .hero :global(.emblem) {
      align-self: center;
      transform: scale(0.82);
      margin: -12px 0 -8px;
    }
  }
  .layout {
    display: grid;
    gap: 16px;
    grid-template-columns: 1fr;
  }
  @media (min-width: 800px) {
    .layout {
      grid-template-columns: 3fr 2fr;
      align-items: start;
    }
  }
  .tagline {
    max-width: 60ch;
  }
  /* One line: "Rooms open in 2d 23h" (no label stacked above the number). */
  .countdown-label {
    font-family: var(--font-body);
    font-size: 0.4em;
    font-weight: 700;
    color: var(--text);
    margin-right: 0.3em;
    vertical-align: middle;
  }
  .countdown {
    font-family: var(--font-display);
    font-size: clamp(2rem, 8vw, 3.25rem);
    font-variant-numeric: tabular-nums;
    color: var(--accent);
    margin: 0;
  }
</style>
