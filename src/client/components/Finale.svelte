<script lang="ts">
  import { SHOWS, type ShowSlug } from '../../shared/shows';
  import { VOICES } from '../lib/voice';

  interface Props {
    show: ShowSlug;
    /** Display-safe (already masked) winner name. */
    name: string;
    onclose: () => void;
  }

  let { show, name, onclose }: Props = $props();
  const voice = $derived(VOICES[show]);
  const world = $derived(SHOWS[show].world);

  let closeBtn: HTMLButtonElement | undefined = $state();
  $effect(() => {
    closeBtn?.focus({ preventScroll: true });
    const t = setTimeout(onclose, 7000);
    const onkey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onclose();
    };
    window.addEventListener('keydown', onkey);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onkey);
    };
  });
</script>

<!-- The FULL HOUSE moment: one world-specific object, the title and the winner. -->
<div class="finale" role="status" aria-live="assertive">
  <div class="stage" aria-hidden="true">
    {#if world === 'traitors'}
      <div class="f-card">
        <div class="f-face">
          <span class="f-num">XXIV</span>
          <span class="f-name">{name}</span>
          <span class="f-sub">The Winner</span>
        </div>
      </div>
    {:else if world === 'strictly'}
      <div class="f-ball"><span class="f-string"></span><span class="f-orb"></span></div>
      <div class="f-paddle">10</div>
    {:else if world === 'jungle'}
      <div class="f-sign"><span class="f-star"></span><span class="f-word">{voice.finale.title}</span></div>
    {:else if world === 'bakeoff'}
      <div class="f-rosette"><span class="f-tails"></span><span class="f-disc">Star Baker</span></div>
    {:else}
      <div class="f-scores"><span>6.0</span><span>6.0</span><span>6.0</span></div>
    {/if}
  </div>
  <h2 class="title">{voice.finale.title}</h2>
  <p class="line">{voice.finale.line(name)}</p>
  <button class="btn secondary" type="button" bind:this={closeBtn} onclick={onclose}>Back to the room</button>
</div>

<style>
  .finale {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    padding: 24px;
    text-align: center;
    background: color-mix(in srgb, var(--bg) 92%, transparent);
    backdrop-filter: blur(6px);
    animation: finale-in 0.35s ease-out;
  }
  .stage {
    display: grid;
    place-items: center;
    min-height: 220px;
  }
  .title {
    font-size: clamp(2.4rem, 9vw, 5rem);
    margin: 0;
    color: var(--accent);
  }
  .line {
    margin: 0 0 8px;
    font-size: clamp(1.1rem, 3vw, 1.5rem);
    max-width: 30ch;
  }

  /* Traitors: a card turns from its back to reveal the winner. */
  .f-card {
    position: relative;
    width: clamp(170px, 17vw, 240px);
    aspect-ratio: 5 / 7;
    animation: card-turn 1.1s cubic-bezier(0.3, 0, 0.2, 1) both;
  }
  .f-card::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 2;
    border-radius: 6px;
    background: url('../assets/cardback.svg') center / 100% 100% no-repeat;
    animation: card-back 1.1s linear both;
  }
  .f-face {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding: 12px 10px 16px;
    border: 2px solid var(--ink, #0e0b1c);
    border-radius: 6px;
    background: var(--ultramarine, #2c4bb0);
    color: var(--bone, #e6dfcd);
    box-shadow:
      inset 0 0 0 5px var(--ultramarine, #2c4bb0),
      inset 0 0 0 7px var(--chrome, #f2c230),
      0 18px 40px rgb(0 0 0 / 0.5);
    font-family: var(--font-display);
  }
  .f-num {
    color: var(--chrome, #f2c230);
    font-size: 1.3rem;
    border-bottom: 1.5px solid currentColor;
    padding-bottom: 4px;
    width: 80%;
  }
  .f-name {
    font-size: clamp(1.5rem, 2.2vw, 2.1rem);
    line-height: 1.1;
    overflow-wrap: anywhere;
  }
  .f-sub {
    font-size: 0.95rem;
    color: var(--chrome, #f2c230);
  }
  @keyframes card-turn {
    from {
      transform: perspective(800px) rotateY(-180deg) scale(0.6);
    }
  }
  @keyframes card-back {
    0%,
    49.9% {
      opacity: 1;
    }
    50%,
    100% {
      opacity: 0;
    }
  }

  /* Strictly: a glitterball drops on its line, and a gold 10 goes up. */
  .f-ball {
    display: flex;
    flex-direction: column;
    align-items: center;
    animation: ball-drop 0.9s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  .f-string {
    width: 2px;
    height: 70px;
    background: color-mix(in srgb, var(--text) 60%, transparent);
  }
  .f-orb {
    width: 130px;
    height: 130px;
    border-radius: 50%;
    background:
      radial-gradient(circle at 35% 30%, rgb(255 255 255 / 0.95) 0 8%, transparent 30%), var(--lame, #f5c542);
    -webkit-mask: url('../assets/sequins.svg') 0 0 / 12px 12px repeat;
    mask: url('../assets/sequins.svg') 0 0 / 12px 12px repeat;
    animation: ball-spin 3s linear infinite;
  }
  .f-paddle {
    margin-top: 12px;
    padding: 6px 26px 2px;
    border-radius: 999px;
    border: 2px solid var(--lame, #f5c542);
    color: var(--lame, #f5c542);
    font-family: var(--font-display);
    font-size: 3rem;
    line-height: 1.1;
    animation: pop 0.5s 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  @keyframes ball-drop {
    from {
      transform: translateY(-120%);
    }
  }
  @keyframes ball-spin {
    to {
      -webkit-mask-position: 120px 0;
      mask-position: 120px 0;
    }
  }

  /* I'm a Celeb: the sign flares as its star burns in. */
  .f-sign {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 22px 30px;
    background: var(--cedar, #a8743d);
    border: 4px solid var(--char, #2e1b0e);
    border-radius: 10px;
    box-shadow:
      inset 0 0 0 5px var(--cedar, #a8743d),
      inset 0 0 0 7px #6b4220,
      0 18px 40px rgb(0 0 0 / 0.5);
    transform: rotate(-3deg);
    animation: flare 1s ease-out both;
  }
  .f-star {
    width: 54px;
    height: 54px;
    background: #8a3b0f;
    -webkit-mask: url('../assets/star.svg') center / contain no-repeat;
    mask: url('../assets/star.svg') center / contain no-repeat;
    filter: drop-shadow(0 0 2px #ffb04a) drop-shadow(0 0 8px rgb(255 138 31 / 0.8));
    animation: pop 0.6s 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  .f-word {
    font-family: var(--font-display);
    font-size: 2rem;
    color: #22120a;
  }
  @keyframes flare {
    0% {
      filter: brightness(2.2) saturate(1.5);
    }
  }

  /* Bake Off: a Star Baker rosette spins in. */
  .f-rosette {
    position: relative;
    display: grid;
    place-items: center;
    animation: rosette 0.9s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  .f-disc {
    position: relative;
    z-index: 1;
    display: grid;
    place-items: center;
    width: 170px;
    height: 170px;
    border-radius: 50%;
    background: var(--raspberry, #e5466b);
    border: 6px dotted var(--icing, #fff8f1);
    box-shadow:
      0 0 0 10px var(--pink, #f6b7c8),
      0 18px 40px rgb(0 0 0 / 0.5);
    color: var(--icing, #fff8f1);
    font-family: var(--font-display);
    font-size: 1.7rem;
  }
  .f-tails {
    position: absolute;
    top: 120px;
    width: 120px;
    height: 120px;
    background:
      linear-gradient(105deg, transparent 46%, var(--raspberry, #e5466b) 46% 62%, transparent 62%),
      linear-gradient(75deg, transparent 38%, var(--pink, #f6b7c8) 38% 54%, transparent 54%);
  }
  @keyframes rosette {
    from {
      transform: rotate(-200deg) scale(0.3);
    }
  }

  /* Dancing on Ice: three judges' 6.0s flip up on the scoreboard. */
  .f-scores {
    display: flex;
    gap: 12px;
  }
  .f-scores span {
    display: grid;
    place-items: center;
    width: 96px;
    height: 116px;
    border-radius: 10px;
    background: var(--studio, #071330);
    border: 2px solid var(--gold, #ffcc33);
    color: var(--gold, #ffcc33);
    font-family: var(--font-display);
    font-size: 2.4rem;
    box-shadow: 0 14px 30px rgb(0 0 0 / 0.5);
    animation: flip-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  .f-scores span:nth-child(2) {
    animation-delay: 0.2s;
  }
  .f-scores span:nth-child(3) {
    animation-delay: 0.4s;
  }
  @keyframes flip-up {
    from {
      transform: perspective(500px) rotateX(-90deg);
    }
  }

  @keyframes pop {
    from {
      transform: scale(0.3);
      opacity: 0;
    }
  }
  @keyframes finale-in {
    from {
      opacity: 0;
    }
  }
</style>
