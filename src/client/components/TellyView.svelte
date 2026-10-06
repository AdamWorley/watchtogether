<script lang="ts">
  import { encode } from 'uqr';
  import { formatCode } from '../../shared/codes';
  import { SHOWS, type ShowSlug } from '../../shared/shows';
  import { useClock } from '../lib/clock.svelte';
  import { formatDuration, formatTime } from '../lib/format';
  import type { RoomConnection } from '../lib/room.svelte';
  import { roman } from '../lib/roman';
  import { COMMON, VOICES } from '../lib/voice';
  import Logo from './Logo.svelte';
  import WorldEmblem from './WorldEmblem.svelte';

  interface Props {
    conn: RoomConnection;
    show: ShowSlug;
    mask: ((text: string) => string) | null;
    onexit: () => void;
  }

  let { conn, show, mask, onexit }: Props = $props();

  const clock = useClock();
  const voice = $derived(VOICES[show]);
  const room = $derived(conn.room);
  const display = (text: string) => (mask ? mask(text) : text);
  const count = (n: number) => (voice.tally.roman ? (n ? roman(n) : '0') : String(n));

  // Leaderboard: full houses first, then lines, then most marked.
  const board = $derived(
    [...conn.members].sort((a, b) => {
      const score = (id: string, marked: number, best: number) => {
        const calls = conn.claims.filter((c) => c.memberId === id);
        return (
          (calls.some((c) => c.kind === 'house') ? 1000 : 0) +
          (calls.some((c) => c.kind === 'line') ? 100 : 0) +
          best * 10 +
          marked / 100
        );
      };
      return score(b.id, b.marked, b.best) - score(a.id, a.marked, a.best);
    }),
  );

  const joinUrl = $derived(room ? `${location.origin}/${show}/room#${formatCode(room.code)}` : '');
  const qr = $derived(joinUrl ? encode(joinUrl, { ecc: 'M' }) : null);
  const recent = $derived(conn.feed.slice(-5).reverse());

  $effect(() => {
    // Best effort: fill the screen. Some browsers refuse without a gesture; the view works either way.
    void document.documentElement.requestFullscreen?.().catch(() => {});
    const onkey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onexit();
    };
    window.addEventListener('keydown', onkey);
    return () => {
      window.removeEventListener('keydown', onkey);
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    };
  });
</script>

{#if room}
  <div class="telly" role="region" aria-label="Telly mode">
    <header class="telly-head">
      <WorldEmblem {show} />
      <div class="telly-title">
        <p class="telly-show">{SHOWS[show].name}</p>
        <h1>{room.episode.name || `Episode ${room.episode.number ?? ''}`}</h1>
        <p class="telly-meta">
          Room closes at {formatTime(room.closesAt)} · in {formatDuration(room.closesAt - clock.now)}
        </p>
      </div>
      <div class="telly-brand">
        <Logo label="WatchTogether" />
        <button class="btn secondary exit" type="button" onclick={onexit}>Leave telly mode</button>
      </div>
    </header>

    <div class="telly-body">
      <section class="board" aria-labelledby="board-title">
        <h2 id="board-title">{voice.board}</h2>
        <ol>
          {#each board as m (m.id)}
            {@const calls = conn.claims.filter((c) => c.memberId === m.id)}
            <li data-c={conn.slot(m.id)} class:away={!m.online}>
              <span class="who">{display(m.name)}</span>
              <span class="pips" aria-label="Best line: {m.best} of 5">
                {#each [1, 2, 3, 4, 5] as p (p)}<span class="pip" class:on={p <= m.best}></span>{/each}
              </span>
              <span class="progress"><strong>{count(m.marked)}</strong> {voice.tally.unit}</span>
              <span class="calls">
                {#each calls as c (c.kind)}<span class="call"
                    >{c.kind === 'line' ? 'LINE' : 'FULL HOUSE'}</span
                  >{/each}
              </span>
            </li>
          {/each}
        </ol>
      </section>

      <aside class="side">
        <section class="join card" aria-labelledby="join-title">
          <h2 id="join-title">Join on your phone</h2>
          {#if qr}
            <svg
              class="qr"
              viewBox="-2 -2 {qr.size + 4} {qr.size + 4}"
              role="img"
              aria-label="QR code for the invite link"
            >
              <rect x="-2" y="-2" width={qr.size + 4} height={qr.size + 4} fill="#fff" />
              {#each qr.data as row, y (y)}
                {#each row as dark, x (x)}
                  {#if dark}<rect {x} {y} width="1.02" height="1.02" fill="#000" />{/if}
                {/each}
              {/each}
            </svg>
          {/if}
          <p class="code">{formatCode(room.code)}</p>
          <p class="url">{location.host}/{show}/room</p>
        </section>

        <section class="feed card" aria-labelledby="feed-title">
          <h2 id="feed-title">Latest</h2>
          <ul>
            {#each recent as item (item.key)}
              <li>
                {#if item.kind === 'chat'}
                  <span class="who" data-c={conn.slot(item.entry.memberId)}>{display(item.entry.name)}</span>
                  {display(item.entry.text)}
                {:else if item.kind === 'claim'}
                  <strong>{voice.claim(display(item.claim.name), item.claim.kind, item.claim.first)}</strong>
                {:else if item.kind === 'system' && item.event === 'rotate'}
                  {COMMON.rotated}
                {:else if item.kind === 'system' && item.event === 'join'}
                  {voice.joined(display(item.name ?? 'Someone'))}
                {/if}
              </li>
            {:else}
              <li class="quiet">{voice.chatEmpty}</li>
            {/each}
          </ul>
        </section>
      </aside>
    </div>
  </div>
{/if}

<style>
  .telly {
    position: fixed;
    inset: 0;
    z-index: 45;
    display: flex;
    flex-direction: column;
    gap: 2vh;
    padding: 3vh 3vw;
    background: var(--bg);
    overflow: auto;
  }
  .telly-head {
    display: flex;
    align-items: center;
    gap: 2.5vw;
  }
  .telly-title {
    flex: 1;
    min-width: 0;
  }
  .telly-show {
    margin: 0;
    color: var(--muted);
    font-size: clamp(1rem, 1.6vw, 1.6rem);
  }
  .telly-title h1 {
    margin: 0.1em 0;
    font-size: clamp(2rem, 4.2vw, 4.4rem);
  }
  .telly-meta {
    margin: 0;
    color: var(--muted);
    font-size: clamp(1rem, 1.5vw, 1.5rem);
    font-variant-numeric: tabular-nums;
  }
  .telly-brand {
    align-self: flex-start;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 1.6vh;
    color: var(--text);
    --logo-height: clamp(28px, 3.2vw, 52px);
  }
  .telly-body {
    flex: 1;
    display: grid;
    grid-template-columns: minmax(0, 1.6fr) minmax(280px, 1fr);
    gap: 2.5vw;
    min-height: 0;
  }
  .board h2,
  .side h2 {
    font-size: clamp(1.4rem, 2.4vw, 2.4rem);
  }
  .board ol {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 1.2vh;
  }
  .board li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    grid-template-areas:
      'who pips tally'
      'calls calls calls';
    align-items: center;
    gap: 0.4vh 1.6vw;
    padding: 1.4vh 1.4vw;
    border-radius: var(--radius);
    background: var(--surface);
    border: var(--keyline) solid var(--border);
  }
  .board li.away {
    opacity: 0.55;
  }
  .board .who {
    grid-area: who;
    font-size: clamp(1.4rem, 2.6vw, 2.8rem);
    font-weight: 800;
    color: var(--person, var(--text));
    overflow-wrap: anywhere;
  }
  .pips {
    grid-area: pips;
    display: flex;
    gap: 0.5vw;
  }
  .pip {
    width: clamp(12px, 1.3vw, 22px);
    aspect-ratio: 1;
    border-radius: 50%;
    border: 2px solid var(--person, var(--accent));
  }
  .pip.on {
    background: var(--person, var(--accent));
  }
  .progress {
    grid-area: tally;
    font-size: clamp(1rem, 1.5vw, 1.5rem);
    color: var(--muted);
    white-space: nowrap;
  }
  .progress strong {
    font-family: var(--font-display);
    font-weight: 400;
    font-size: 1.8em;
    color: var(--text);
  }
  .calls {
    grid-area: calls;
    display: flex;
    gap: 8px;
  }
  .call {
    padding: 2px 10px;
    border-radius: var(--radius-control);
    background: var(--accent);
    color: var(--accent-text);
    font-family: var(--font-display);
    font-size: clamp(0.9rem, 1.2vw, 1.2rem);
  }
  .side {
    display: flex;
    flex-direction: column;
    gap: 2vh;
    min-height: 0;
  }
  .join {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .qr {
    width: min(100%, 30vh);
    height: auto;
    border-radius: 6px;
    shape-rendering: crispEdges;
  }
  .code {
    margin: 1.2vh 0 0;
    font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
    font-size: clamp(1.6rem, 2.8vw, 2.8rem);
    letter-spacing: 0.08em;
  }
  .url {
    margin: 0;
    color: var(--muted);
    font-size: clamp(0.9rem, 1.3vw, 1.3rem);
  }
  .feed {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
  .feed ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 1vh;
    font-size: clamp(1rem, 1.6vw, 1.6rem);
    line-height: 1.3;
  }
  .feed .who {
    font-weight: 800;
    color: var(--person, var(--text));
    margin-right: 0.4em;
  }
  .quiet {
    color: var(--muted);
    font-style: italic;
  }
  @media (max-width: 899px) {
    .telly-body {
      grid-template-columns: 1fr;
    }
    .telly-head :global(.emblem) {
      display: none;
    }
  }
</style>
