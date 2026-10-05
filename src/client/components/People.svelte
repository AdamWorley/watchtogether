<script lang="ts">
  import type { RoomConnection } from '../lib/room.svelte';

  interface Props {
    conn: RoomConnection;
    mask: ((text: string) => string) | null;
  }

  let { conn, mask }: Props = $props();
  let confirming = $state<string | null>(null);

  const show = (text: string) => (mask ? mask(text) : text);
  const isHost = $derived(conn.you?.host === true);
  const room = $derived(conn.room);

  function kick(id: string) {
    if (confirming !== id) {
      confirming = id;
      return;
    }
    conn.send({ t: 'kick', memberId: id });
    confirming = null;
  }

  function claimsFor(id: string): string[] {
    return conn.claims
      .filter((c) => c.memberId === id)
      .map((c) => (c.kind === 'line' ? 'LINE' : 'FULL HOUSE'));
  }
</script>

<ul aria-label="People in this room">
  {#each conn.members as m (m.id)}
    <li>
      <span class="dot" class:online={m.online} aria-hidden="true"></span>
      <span class="name" data-c={conn.slot(m.id)}>{show(m.name)}</span>
      <span class="sr-only">{m.online ? '(here now)' : '(away)'}</span>
      {#if m.host}<span class="tag">host</span>{/if}
      {#if m.id === conn.you?.id}<span class="tag">you</span>{/if}
      <span class="claims">
        {#each claimsFor(m.id) as claim (claim)}<span class="tag won">{claim}</span>{/each}
      </span>
      {#if isHost && m.id !== conn.you?.id}
        <button class="btn small danger" type="button" onclick={() => kick(m.id)}>
          {confirming === m.id ? 'Confirm removal' : 'Remove'}
        </button>
      {/if}
    </li>
  {/each}
</ul>

{#if isHost && room}
  <div class="host">
    <h3>Host controls</h3>
    <div class="controls">
      <button
        class="btn small secondary"
        type="button"
        onclick={() => conn.send({ t: 'lock', locked: !room.locked })}
      >
        {room.locked ? 'Unlock room' : 'Lock room'}
      </button>
      <button class="btn small secondary" type="button" onclick={() => conn.send({ t: 'rotate' })}>
        New code and link
      </button>
      <button
        class="btn small secondary"
        type="button"
        onclick={() => conn.send({ t: 'filter', enabled: !room.filter })}
      >
        {room.filter ? 'Turn swearing filter off' : 'Turn swearing filter on'}
      </button>
    </div>
    <p class="muted hint">
      Lock stops anyone new joining. A new code and link makes old links stop working; everyone already here
      stays. Removing someone ends their place in the room.
    </p>
  </div>
{/if}

<style>
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  li {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 0;
    border-bottom: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
    flex-wrap: wrap;
  }
  .dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--border);
    flex: none;
  }
  .dot.online {
    background: var(--ok);
  }
  .name {
    color: var(--person, var(--text));
    font-weight: 600;
    overflow-wrap: anywhere;
  }
  .tag {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--muted);
    border: 1px solid var(--border);
    border-radius: var(--radius-control);
    padding: 0 6px;
  }
  .won {
    color: var(--accent);
    border-color: currentColor;
  }
  .claims {
    display: inline-flex;
    gap: 4px;
    margin-left: auto;
  }
  .host {
    margin-top: 16px;
  }
  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .hint {
    font-size: 0.85rem;
    margin-top: 8px;
  }
</style>
