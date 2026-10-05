<script lang="ts">
  import { FREE_CELL, LINES } from '../../shared/bingo';
  import { formatCode } from '../../shared/codes';
  import { SHOWS, type ShowSlug } from '../../shared/shows';
  import { formatDuration, formatTime } from '../lib/format';
  import type { RoomConnection } from '../lib/room.svelte';
  import { roman } from '../lib/roman';
  import { VOICES } from '../lib/voice';

  interface Props {
    conn: RoomConnection;
    show: ShowSlug;
    now: number;
    copied: boolean;
    onshare: () => void;
  }

  let { conn, show, now, copied, onshare }: Props = $props();

  const room = $derived(conn.room);
  const count = $derived(conn.marks.length);
  // Closest line: the most marked squares in any single line (the FREE centre counts).
  const best = $derived(
    Math.max(...LINES.map((line) => line.filter((c) => c === FREE_CELL || conn.marks.includes(c)).length)),
  );
  const online = $derived(conn.members.filter((m) => m.online).length);
  const voice = $derived(VOICES[show]);
  const tally = $derived(voice.tally.roman ? (count === 0 ? '0' : roman(count)) : String(count));
  const of = $derived(voice.tally.roman ? 'XXIV' : '24');
  const unit = $derived(voice.tally.unit);
</script>

<!-- Large screens only: the room's world sidebar. Styled per world in src/client/themes. -->
{#if room}
  <aside class="rail" aria-label="Room details">
    <div class="rail-head" aria-hidden="true"></div>
    <a class="back rail-show" href="/{show}">{SHOWS[show].name}</a>
    <h1 class="rail-title">{room.episode.name || `Episode ${room.episode.number ?? ''}`}</h1>
    <p class="rail-meta">
      Closes at {formatTime(room.closesAt)}<br />in {formatDuration(room.closesAt - now)}
    </p>

    <div class="tally" role="group" aria-label="Your progress">
      <p class="tally-num"><span>{tally}</span> <small>of {of}</small></p>
      <p class="tally-unit">{unit}</p>
      <p class="tally-line">
        {best >= 5
          ? 'You have a line. Call it!'
          : best === 4
            ? 'One away from a line'
            : `Best line: ${best} of 5`}
      </p>
    </div>

    {#if voice.tally.roman}
      <!-- Traitors: the face-down cards still to be turned, as a deck on the table. -->
      <div class="deck">
        <div class="deck-stack" aria-hidden="true"><span></span><span></span><span></span></div>
        <p class="deck-count">
          <span>{24 - count === 0 ? 'None' : roman(24 - count)}</span> still face down
        </p>
      </div>
    {/if}

    <dl class="facts">
      <div>
        <dt>In the room</dt>
        <dd>{online} here now</dd>
      </div>
      {#if room.locked}<div>
          <dt>Door</dt>
          <dd>Locked to new people</dd>
        </div>{/if}
    </dl>

    <div class="rail-share">
      <span class="rail-code" aria-label="Room code">{formatCode(room.code)}</span>
      <button class="btn" type="button" onclick={onshare}>
        {copied ? 'Invite link copied' : 'Share invite link'}
      </button>
    </div>
  </aside>
{/if}

<style>
  .rail {
    position: sticky;
    top: 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 0 22px 24px;
    overflow: hidden;
    isolation: isolate;
  }
  .rail-head {
    height: 18px;
    margin: 0 -22px 6px;
  }
  .rail-title {
    font-size: 2rem;
    margin: 0;
    overflow-wrap: anywhere;
  }
  .rail-meta {
    margin: 0;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }
  .tally {
    padding: 18px 16px;
    text-align: center;
  }
  .tally p {
    margin: 0;
  }
  .tally-num {
    font-family: var(--font-display);
    line-height: 1;
  }
  .tally-num span {
    font-size: 3.4rem;
  }
  .tally-num small {
    font-size: 1.05rem;
    color: var(--muted);
  }
  .tally-unit {
    margin-top: 4px !important;
    font-family: var(--font-display);
    font-size: 1.05rem;
  }
  .tally-line {
    margin-top: 10px !important;
    font-size: 0.9rem;
    font-weight: 600;
  }
  .deck {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .deck-stack {
    position: relative;
    width: 44px;
    height: 62px;
    flex: none;
  }
  .deck-count {
    margin: 0;
    font-family: var(--font-display);
    font-size: 1rem;
    line-height: 1.2;
  }
  .facts {
    margin: 0;
    display: grid;
    gap: 8px;
  }
  .facts div {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    font-size: 0.9rem;
  }
  .facts dt {
    color: var(--muted);
  }
  .facts dd {
    margin: 0;
    font-weight: 600;
  }
  .rail-share {
    display: grid;
    gap: 10px;
    margin-top: 4px;
  }
  .rail-code {
    text-align: center;
    font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.1em;
    font-size: 1.15rem;
    padding: 10px;
    background: var(--surface-2);
    border: var(--keyline) solid var(--border);
    border-radius: var(--radius-input, 8px);
  }
</style>
