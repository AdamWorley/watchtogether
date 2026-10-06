<script lang="ts">
  import { CONTESTANT_MAX, LINEUP_MAX, questionsFor, type QuestionId } from '../../shared/predictions';
  import { cleanText, textLength } from '../../shared/sanitize';
  import type { ShowSlug } from '../../shared/shows';
  import type { RoomConnection } from '../lib/room.svelte';
  import { VOICES } from '../lib/voice';

  interface Props {
    conn: RoomConnection;
    show: ShowSlug;
    mask: ((text: string) => string) | null;
  }

  let { conn, show, mask }: Props = $props();
  const voice = $derived(VOICES[show]);
  const questions = $derived(questionsFor(show));
  const p = $derived(conn.predictions);
  const isHost = $derived(conn.you?.host === true);
  const display = (text: string) => (mask ? mask(text) : text);

  // Host modes: recording a result for one question, or fixing the line-up.
  let recording = $state<QuestionId | null>(null);
  let editing = $state(false);
  let draft = $state('');
  const cleaned = $derived(cleanText(draft));
  const canAdd = $derived(
    textLength(cleaned) >= 1 && textLength(cleaned) <= CONTESTANT_MAX && p.lineup.length < LINEUP_MAX,
  );

  const verdictFor = (q: QuestionId) => p.verdicts.find((v) => v.q === q)?.name;
  const mine = (q: QuestionId) => p.picks.find((x) => x.q === q && x.memberId === conn.you?.id)?.name;
  const pickers = (q: QuestionId, name: string) =>
    p.picks
      .filter((x) => x.q === q && x.name === name)
      .map((x) => ({ id: x.memberId, name: conn.members.find((m) => m.id === x.memberId)?.name }))
      .filter((x): x is { id: string; name: string } => x.name !== undefined);

  function choose(q: QuestionId, name: string) {
    if (recording === q) {
      conn.send({ t: 'verdict', q, name });
      recording = null;
      return;
    }
    // Tapping your own pick again takes it back.
    conn.send({ t: 'pick', q, name: mine(q) === name ? null : name });
  }

  function add(event: SubmitEvent) {
    event.preventDefault();
    if (!canAdd) return;
    if (!conn.send({ t: 'lineup', op: 'add', name: cleaned })) return;
    draft = '';
    // Keep the form open (it only shows unprompted while the line-up is empty) for the next name.
    editing = true;
  }
</script>

<div class="predict">
  <h2>{voice.predict.heading}</h2>
  <p class="muted intro">{voice.predict.intro}</p>

  {#if p.lineup.length === 0}
    <p class="empty">{voice.predict.empty}</p>
  {/if}

  {#each questions as q (q)}
    {@const ask = voice.predict.asks[q]}
    {@const verdict = verdictFor(q)}
    {@const my = mine(q)}
    {#if ask && p.lineup.length > 0}
      <section class="ask" aria-labelledby="ask-{q}">
        <div class="ask-head">
          <h3 id="ask-{q}">{ask.ask}</h3>
          {#if isHost}
            {#if verdict !== undefined}
              <button
                class="btn small secondary"
                type="button"
                onclick={() => conn.send({ t: 'verdict', q, name: null })}
              >
                Undo result
              </button>
            {:else}
              <button
                class="btn small secondary"
                type="button"
                aria-pressed={recording === q}
                onclick={() => (recording = recording === q ? null : q)}
              >
                {recording === q ? 'Cancel' : 'Record result'}
              </button>
            {/if}
          {/if}
        </div>
        {#if recording === q}
          <p class="recording" role="status">Tap who it was. Picks lock when you do.</p>
        {/if}
        <ul class="lineup" class:settled={verdict !== undefined} class:recording={recording === q}>
          {#each p.lineup as name (name)}
            {@const who = pickers(q, name)}
            {@const answer = verdict === name}
            <li class:answer class:mine={my === name}>
              {#if verdict === undefined}
                <button
                  type="button"
                  class="row"
                  aria-pressed={recording === q ? undefined : my === name}
                  onclick={() => choose(q, name)}
                >
                  <span class="name">{display(name)}</span>
                  {#if my === name}<span class="tag">Your pick</span>{/if}
                  <span class="count" aria-label="{who.length} {who.length === 1 ? 'pick' : 'picks'}"
                    >{who.length}</span
                  >
                </button>
              {:else}
                <div class="row">
                  <span class="name">{display(name)}</span>
                  {#if answer}<span class="tag answer-tag">{ask.tag}</span>{/if}
                  {#if my === name}<span class="tag">Your pick</span>{/if}
                  <span class="count" aria-label="{who.length} {who.length === 1 ? 'pick' : 'picks'}"
                    >{who.length}</span
                  >
                </div>
              {/if}
              {#if who.length > 0}
                <p class="who">
                  {#each who as person, i (person.id)}<span data-c={conn.slot(person.id)}
                      >{display(person.name)}</span
                    >{i < who.length - 1 ? ', ' : ''}{/each}
                </p>
              {/if}
              {#if editing && !answer}
                <button
                  class="btn small danger remove"
                  type="button"
                  onclick={() => conn.send({ t: 'lineup', op: 'remove', name })}
                >
                  Remove {display(name)}
                </button>
              {/if}
            </li>
          {/each}
        </ul>
      </section>
    {/if}
  {/each}

  {#if isHost}
    <div class="host">
      <button
        class="btn small secondary"
        type="button"
        aria-pressed={editing}
        onclick={() => (editing = !editing)}
      >
        {editing ? 'Done editing' : 'Edit the line-up'}
      </button>
      {#if editing || p.lineup.length === 0}
        <form onsubmit={add}>
          <label class="sr-only" for="lineup-add">Add someone to the line-up</label>
          <input
            id="lineup-add"
            type="text"
            bind:value={draft}
            maxlength={CONTESTANT_MAX * 2}
            autocomplete="off"
            placeholder="Add a name"
          />
          <button class="btn small" type="submit" disabled={!canAdd}>Add</button>
        </form>
        <p class="muted hint">
          Remove anyone who’s already left the show; their picks go too. Only you can change the line-up or
          record a result.
        </p>
      {/if}
    </div>
  {/if}
</div>

<style>
  .predict h2 {
    margin-bottom: 0.25em;
  }
  .intro {
    margin: 0 0 14px;
    font-size: 0.95rem;
  }
  .empty {
    font-weight: 600;
  }
  .ask + .ask {
    margin-top: 22px;
  }
  .ask-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 8px;
  }
  .ask h3 {
    margin: 0;
  }
  .recording {
    margin: 0 0 8px;
    font-weight: 700;
    color: var(--accent);
  }
  .lineup {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 140px), 1fr));
    gap: 6px;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 8px;
    width: 100%;
    min-height: 48px;
    padding: 6px 10px;
    border: var(--keyline) solid var(--border);
    border-radius: var(--radius-input, 10px);
    background: var(--surface-2);
    color: var(--text);
    font: inherit;
    text-align: left;
  }
  button.row {
    cursor: pointer;
  }
  button.row:hover {
    border-color: color-mix(in srgb, var(--accent) 60%, var(--border));
  }
  /* Your pick: the accent edge plus the "Your pick" tag, never colour alone. */
  .mine .row {
    border-color: var(--accent);
    box-shadow: inset 0 0 0 1px var(--accent);
  }
  /* Recording a result: every row is a target, drawn with a dashed edge. */
  .recording .row {
    border-style: dashed;
    border-color: var(--accent);
  }
  .settled li:not(.answer) .row {
    opacity: 0.62;
  }
  .answer .row {
    background: var(--accent);
    color: var(--accent-text);
    border-color: transparent;
  }
  .answer .tag {
    color: inherit;
    border-color: currentColor;
  }
  .name {
    font-weight: 600;
    overflow-wrap: anywhere;
    min-width: 0;
  }
  .tag {
    flex: none;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--accent);
    border: 1px solid currentColor;
    border-radius: var(--radius-control);
    padding: 0 6px;
  }
  .answer-tag {
    font-weight: 800;
  }
  .count {
    margin-left: auto;
    flex: none;
    min-width: 1.6em;
    text-align: right;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
  }
  .who {
    margin: 3px 2px 0;
    font-size: 0.8rem;
    color: var(--muted);
    overflow-wrap: anywhere;
  }
  .who span {
    color: var(--person, var(--text));
    font-weight: 600;
  }
  .remove {
    margin-top: 4px;
  }
  .host {
    margin-top: 20px;
  }
  form {
    display: flex;
    gap: 8px;
    margin-top: 10px;
  }
  input {
    flex: 1;
    min-width: 0;
  }
  .hint {
    font-size: 0.85rem;
    margin-top: 8px;
  }
</style>
