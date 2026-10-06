<script lang="ts">
  import { CHANNELS, SHOWS, type ShowSlug } from '../../shared/shows';

  let { show }: { show: ShowSlug } = $props();
  const channel = $derived(SHOWS[show].channel);
</script>

<!-- Where the show airs. The logo is a mask tinted with the world's text colour, so it reads on every ground;
     the channel name is its accessible label. -->
<span class="channel" data-channel={channel} role="img" aria-label="On {CHANNELS[channel].name}"></span>

<style>
  .channel {
    display: block;
    /* Per-channel heights balance the marks' optical size: BBC One stacks two rows, ITV1 is one wide row. */
    height: var(--h);
    margin: 6px 0 8px;
    background: currentColor;
    opacity: 0.85;
    -webkit-mask: var(--logo) left center / contain no-repeat;
    mask: var(--logo) left center / contain no-repeat;
  }
  .channel[data-channel='bbc-one'] {
    --logo: url('../assets/channels/bbc-one.svg');
    aspect-ratio: 368.3 / 239.6;
    --h: 2.1em;
  }
  .channel[data-channel='itv1'] {
    --logo: url('../assets/channels/itv1.svg');
    aspect-ratio: 1000 / 368.5;
    --h: 1.35em;
  }
  .channel[data-channel='channel-4'] {
    --logo: url('../assets/channels/channel-4.svg');
    aspect-ratio: 177.6 / 240;
    --h: 1.9em;
  }
</style>
