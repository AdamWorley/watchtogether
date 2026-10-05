<script lang="ts">
  import { SHOWS, type ShowSlug } from '../../shared/shows';
  import { VOICES } from '../lib/voice';

  let { show }: { show: ShowSlug } = $props();
  const voice = $derived(VOICES[show]);
  const world = $derived(SHOWS[show].world);
</script>

<!-- Decorative: a physical sample of the show's world (styled in src/client/themes). -->
<div class="emblem" aria-hidden="true">
  {#if world === 'traitors'}
    {#each voice.emblem as card (card.n)}
      <div class="card-face"><span class="n">{card.n}</span><span class="t">{card.t}</span></div>
    {/each}
  {:else if world === 'strictly'}
    <div class="swatch"><span></span><span></span><span></span><span></span></div>
    <div class="score">{voice.emblem[0]?.n}</div>
  {:else if world === 'jungle'}
    <span class="rope rope-l"></span><span class="rope rope-r"></span>
    <div class="plank"><span class="star"></span><span class="word">{voice.emblem[0]?.t}</span></div>
  {:else if world === 'bakeoff'}
    <div class="cake"><span class="rosette">{voice.emblem[0]?.t}</span></div>
  {:else}
    <div class="rink">
      <span class="tracing"></span>
      <span class="score">{voice.emblem[0]?.n}</span>
      <span class="glint glint-a"></span><span class="glint glint-b"></span>
    </div>
  {/if}
</div>
