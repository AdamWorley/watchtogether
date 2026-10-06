<script lang="ts">
  import { BARS, MARK } from '../lib/brand';

  // The brand telly at hero scale, flicking between channels. Each channel shows a line someone in your
  // group will shout at the screen tonight, set as a broadcast subtitle over the test card.
  const CHANNELS = [
    { show: 'The Celebrity Traitors', line: '“I’m one hundred percent Faithful.”' },
    { show: 'Bake Off', line: '“Is that… a soggy bottom?”' },
    { show: 'Strictly', line: '“Seven? SEVEN? That was a ten!”' },
    { show: 'I’m a Celeb', line: '“Not the bush tucker trial again.”' },
    { show: 'The Traitors', line: '“I swear on my children’s lives.”' },
    { show: 'Dancing on Ice', line: '“She’s down! No, she’s up!”' },
    { show: 'Bake Off', line: '“Ten minutes left, bakers!”' },
    { show: 'Strictly', line: '“Keep dancing!”' },
  ] as const;

  let index = $state(0);
  const channel = $derived(CHANNELS[index] ?? CHANNELS[0]);

  $effect(() => {
    // Reduced motion: hold on the first channel.
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => (index = (index + 1) % CHANNELS.length), 3600);
    return () => clearInterval(timer);
  });
</script>

<!-- Decorative: the lead and doors say everything this does. -->
<div class="telly" aria-hidden="true">
  <svg viewBox="0 0 {MARK.width} {MARK.height}" focusable="false">
    <path
      d={MARK.antenna.d}
      fill="none"
      stroke="currentColor"
      stroke-width={MARK.antenna.width}
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <rect
      x={MARK.body.x}
      y={MARK.body.y}
      width={MARK.body.w}
      height={MARK.body.h}
      rx={MARK.body.r}
      fill="currentColor"
    />
    <rect
      x={MARK.surround.x}
      y={MARK.surround.y}
      width={MARK.surround.w}
      height={MARK.surround.h}
      rx={MARK.surround.r}
      fill="#121214"
    />
  </svg>
  <div class="screen">
    {#key index}
      <div class="picture">
        <div class="bars">
          {#each BARS as colour (colour)}<span></span>{/each}
        </div>
        <span class="osd">CH {index + 1}</span>
        <p class="sub">
          <span class="who">{channel.show}</span>
          <span class="line">{channel.line}</span>
        </p>
      </div>
    {/key}
  </div>
  <span class="glare"></span>
</div>

<style>
  /* Screen placement as fractions of the mark's 48×44 box (src/client/lib/brand.ts). */
  .telly {
    position: relative;
    width: 100%;
    aspect-ratio: 48 / 44;
    color: var(--text);
    filter: drop-shadow(0 24px 40px rgb(0 0 0 / 0.55));
  }
  svg {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
  }
  .screen {
    position: absolute;
    left: calc(5.6 / 48 * 100%);
    top: calc(15.1 / 44 * 100%);
    width: calc(36.8 / 48 * 100%);
    height: calc(23.3 / 44 * 100%);
    border-radius: 9% / 14%;
    overflow: hidden;
    background: #121214;
    container-type: inline-size;
  }
  .picture {
    position: absolute;
    inset: 0;
    animation: tune 0.42s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .bars {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    height: 100%;
    filter: saturate(0.9) brightness(0.62);
  }
  .bars span:nth-child(1) {
    background: #e6dfcd;
  }
  .bars span:nth-child(2) {
    background: #f2c230;
  }
  .bars span:nth-child(3) {
    background: #19d3c5;
  }
  .bars span:nth-child(4) {
    background: #23c06b;
  }
  .bars span:nth-child(5) {
    background: #ff2e93;
  }
  .bars span:nth-child(6) {
    background: #d8402b;
  }
  .bars span:nth-child(7) {
    background: #2c4bb0;
  }
  /* The set's own on-screen display: green channel numerals, top right. */
  .osd {
    position: absolute;
    top: 6cqi;
    right: 6cqi;
    font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
    font-size: 6.5cqi;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: #6fd39a;
    text-shadow:
      0 0 1px #000,
      0 0.6cqi 0 rgb(0 0 0 / 0.6);
  }
  /* Broadcast subtitles: bold lettering on a black box, bottom centre. */
  .sub {
    position: absolute;
    left: 6cqi;
    right: 6cqi;
    bottom: 7cqi;
    margin: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.6cqi;
    text-align: center;
  }
  .who,
  .line {
    background: #000;
    padding: 0.6cqi 2.2cqi;
    box-decoration-break: clone;
    -webkit-box-decoration-break: clone;
  }
  .who {
    font-size: 4.4cqi;
    font-weight: 700;
    color: #f2c230;
    letter-spacing: 0.02em;
  }
  .line {
    font-size: 7.4cqi;
    font-weight: 800;
    line-height: 1.32;
    color: #fff;
    text-wrap: balance;
  }
  /* A faint curve of studio light across the glass. */
  .glare {
    position: absolute;
    left: calc(5.6 / 48 * 100%);
    top: calc(15.1 / 44 * 100%);
    width: calc(36.8 / 48 * 100%);
    height: calc(23.3 / 44 * 100%);
    border-radius: 9% / 14%;
    background: radial-gradient(120% 90% at 18% 0%, rgb(255 255 255 / 0.12), transparent 55%);
    box-shadow: inset 0 0 14px rgb(0 0 0 / 0.6);
    pointer-events: none;
  }

  /* Changing channel: the picture collapses to a bright line and opens out again. */
  @keyframes tune {
    0% {
      transform: scaleY(0.02);
      filter: brightness(3);
    }
    45% {
      transform: scaleY(1.03);
      filter: brightness(1.4);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .picture {
      animation: none;
    }
  }
</style>
