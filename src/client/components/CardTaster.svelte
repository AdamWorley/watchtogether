<script lang="ts">
  import type { ShowSlug } from '../../shared/shows';
  import { loadSquares } from '../lib/squares';
  import { roman } from '../lib/roman';

  let { show }: { show: ShowSlug } = $props();

  // Five real squares from the show's pool, rendered in the world's own tiles: the mechanism, shown.
  let picks = $state<string[]>([]);
  let total = $state(0);
  $effect(() => {
    let cancelled = false;
    loadSquares(show)
      .then((pool) => {
        if (cancelled) return;
        total = pool.length;
        const step = Math.max(1, Math.floor(pool.length / 5));
        picks = [0, 1, 2, 3, 4].map((i) => pool[(i * step + 3) % pool.length] ?? '');
      })
      .catch(() => {
        // The strip is decorative; skip it if the pool can't load.
      });
    return () => {
      cancelled = true;
    };
  });
</script>

{#if picks.length}
  <section class="container taster-wrap" aria-labelledby="taster-title">
    <div class="card taster-card">
      <h2 id="taster-title">What’s on the card</h2>
      <p class="muted">
        Everyone gets their own 24 squares, drawn from {total} of the show’s favourite moments. Tap one when it
        happens on screen.
      </p>
      <p class="print-link"><a href="/{show}/print">Print cards for offline play</a></p>
      <div class="spread taster" aria-hidden="true">
        {#each picks as text, i (i)}
          <div class="cell" data-state={i === 1 || i === 3 ? 'marked' : 'plain'}>
            <span class="num">{roman(i + 1)}</span>
            <span class="txt">{text}</span>
          </div>
        {/each}
      </div>
    </div>
  </section>
{/if}

<style>
  .taster-wrap {
    margin-top: 16px;
  }
  .print-link {
    margin: 4px 0 0;
    font-weight: 700;
  }
  .taster-card h2 {
    margin-bottom: 0.3em;
  }
  .taster {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    width: 100%;
    margin: 18px 0 4px;
    max-width: 720px;
  }
  .taster :global(.cell) {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 0;
    text-align: center;
    overflow-wrap: break-word;
    hyphens: auto;
    hyphenate-limit-chars: 9 4 3;
  }
</style>
