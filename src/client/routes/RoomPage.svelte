<script lang="ts">
  import { onMount } from 'svelte';
  import { normaliseCode } from '../../shared/codes';
  import { SHOWS, type ShowSlug } from '../../shared/shows';
  import JoinCodeForm from '../components/JoinCodeForm.svelte';
  import NameForm from '../components/NameForm.svelte';
  import Room from '../components/Room.svelte';
  import WorldEmblem from '../components/WorldEmblem.svelte';
  import { errorMessage, joinRoom } from '../lib/api';
  import { RoomConnection } from '../lib/room.svelte';
  import { router } from '../lib/router.svelte';
  import { clearSession, loadSession, saveSession, type Session } from '../lib/session';
  import { keepsakeFrom, saveKeepsake } from '../lib/keepsake';
  import { VOICES } from '../lib/voice';

  let { show }: { show: ShowSlug } = $props();

  const voice = $derived(VOICES[show]);
  let code = $state(readCode());
  let conn = $state<RoomConnection | null>(null);
  let busy = $state(false);
  let joinError = $state<string | null>(null);

  function readCode(): string | null {
    try {
      return normaliseCode(decodeURIComponent(location.hash.slice(1)));
    } catch {
      return null; // malformed %-escape in a hand-edited link
    }
  }

  function start(session: Session) {
    conn?.dispose();
    conn = new RoomConnection(session);
  }

  onMount(() => {
    // Resume this tab's session if it belongs to the code in the link.
    const session = loadSession();
    if (code && session?.code === code && session.show === show) start(session);

    // A different link pasted into the address bar.
    const onhash = () => {
      const next = readCode();
      if (next === code) return;
      conn?.dispose();
      conn = null;
      code = next;
      const stored = loadSession();
      if (code && stored?.code === code && stored.show === show) start(stored);
    };
    window.addEventListener('hashchange', onhash);
    return () => {
      window.removeEventListener('hashchange', onhash);
      conn?.dispose();
    };
  });

  // Keep the URL and stored session in step when the host rotates the code.
  $effect(() => {
    const current = conn?.room?.code;
    if (!current || current === code) return;
    code = current;
    history.replaceState(null, '', `/${show}/room#${current}`);
    const session = loadSession();
    if (session) saveSession({ ...session, code: current });
  });

  $effect(() => {
    if (conn && ['ended', 'kicked', 'unauthorised'].includes(conn.status)) clearSession();
  });

  async function join(name: string) {
    if (!code) return;
    busy = true;
    joinError = null;
    try {
      const session = await joinRoom(code, name);
      saveSession(session);
      if (session.show !== show) {
        router.navigate(`/${session.show}/room#${session.code}`, { replace: true });
        return;
      }
      start(session);
    } catch (err) {
      joinError = errorMessage(err);
    } finally {
      busy = false;
    }
  }

  let saving = $state(false);
  async function keepsake() {
    const input = conn ? keepsakeFrom(conn, show) : null;
    if (!input || saving) return;
    saving = true;
    try {
      await saveKeepsake(input);
    } finally {
      saving = false;
    }
  }

  function rejoin() {
    conn?.dispose();
    conn = null;
  }
</script>

{#if conn && conn.status === 'ended'}
  <section class="container narrow card done">
    <div class="world-mark"><WorldEmblem {show} /></div>
    <h1>{voice.ended.heading}</h1>
    <p class="muted">{voice.ended.body}</p>
    <p class="muted">
      Your card is still on this screen. Save it before you go: it’s drawn on your phone and never uploaded.
    </p>
    <div class="end-actions">
      <button class="btn" type="button" onclick={keepsake} disabled={saving}>
        {saving ? 'Drawing your card…' : 'Save my card'}
      </button>
      <a class="btn secondary" href="/{show}">Back to {SHOWS[show].name}</a>
    </div>
  </section>
{:else if conn && conn.status === 'kicked'}
  <section class="container narrow card done">
    <div class="world-mark"><WorldEmblem {show} /></div>
    <h1>{voice.kicked.heading}</h1>
    <p class="muted">{voice.kicked.body}</p>
    <a class="btn secondary" href="/{show}">Back to {SHOWS[show].name}</a>
  </section>
{:else if conn && conn.status === 'unauthorised'}
  <section class="container narrow card done">
    <div class="world-mark"><WorldEmblem {show} /></div>
    <h1>{voice.rejoin.heading}</h1>
    <p class="muted">{voice.rejoin.body}</p>
    <button class="btn" type="button" onclick={rejoin}>Join again</button>
  </section>
{:else if conn}
  <Room {conn} {show} />
{:else if !code}
  <section class="container narrow card">
    <div class="world-mark"><WorldEmblem {show} /></div>
    <h1>{voice.noCode.heading}</h1>
    <p class="muted">{voice.noCode.body}</p>
    <JoinCodeForm {show} />
  </section>
{:else}
  <section class="container narrow card">
    <div class="world-mark"><WorldEmblem {show} /></div>
    <h1>{voice.joinPage.heading}</h1>
    <p class="muted">{voice.joinPage.body}</p>
    <NameForm
      submitLabel="Join room"
      busyLabel="Joining…"
      placeholder={voice.namePlaceholder}
      {busy}
      error={joinError}
      onsubmit={join}
    />
  </section>
{/if}

<style>
  .world-mark {
    display: flex;
    justify-content: center;
    margin: -4px 0 18px;
  }
  .narrow {
    /* .card padding replaces .container's gutter, so keep the gutter as outer space instead */
    width: calc(100% - 2 * var(--gutter));
    max-width: 520px;
    margin-top: clamp(24px, 6vw, 64px);
  }
  .done .btn {
    margin-top: 8px;
  }
  .end-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
</style>
