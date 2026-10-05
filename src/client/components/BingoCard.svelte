<script lang="ts">
  import { FREE, FREE_CELL, LINES } from '../../shared/bingo';
  import type { ShowSlug } from '../../shared/shows';
  import { fitCaption } from '../lib/fit';
  import { roman } from '../lib/roman';
  import { VOICES } from '../lib/voice';

  interface Props {
    card: readonly number[];
    marks: readonly number[];
    squares: readonly string[];
    show: ShowSlug;
    /** Omit for a read-only snapshot (e.g. someone else's claim). */
    ontoggle?: (cell: number) => void;
    compact?: boolean;
    /** True for a moment when a claim lands: each world plays its one full-card event. */
    event?: boolean;
    label: string;
  }

  let { card, marks, squares, show, ontoggle, compact = false, event = false, label }: Props = $props();

  const voice = $derived(VOICES[show]);
  const marked = $derived(new Set([...marks, FREE_CELL]));

  // Cells in a completed line (the winning state) and the one empty cell of a line that's 4/5 done.
  const winning = $derived(
    new Set(LINES.filter((line) => line.every((c) => marked.has(c))).flatMap((line) => [...line])),
  );
  const near = $derived(
    new Set(
      compact
        ? []
        : LINES.map((line) => line.filter((c) => !marked.has(c))).flatMap((open) =>
            open.length === 1 ? open : [],
          ),
    ),
  );

  // Numerals count the 24 fate cards in reading order, skipping the free centre.
  const numerals = $derived(
    card.map((_, cell) => (cell === FREE_CELL ? '0' : roman(cell < FREE_CELL ? cell + 1 : cell))),
  );

  let changed = $state<number | null>(null);
  let timer: ReturnType<typeof setTimeout> | undefined;

  function toggle(cell: number) {
    changed = cell;
    clearTimeout(timer);
    timer = setTimeout(() => (changed = null), 800);
    ontoggle?.(cell);
  }

  function cellState(cell: number): 'free' | 'win' | 'marked' | 'plain' {
    if (cell === FREE_CELL) return 'free';
    if (!marked.has(cell)) return 'plain';
    return winning.has(cell) ? 'win' : 'marked';
  }
</script>

<div class="spread" class:compact class:event role="group" aria-label={label}>
  {#each card as value, cell (cell)}
    {@const free = value === FREE}
    {@const text = free ? voice.free.name : (squares[value] ?? '?')}
    {@const s = cellState(cell)}
    {#if ontoggle && !free}
      <button
        type="button"
        class="cell"
        class:just-changed={changed === cell}
        data-state={s}
        data-near={near.has(cell) ? '' : undefined}
        aria-pressed={s !== 'plain'}
        onclick={() => toggle(cell)}
      >
        <span class="num" aria-hidden="true">{numerals[cell]}</span>
        <span class="txt" use:fitCaption>{text}</span>
      </button>
    {:else}
      <div
        class="cell"
        data-state={s}
        role="img"
        aria-label={free ? `${text}, free square` : s === 'plain' ? text : `${text}, marked`}
      >
        <span class="num" aria-hidden="true">{numerals[cell]}</span>
        {#if !compact}
          <span class="txt">
            {#if free}{text}<span class="free-sub">{voice.free.sub}</span>{:else}{text}{/if}
          </span>
        {/if}
      </div>
    {/if}
  {/each}
</div>

<style>
  /* Structure only. Each world (src/client/themes) skins the cells. */
  .spread {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    width: 100%;
    max-width: 640px;
    margin: 0 auto;
  }
  .cell {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 0;
    font: inherit;
    text-align: center;
    /* Hyphenate only words of 9+ characters (4 before, 3 after), so a word never splits without a hyphen
       and short ones like "Traitor" stay whole. */
    overflow-wrap: break-word;
    hyphens: auto;
    -webkit-hyphens: auto;
    hyphenate-limit-chars: 9 4 3;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }
  button.cell {
    cursor: pointer;
  }
  @media (min-width: 900px) {
    .cell {
      hyphens: manual;
      -webkit-hyphens: manual;
    }
  }
  .txt {
    max-width: 100%;
  }
  .compact {
    max-width: 150px;
  }
  .compact .num {
    display: none;
  }
</style>
