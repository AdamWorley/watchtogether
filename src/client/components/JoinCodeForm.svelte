<script lang="ts">
  import { normaliseCode } from '../../shared/codes';
  import type { ShowSlug } from '../../shared/shows';
  import { router } from '../lib/router.svelte';

  let { show }: { show: ShowSlug } = $props();

  let code = $state('');
  let error = $state<string | null>(null);

  function submit(event: SubmitEvent) {
    event.preventDefault();
    const normalised = normaliseCode(code);
    if (!normalised) {
      error = 'Room codes are 10 letters and numbers, like ABCDE-12345. Check for a missing character.';
      return;
    }
    router.navigate(`/${show}/room#${normalised}`);
  }
</script>

<form onsubmit={submit} novalidate>
  <div class="field">
    <label for="code-{show}">Room code</label>
    <div class="row">
      <input
        id="code-{show}"
        type="text"
        bind:value={code}
        maxlength="16"
        autocomplete="off"
        autocapitalize="characters"
        spellcheck="false"
        placeholder="ABCDE-12345"
      />
      <button class="btn secondary" type="submit">Join room</button>
    </div>
  </div>
  {#if error}<p class="error" role="alert">{error}</p>{/if}
</form>

<style>
  .row {
    display: flex;
    gap: 8px;
  }
  .row input {
    flex: 1;
    min-width: 0;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
</style>
