<script lang="ts">
  import { BARS, LOCKUP, MARK, SCREEN_SURROUND } from '../lib/brand';

  interface Props {
    /** Just the telly, without the wordmark. */
    markOnly?: boolean;
    /** Accessible name; omit when nearby text already names it. */
    label?: string;
  }

  let { markOnly = false, label }: Props = $props();
  const clipId = $props.id();
  const barWidth = MARK.screen.w / BARS.length;
  const viewBox = $derived(
    markOnly ? `0 0 ${MARK.width} ${MARK.height}` : `0 0 ${LOCKUP.width} ${LOCKUP.height}`,
  );
</script>

<!-- The set and wordmark take currentColor (each world's text colour); the bars are always the brand bars.
     The wordmark is a static SVG used as a mask over the same lockup box, so its path stays out of the JS. -->
<span
  class="logo"
  class:mark-only={markOnly}
  role={label ? 'img' : undefined}
  aria-label={label}
  aria-hidden={label ? undefined : 'true'}
>
  <svg {viewBox} aria-hidden="true" focusable="false">
    <defs>
      <clipPath id={clipId}>
        <rect
          x={MARK.screen.x}
          y={MARK.screen.y}
          width={MARK.screen.w}
          height={MARK.screen.h}
          rx={MARK.screen.r}
        />
      </clipPath>
    </defs>
    <g transform={markOnly ? undefined : `translate(0 ${LOCKUP.markY})`}>
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
        fill={SCREEN_SURROUND}
      />
      <g clip-path="url(#{clipId})">
        {#each BARS as colour, i (colour)}
          <rect
            x={MARK.screen.x + i * barWidth}
            y={MARK.screen.y}
            width={barWidth + 0.05}
            height={MARK.screen.h}
            fill={colour}
          />
        {/each}
      </g>
    </g>
  </svg>
  {#if !markOnly}<span class="word"></span>{/if}
</span>

<style>
  .logo {
    position: relative;
    display: block;
    flex: none;
    height: var(--logo-height, 28px);
    aspect-ratio: 286 / 52;
  }
  .logo.mark-only {
    aspect-ratio: 48 / 44;
  }
  svg {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
  }
  .word {
    position: absolute;
    inset: 0;
    background: currentColor;
    -webkit-mask: url('../assets/brand/wordmark.svg') 0 0 / 100% 100% no-repeat;
    mask: url('../assets/brand/wordmark.svg') 0 0 / 100% 100% no-repeat;
  }
</style>
