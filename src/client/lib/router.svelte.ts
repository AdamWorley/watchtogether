// Tiny History-API router. Paths are matched in App.svelte.
let path = $state(location.pathname);

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => (path = location.pathname));
}

export const router = {
  get path() {
    return path;
  },
  navigate(to: string, { replace = false } = {}): void {
    if (replace) history.replaceState(null, '', to);
    else history.pushState(null, '', to);
    path = location.pathname;
    window.scrollTo(0, 0);
  },
};
