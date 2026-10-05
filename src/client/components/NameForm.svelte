<script lang="ts">
  import { NAME_MAX } from '../../shared/protocol';
  import { cleanText, textLength } from '../../shared/sanitize';

  interface Props {
    submitLabel: string;
    /** Shown on the button while the request is in flight, e.g. "Joining…". */
    busyLabel: string;
    placeholder: string;
    busy?: boolean;
    error?: string | null;
    onsubmit: (name: string) => void;
  }

  let { submitLabel, busyLabel, placeholder, busy = false, error = null, onsubmit }: Props = $props();

  const NAME_KEY = 'wt:name';
  let name = $state(loadName());
  const cleaned = $derived(cleanText(name));
  const valid = $derived(textLength(cleaned) >= 1 && textLength(cleaned) <= NAME_MAX);

  function loadName(): string {
    try {
      return sessionStorage.getItem(NAME_KEY) ?? '';
    } catch {
      return '';
    }
  }

  let invalid = $state(false);

  function submit(event: SubmitEvent) {
    event.preventDefault();
    if (busy) return;
    invalid = !valid;
    if (invalid) return;
    try {
      sessionStorage.setItem(NAME_KEY, cleaned);
    } catch {
      // ignore
    }
    onsubmit(cleaned);
  }
</script>

<form onsubmit={submit} novalidate>
  <div class="field">
    <label for="name">Your name</label>
    <input
      id="name"
      type="text"
      bind:value={name}
      maxlength={NAME_MAX * 2}
      autocomplete="nickname"
      autocapitalize="words"
      enterkeyhint="go"
      spellcheck="false"
      {placeholder}
      aria-describedby="name-help"
      required
    />
    <p id="name-help" class="help">Everyone in the room sees this. Up to {NAME_MAX} characters.</p>
  </div>
  <button class="btn" type="submit" disabled={busy}>{busy ? busyLabel : submitLabel}</button>
  {#if invalid}<p class="error" role="alert">Type a name first (1 to {NAME_MAX} characters).</p>{/if}
  {#if error}<p class="error" role="alert">{error}</p>{/if}
</form>

<style>
  .help {
    margin: 6px 0 0;
    font-size: 0.85rem;
    color: var(--muted);
  }
</style>
