// Shared ticking clock so countdowns stay in sync and only one interval runs.
let now = $state(Date.now());
let subscribers = 0;
let timer: ReturnType<typeof setInterval> | undefined;

export function useClock(): { readonly now: number } {
  $effect(() => {
    if (subscribers++ === 0) timer = setInterval(() => (now = Date.now()), 1000);
    return () => {
      if (--subscribers === 0) clearInterval(timer);
    };
  });
  return {
    get now() {
      return now;
    },
  };
}
