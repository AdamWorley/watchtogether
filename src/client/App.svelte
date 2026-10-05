<script lang="ts">
  import { isShowSlug, SHOWS, type ShowSlug } from '../shared/shows';
  import Footer from './components/Footer.svelte';
  import { router } from './lib/router.svelte';
  import Home from './routes/Home.svelte';
  import NotFound from './routes/NotFound.svelte';
  import Privacy from './routes/Privacy.svelte';
  import ShowPage from './routes/ShowPage.svelte';

  type Route =
    | { name: 'home' }
    | { name: 'privacy' }
    | { name: 'show'; show: ShowSlug }
    | { name: 'room'; show: ShowSlug }
    | { name: 'print'; show: ShowSlug }
    | { name: 'not-found' };

  function match(path: string): Route {
    const clean = path.replace(/\/+$/, '') || '/';
    if (clean === '/') return { name: 'home' };
    if (clean === '/privacy') return { name: 'privacy' };
    const [, show, sub, ...rest] = clean.split('/');
    if (!isShowSlug(show) || rest.length) return { name: 'not-found' };
    if (sub === undefined) return { name: 'show', show };
    if (sub === 'room') return { name: 'room', show };
    if (sub === 'print') return { name: 'print', show };
    return { name: 'not-found' };
  }

  const route = $derived(match(router.path));
  const show = $derived(
    route.name === 'show' || route.name === 'room' || route.name === 'print' ? route.show : null,
  );

  // Theme + title follow the route. Set via the DOM API, never inline styles (CSP: style-src 'self').
  $effect(() => {
    // Each show's world applies through [data-world] (src/client/themes); the lobby has none.
    if (show) document.documentElement.dataset.world = SHOWS[show].world;
    else delete document.documentElement.dataset.world;
    document.title = show ? `${SHOWS[show].name} · WatchTogether` : 'WatchTogether';
  });

  // Intercept same-origin <a> clicks for client-side navigation.
  function onclick(event: MouseEvent) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey)
      return;
    const a = (event.target as Element | null)?.closest('a');
    if (!a || a.target || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    event.preventDefault();
    router.navigate(url.pathname + url.hash);
  }
</script>

<svelte:document {onclick} />

<main>
  {#if route.name === 'home'}
    <Home />
  {:else if route.name === 'privacy'}
    <Privacy />
  {:else if route.name === 'show'}
    {#key route.show}
      <ShowPage show={route.show} />
    {/key}
  {:else if route.name === 'print'}
    <!-- Rarely used, so it loads on demand and stays out of the first-load bundle. -->
    {#await import('./routes/PrintPage.svelte') then PrintPage}
      {#key route.show}
        <PrintPage.default show={route.show} />
      {/key}
    {:catch}
      <section class="container">
        <p class="error" role="alert">Couldn’t load the print page. Refresh to try again.</p>
      </section>
    {/await}
  {:else if route.name === 'room'}
    <!-- The room (card, chat, live connection) loads on demand, keeping the lobby's first load small. -->
    {#await import('./routes/RoomPage.svelte') then RoomPage}
      {#key route.show}
        <RoomPage.default show={route.show} />
      {/key}
    {:catch}
      <section class="container">
        <p class="error" role="alert">Couldn’t load the room. Refresh to try again.</p>
      </section>
    {/await}
  {:else}
    <NotFound />
  {/if}
</main>
<Footer />

<style>
  main {
    flex: 1;
  }
</style>
