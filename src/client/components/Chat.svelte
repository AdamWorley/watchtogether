<script lang="ts">
  import { CHAT_MAX } from '../../shared/protocol';
  import { cleanText, textLength } from '../../shared/sanitize';
  import type { ShowSlug } from '../../shared/shows';
  import { formatTime } from '../lib/format';
  import type { FeedItem, RoomConnection } from '../lib/room.svelte';
  import { COMMON, VOICES } from '../lib/voice';

  interface Props {
    conn: RoomConnection;
    show: ShowSlug;
    /** Display-only masking function, present when the room's profanity filter is on. */
    mask: ((text: string) => string) | null;
  }

  let { conn, show, mask }: Props = $props();
  const voice = $derived(VOICES[show]);

  let draft = $state('');
  let list: HTMLOListElement | undefined = $state();
  let stick = true;

  const cleaned = $derived(cleanText(draft));
  const canSend = $derived(
    textLength(cleaned) >= 1 && textLength(cleaned) <= CHAT_MAX && conn.status === 'open',
  );
  const display = (text: string) => (mask ? mask(text) : text);

  function systemLine(item: Extract<FeedItem, { kind: 'system' }>): string {
    const name = display(item.name ?? 'Someone');
    switch (item.event) {
      case 'join':
        return voice.joined(name);
      case 'kick':
        return voice.removed(name);
      case 'lock':
        return voice.locked;
      case 'unlock':
        return voice.unlocked;
      case 'rotate':
        return COMMON.rotated;
      case 'filter':
        return voice.filter(item.filterOn ?? true);
    }
  }

  function onscroll() {
    if (!list) return;
    stick = list.scrollHeight - list.scrollTop - list.clientHeight < 40;
  }

  $effect(() => {
    void conn.feed.length;
    if (list && stick) list.scrollTop = list.scrollHeight;
  });

  function send(event: SubmitEvent) {
    event.preventDefault();
    if (!canSend) return;
    if (conn.send({ t: 'chat', text: cleaned })) {
      draft = '';
      stick = true;
    }
  }
</script>

<div class="chat">
  <ol bind:this={list} {onscroll} aria-live="polite" aria-label="Chat messages">
    {#each conn.feed as item (item.key)}
      {#if item.kind === 'chat'}
        <li class:mine={item.entry.memberId === conn.you?.id}>
          <span class="who" data-c={conn.slot(item.entry.memberId)}>{display(item.entry.name)}</span>
          <time class="when">{formatTime(item.entry.at)}</time>
          <p class="text">{display(item.entry.text)}</p>
        </li>
      {:else if item.kind === 'claim'}
        <li class="claim">{voice.claim(display(item.claim.name), item.claim.kind, item.claim.first)}</li>
      {:else if item.kind === 'system'}
        <li class="system">{systemLine(item)}</li>
      {/if}
    {:else}
      <li class="system">{voice.chatEmpty}</li>
    {/each}
  </ol>
  <form onsubmit={send}>
    <label class="sr-only" for="chat-input">Message</label>
    <input
      id="chat-input"
      type="text"
      bind:value={draft}
      maxlength={CHAT_MAX * 2}
      autocomplete="off"
      enterkeyhint="send"
      placeholder={conn.status === 'open' ? voice.chatPlaceholder : 'Reconnecting…'}
    />
    <button class="btn" type="submit" disabled={conn.status !== 'open'}>Send</button>
  </form>
</div>

<style>
  .chat {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }
  ol {
    list-style: none;
    margin: 0;
    padding: 4px 2px;
    overflow-y: auto;
    flex: 1;
    min-height: 0;
    overscroll-behavior: contain;
  }
  li {
    padding: 6px 4px;
    border-bottom: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
  }
  .who {
    font-weight: 700;
  }
  .who {
    color: var(--person, var(--text));
  }
  .when {
    color: var(--muted);
    font-size: 0.75rem;
    margin-left: 6px;
  }
  .text {
    margin: 2px 0 0;
    overflow-wrap: anywhere;
    white-space: pre-wrap;
  }
  .system {
    color: var(--muted);
    font-style: italic;
    font-size: 0.9rem;
  }
  .claim {
    color: var(--accent);
  }
  form {
    display: flex;
    gap: 8px;
    padding-top: 8px;
  }
  input {
    flex: 1;
    min-width: 0;
  }
</style>
