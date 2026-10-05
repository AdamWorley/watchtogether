<script lang="ts">
  import { hasLine, isFullHouse } from '../../shared/bingo';
  import { formatCode } from '../../shared/codes';
  import { SHOWS, type ShowSlug } from '../../shared/shows';
  import { useClock } from '../lib/clock.svelte';
  import { formatDuration, formatTime } from '../lib/format';
  import type { RoomConnection } from '../lib/room.svelte';
  import { loadSquares } from '../lib/squares';
  import { COMMON, VOICES } from '../lib/voice';
  import BingoCard from './BingoCard.svelte';
  import Chat from './Chat.svelte';
  import People from './People.svelte';
  import RoomRail from './RoomRail.svelte';

  let { conn, show }: { conn: RoomConnection; show: ShowSlug } = $props();

  const clock = useClock();
  const voice = $derived(VOICES[show]);
  let squares = $state<readonly string[] | null>(null);
  $effect(() => {
    let cancelled = false;
    loadSquares(show)
      .then((pool) => {
        if (!cancelled) squares = pool;
      })
      .catch(() => {
        // Offline mid-load: the card renders '?' squares until a refresh.
        if (!cancelled) squares = [];
      });
    return () => {
      cancelled = true;
    };
  });
  const room = $derived(conn.room);
  const canLine = $derived(hasLine(conn.marks));
  const canHouse = $derived(isFullHouse(conn.marks));
  const myClaims = $derived(
    new Set(conn.claims.filter((c) => c.memberId === conn.you?.id).map((c) => c.kind)),
  );
  const online = $derived(conn.members.filter((m) => m.online).length);

  type Tab = 'card' | 'chat' | 'people';
  let tab = $state<Tab>('card');
  let tabsEl: HTMLElement | undefined = $state();
  let layoutEl: HTMLElement | undefined = $state();

  // On phones, opening a tab lines its panel up directly under the sticky tabs (the header scrolls away),
  // wherever the page was scrolled to before.
  function openTab(next: Tab) {
    tab = next;
    if (!tabsEl || !layoutEl || !matchMedia('(max-width: 899px)').matches) return;
    const panelTop = window.scrollY + layoutEl.getBoundingClientRect().top;
    window.scrollTo({ top: Math.max(0, panelTop - tabsEl.offsetHeight), behavior: 'instant' });
  }
  let copied = $state(false);
  let unread = $state(0);
  let seen = -1;

  // Profanity masking is display-only and lazily loaded so it never slows the first page load.
  let mask = $state<((text: string) => string) | null>(null);
  $effect(() => {
    if (!room?.filter) {
      mask = null;
      return;
    }
    let cancelled = false;
    import('../lib/profanity')
      .then((m) => {
        if (!cancelled) mask = m.mask;
      })
      .catch(() => {
        // Filter unavailable: show text unmasked rather than break chat.
      });
    return () => {
      cancelled = true;
    };
  });

  $effect(() => {
    const n = conn.feed.length;
    if (seen < 0 || tab === 'chat') unread = 0;
    else if (n > seen) unread += n - seen;
    seen = n;
  });

  // Claim banner: show the evidence card for a few seconds, and play the world's one full-card event.
  let banner = $state<typeof conn.latestClaim>(null);
  let event = $state(false);
  $effect(() => {
    const claim = conn.latestClaim;
    if (!claim) return;
    banner = claim;
    event = true;
    const e = setTimeout(() => (event = false), 1100);
    const t = setTimeout(() => (banner = null), 8000);
    return () => {
      clearTimeout(e);
      clearTimeout(t);
    };
  });

  const mySlot = $derived(conn.you ? conn.slot(conn.you.id) : 0);

  // Transient notices from the server (rate limits, bad claims).
  $effect(() => {
    if (!conn.notice) return;
    const t = setTimeout(() => (conn.notice = null), 3500);
    return () => clearTimeout(t);
  });

  const shareUrl = $derived(room ? `${location.origin}/${show}/room#${formatCode(room.code)}` : '');

  async function share() {
    if (!room) return;
    const data = {
      title: `${SHOWS[show].name} on WatchTogether`,
      text: voice.shareText,
      url: shareUrl,
    };
    try {
      if (navigator.share && matchMedia('(pointer: coarse)').matches) {
        await navigator.share(data);
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      copied = true;
      setTimeout(() => (copied = false), 2000);
    } catch {
      // user cancelled the share sheet, or clipboard blocked
    }
  }

  const display = (text: string) => (mask ? mask(text) : text);

  const noticeText = $derived(
    conn.notice === 'rate_limited'
      ? voice.rateLimited
      : conn.notice === 'bad_claim'
        ? voice.badClaim
        : conn.notice === 'already_claimed'
          ? COMMON.alreadyClaimed
          : null,
  );
</script>

{#if room && squares}
  <header class="container top">
    <div class="title">
      <a class="back" href="/{show}">{SHOWS[show].name}</a>
      <h1>{room.episode.name || `Episode ${room.episode.number ?? ''}`}</h1>
      <p class="muted meta">
        {online} in the room · Closes at {formatTime(room.closesAt)} (in {formatDuration(
          room.closesAt - clock.now,
        )})
        {#if room.locked}· Locked to new people{/if}
        {#if conn.status !== 'open'}<span class="warn">· Connection lost, reconnecting…</span>{/if}
      </p>
    </div>
    <div class="share">
      <span class="code" aria-label="Room code">{formatCode(room.code)}</span>
      <button class="btn small" type="button" onclick={share}>
        {copied ? 'Invite link copied' : 'Share invite link'}
      </button>
    </div>
  </header>

  <nav class="container tabs" aria-label="Room sections" bind:this={tabsEl}>
    <button
      type="button"
      class:active={tab === 'card'}
      aria-pressed={tab === 'card'}
      onclick={() => openTab('card')}
    >
      Bingo
    </button>
    <button
      type="button"
      class:active={tab === 'chat'}
      aria-pressed={tab === 'chat'}
      onclick={() => openTab('chat')}
    >
      Chat{#if unread > 0}<span class="badge">{unread > 99 ? '99+' : unread}</span>{/if}
    </button>
    <button
      type="button"
      class:active={tab === 'people'}
      aria-pressed={tab === 'people'}
      onclick={() => openTab('people')}
    >
      People ({conn.members.length})
    </button>
  </nav>

  <div class="container layout" data-tab={tab} bind:this={layoutEl}>
    <div class="rail-col" data-c={mySlot}>
      <RoomRail {conn} {show} now={clock.now} {copied} onshare={share} />
    </div>
    <section class="panel card-panel" aria-label="Your bingo card" data-c={mySlot}>
      <BingoCard
        card={conn.card}
        marks={conn.marks}
        {squares}
        {show}
        {event}
        label="Your bingo card"
        ontoggle={(cell: number) => conn.toggle(cell)}
      />
      <div class="calls">
        <button
          class="btn"
          type="button"
          disabled={!canLine || myClaims.has('line')}
          onclick={() => conn.send({ t: 'claim', kind: 'line' })}
        >
          {myClaims.has('line') ? 'LINE called' : 'Call LINE!'}
        </button>
        <button
          class="btn"
          type="button"
          disabled={!canHouse || myClaims.has('house')}
          onclick={() => conn.send({ t: 'claim', kind: 'house' })}
        >
          {myClaims.has('house') ? 'FULL HOUSE called' : 'Call FULL HOUSE!'}
        </button>
      </div>
      <p class="muted hint">
        {voice.hint}
      </p>
    </section>

    <section class="panel chat-panel card" aria-label="Chat">
      <Chat {conn} {show} {mask} />
    </section>

    <section class="panel people-panel card" aria-label="People">
      <People {conn} {mask} />
    </section>
  </div>

  {#if banner}
    <div class="banner card" role="status" data-c={conn.slot(banner.memberId)}>
      <p>{voice.claim(display(banner.name), banner.kind, banner.first)}</p>
      <BingoCard
        card={banner.card}
        marks={banner.marks}
        {squares}
        {show}
        {event}
        compact
        label="{display(banner.name)}'s card"
      />
      <button class="btn small secondary" type="button" onclick={() => (banner = null)}>Dismiss</button>
    </div>
  {/if}

  {#if noticeText}
    <div class="toast" role="status">{noticeText}</div>
  {/if}
{:else}
  <p class="container muted connecting" role="status">{voice.connecting}</p>
{/if}

<style>
  .top {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
    padding-top: 16px;
    padding-bottom: 8px;
  }
  .title {
    min-width: 0;
  }
  .title h1 {
    font-size: clamp(1.5rem, 5vw, 2.3rem);
    margin: 2px 0 2px;
    overflow-wrap: anywhere;
  }
  .meta {
    margin: 0;
    font-size: 0.9rem;
  }
  .warn {
    color: var(--danger);
  }
  .share {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .code {
    font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.08em;
    background: var(--surface-2);
    border: var(--keyline) solid var(--border);
    padding: 8px 12px;
    border-radius: var(--radius-input, 8px);
    white-space: nowrap;
  }

  .tabs {
    display: flex;
    gap: 4px;
    position: sticky;
    top: 0;
    z-index: 5;
    background: var(--bg);
    padding-top: 6px;
    padding-bottom: 6px;
  }
  .tabs button {
    flex: 1;
    min-height: 46px;
    border: var(--keyline) solid var(--border);
    background: var(--surface);
    color: var(--text);
    font: inherit;
    font-family: var(--font-display);
    font-size: 1.05rem;
    border-radius: var(--radius-control);
    cursor: pointer;
  }
  .tabs button.active {
    background: var(--accent);
    color: var(--accent-text);
    border-color: transparent;
  }
  .badge {
    display: inline-block;
    margin-left: 6px;
    min-width: 20px;
    padding: 0 6px;
    border-radius: var(--radius-control);
    background: var(--danger);
    /* dark ink: every world's --danger is a light coral/pink, so white text fails contrast (~2.5:1) */
    color: #1c0b08;
    font-weight: 800;
    font-size: 0.75rem;
    line-height: 20px;
  }

  .layout {
    display: grid;
    gap: 16px;
    padding-top: 8px;
  }
  .panel {
    min-width: 0;
  }
  /* Phones: the chat fills the screen below the sticky tabs, so the composer is always in reach. */
  .chat-panel {
    height: calc(100dvh - 76px);
    display: flex;
    flex-direction: column;
    padding: 12px;
  }
  /* Phones: one tab at a time. */
  .layout[data-tab='card'] .chat-panel,
  .layout[data-tab='card'] .people-panel,
  .layout[data-tab='chat'] .card-panel,
  .layout[data-tab='chat'] .people-panel,
  .layout[data-tab='people'] .card-panel,
  .layout[data-tab='people'] .chat-panel {
    display: none;
  }
  /* Desktop: card and chat side by side, people underneath chat. */
  @media (min-width: 900px) {
    .tabs {
      display: none;
    }
    .layout {
      grid-template-columns: minmax(0, 3fr) minmax(320px, 2fr);
      grid-template-areas:
        'card chat'
        'card people';
      align-items: start;
    }
    .layout .panel {
      display: flex !important;
    }
    .card-panel {
      grid-area: card;
      flex-direction: column;
    }
    .chat-panel {
      grid-area: chat;
      height: min(70dvh, 640px);
    }
    .people-panel {
      grid-area: people;
      flex-direction: column;
    }
  }

  .rail-col {
    display: none;
  }
  /* Large screens: the world sidebar takes the header's job, and the room becomes three columns. */
  @media (min-width: 1200px) {
    .top {
      display: none;
    }
    .layout {
      max-width: 1440px;
      padding-top: 24px;
      grid-template-columns: 280px minmax(0, 1fr) minmax(320px, 380px);
      grid-template-areas:
        'rail card chat'
        'rail card people';
      gap: 24px;
    }
    .rail-col {
      display: block;
      grid-area: rail;
      align-self: stretch;
    }
  }

  .calls {
    display: flex;
    gap: 8px;
    justify-content: center;
    flex-wrap: wrap;
    margin-top: 14px;
  }
  .hint {
    text-align: center;
    font-size: 0.85rem;
    margin-top: 10px;
  }

  .banner {
    position: fixed;
    left: 50%;
    bottom: max(16px, env(safe-area-inset-bottom));
    transform: translateX(-50%);
    width: min(360px, calc(100vw - 32px));
    z-index: 20;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    animation: pop 0.25s ease-out;
  }
  .banner p {
    margin: 0;
    font-family: var(--font-display);
    font-size: 1.4rem;
    line-height: 1.2;
    text-wrap: balance;
  }
  /* Phones: the claim is a bottom sheet that owns the bottom edge (no controls peeking beneath). */
  @media (max-width: 599px) {
    .banner {
      left: 0;
      right: 0;
      bottom: 0;
      width: auto;
      transform: none;
      border-radius: var(--radius) var(--radius) 0 0;
      padding-bottom: max(20px, env(safe-area-inset-bottom));
      animation-name: sheet;
    }
  }
  @keyframes sheet {
    from {
      transform: translateY(24px);
      opacity: 0;
    }
  }
  .toast {
    position: fixed;
    left: 50%;
    top: 12px;
    transform: translateX(-50%);
    z-index: 30;
    background: var(--text);
    color: var(--bg);
    padding: 8px 14px;
    border-radius: var(--radius-control);
    font-weight: 600;
    max-width: calc(100vw - 32px);
  }
  .connecting {
    padding-top: 48px;
  }
  @keyframes pop {
    from {
      transform: translate(-50%, 12px);
      opacity: 0;
    }
  }
</style>
