<script lang="ts">
  import { cardKey, FREE, FREE_CELL, generateCard } from '../../shared/bingo';
  import { SHOWS, type ShowSlug } from '../../shared/shows';
  import { roman } from '../lib/roman';
  import { loadSquares } from '../lib/squares';
  import { VOICES } from '../lib/voice';

  let { show }: { show: ShowSlug } = $props();

  const voice = $derived(VOICES[show]);
  const numbered = $derived(voice.tally.roman);
  const MAX = 24;

  let pool = $state<readonly string[] | null>(null);
  let failed = $state(false);
  let count = $state(4);
  let cards = $state<number[][]>([]);

  $effect(() => {
    loadSquares(show)
      .then((p) => {
        pool = p;
        deal();
      })
      .catch(() => (failed = true));
  });

  /** Deal `count` cards that are all different from each other (same rule as a live room). */
  function deal() {
    if (!pool) return;
    const seen: Record<string, true> = {};
    const next: number[][] = [];
    while (next.length < count) {
      const card = generateCard(pool.length);
      const key = cardKey(card);
      if (seen[key]) continue;
      seen[key] = true;
      next.push(card);
    }
    cards = next;
  }

  function setCount(event: Event) {
    const n = Number((event.currentTarget as HTMLSelectElement).value);
    count = Math.min(MAX, Math.max(1, n));
    deal();
  }

  const label = (cell: number) => (cell === FREE_CELL ? '0' : roman(cell < FREE_CELL ? cell + 1 : cell));
</script>

<section class="container controls" aria-labelledby="print-title">
  <a class="back" href="/{show}">{SHOWS[show].name}</a>
  <h1 id="print-title">Print bingo cards</h1>
  <p class="muted lead">
    Playing on the sofa without phones? Print a card for everyone. Each card is different, and you mark the
    squares with a pen as the moments happen. Call LINE or FULL HOUSE out loud.
  </p>
  {#if failed}
    <p class="error" role="alert">Couldn’t load the squares. Check your connection and refresh.</p>
  {:else}
    <div class="row">
      <label for="card-count">Cards</label>
      <select id="card-count" value={count} onchange={setCount}>
        {#each [1, 2, 4, 6, 8, 10, 12, 16, 20, 24] as n (n)}
          <option value={n}>{n}</option>
        {/each}
      </select>
      <button class="btn secondary" type="button" onclick={deal} disabled={!pool}>Deal new cards</button>
      <button class="btn" type="button" onclick={() => window.print()} disabled={!pool}>Print</button>
    </div>
    <p class="muted hint">Two cards per A4 page, in black and white to save ink.</p>
  {/if}
</section>

{#if pool}
  <div class="sheets" aria-label="Cards to print">
    {#each cards as card, n (cardKey(card))}
      <article class="sheet" aria-label="Card {n + 1}">
        <header class="sheet-head">
          <span class="sheet-show">{SHOWS[show].name}</span>
          <span class="sheet-no">Card {n + 1} of {cards.length}</span>
        </header>
        <div class="grid" role="presentation">
          {#each card as value, cell (cell)}
            <div class="square" class:free={value === FREE}>
              {#if numbered}<span class="n">{label(cell)}</span>{/if}
              <span class="t">
                {#if value === FREE}{voice.free.name}<small>FREE</small>{:else}{pool[value] ?? ''}{/if}
              </span>
            </div>
          {/each}
        </div>
        <footer class="sheet-foot">
          <span>Name: ______________________</span>
          <span>Mark a square when it happens. First LINE wins, then FULL HOUSE.</span>
        </footer>
      </article>
    {/each}
  </div>
{/if}

<style>
  .controls {
    padding-top: 24px;
    padding-bottom: 8px;
  }
  .lead {
    max-width: 60ch;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }
  .row label {
    margin: 0;
  }
  select {
    min-height: 48px;
    padding: 0 12px;
    border-radius: var(--radius-input, 10px);
    border: var(--keyline) solid var(--border);
    background: var(--surface-2);
    color: var(--text);
    font: inherit;
  }
  .hint {
    font-size: 0.9rem;
    margin-top: 8px;
  }

  /* On screen: paper sheets laid out on the world's ground. */
  .sheets {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 520px), 1fr));
    gap: 20px;
    width: 100%;
    max-width: 1120px;
    margin: 12px auto 0;
    padding: 0 var(--gutter);
  }
  .sheet {
    background: #fff;
    color: #111;
    border-radius: 4px;
    padding: 18px;
    box-shadow: 0 8px 24px rgb(0 0 0 / 0.35);
    break-inside: avoid;
  }
  .sheet-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 10px;
    font-family: var(--font-display);
    border-bottom: 2px solid #111;
    padding-bottom: 6px;
  }
  .sheet-show {
    font-size: 1.35rem;
    line-height: 1.1;
  }
  .sheet-no {
    font-family: var(--font-body);
    font-size: 0.8rem;
    font-weight: 700;
    white-space: nowrap;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    border: 2px solid #111;
  }
  .square {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    aspect-ratio: 1;
    padding: 6px 4px;
    border: 1px solid #111;
    text-align: center;
    font-family: var(--font-body);
    font-size: 0.72rem;
    font-weight: 600;
    line-height: 1.15;
    overflow-wrap: break-word;
    hyphens: auto;
    hyphenate-limit-chars: 9 4 3;
  }
  .n {
    position: absolute;
    top: 3px;
    left: 0;
    right: 0;
    font-family: var(--font-display);
    font-size: 0.65rem;
    font-weight: 400;
  }
  .free {
    font-family: var(--font-display);
    font-weight: 400;
    font-size: 0.9rem;
    background: #eee;
  }
  .free small {
    display: block;
    font-family: var(--font-body);
    font-size: 0.6rem;
    font-weight: 800;
    letter-spacing: 0.14em;
  }
  .sheet-foot {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 6px 16px;
    margin-top: 10px;
    font-size: 0.72rem;
  }

  /* Print: just the cards, two per A4 page, ink only. */
  @media print {
    @page {
      size: A4;
      margin: 12mm;
    }
    :global(html),
    :global(body) {
      background: #fff !important;
      color: #111 !important;
    }
    :global(footer.container),
    .controls {
      display: none !important;
    }
    .sheets {
      display: block;
      max-width: none;
      margin: 0;
      padding: 0;
    }
    .sheet {
      box-shadow: none;
      border-radius: 0;
      padding: 0 0 6mm;
      height: 132mm;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .sheet:nth-child(2n) {
      break-after: page;
      page-break-after: always;
    }
    .grid {
      width: 112mm;
      margin: 0 auto;
    }
    .square {
      font-size: 8.5pt;
    }
    .free {
      background: #eee !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
</style>
