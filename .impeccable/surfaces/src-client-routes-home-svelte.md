---
version: 1
slug: "src-client-routes-home-svelte"
primary_target: "src/client/routes/Home.svelte"
related_targets: []
---

# Home lobby

Scope: the home page (/) and shared pages (privacy, not found). Mode: Persuade-lite. A returning friend picks tonight's show in one tap. The lobby is a neutral room between two worlds, and each door is rendered in its own world.

## Direction contract

THESIS: The home page is a lobby with two doors, and each door is a live sample of its world, not a generic card. This refuses same-size icon cards and a hero banner.

OWN-WORLD: The lobby is a quiet charcoal TV-room ground (#121214) with bone text and a system sans. The Traitors door is a fanned three-card tarot spread on indigo. The Strictly door is a sequin swatch on velvet. Each door shows its next air time or "On now".

STORY: The visitor reads the one-line promise, sees both shows as physical objects from their worlds, and taps one.

FIRST VIEWPORT: The headline "The telly’s on. Bring everyone." with the short intro, then the two doors side by side on desktop and stacked on a phone. Each door is at least 220px tall with the show name in that world's display face, its tagline, and its enter line.

FORM: Lobby between the two rolled worlds; inherits seeds 7e4bd98d and 9e1f96ef; no separate roll. Signature interaction: hovering or focusing a door fans the tarot cards slightly, or sweeps the sequins once.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Amendment (user request, 2026-10-05)

The user asked for a punchier home page, an "On air" flourish for live shows, faded doors that can't be opened for shows that aren't on (showing when they're next on), and a distinct marker for a new series.
- The headline is set at poster scale (up to 7.2rem, 800 weight), with "Bring everyone." in chrome yellow, over the telly test-card strip of seven bars (the logo's bars). A status line under the intro says how many shows are on air.
- A live door is a link, edged in its world accent and glowing, with a lit studio ON AIR lamp (red, slow breath) in its top-right corner and "Series premiere / Series N, episode N · rooms open until HH:MM".
- An off-air door is not a link: dashed edge, emblem greyscaled, copy dimmed. It shows "Next on <day, time>" (or "Series N starts …" for a new series) and "Rooms open at HH:MM · in <duration>". A new series adds a tilted "New series" tag in the world accent. With no episodes scheduled it reads "Off air until the next series is announced".

## Amendment (user request, 2026-10-06)

The user found the lobby bland and the copy a flat description. Bolder in the lobby's own vocabulary (the brand telly and the test card), with no new fonts or colours:
- The headline spans the full width (capped at 6rem). The lead opens with a bold hook ("You already shout at the telly. Now you can score points for it.") and names the three things you get, predictions included. The status line names the shows on air or the next one up.
- The brand telly at hero scale (`HeroTelly.svelte`) flicks channels every 3.6s: a lobby-written line someone will shout at the screen, set as a broadcast subtitle over the dimmed test card, with a green on-screen channel number. Changing channel collapses the picture to a bright line and opens it out again. Under reduced motion it holds on the first channel.
- After the doors, "Tonight's running order" is a TV-listings list: Doors open, Eyes down, Place your bets, Lights out.

## Amendment (critique fixes, 2026-10-06)

A critique (28/40) found the doors below the fold, a self-contradicting error state, an overclaiming hook and heavy off-night states. The fixes:
- **Order.** The hero is the headline, the test-card strip, a one-line hook ("You already shout at the telly. Now it's a game.") and the status line. On a live night it tightens (h1 up to 4.6rem) and the "On air now" doors follow straight after. The lead paragraph and the telly come after the doors, side by side from 860px and stacked on phones. On any other night the pitch follows the hero directly.
- **States.**
  - Loading doors are quiet and solid, not dashed, so they never read as closed.
  - A failed schedule gets its own group, "The shows · times unavailable": plain links that are never styled as live. The status line says so and offers "Try again".
  - Every non-live door is compact.
  - With nothing on, the headline reads "The telly's off. Not for long." and the listings heading drops "Tonight's" unless an episode airs later today.
- **Telly.** It quotes only shows that are live or next up, dealt round-robin. Subtitle text has a floor of 13px and its label 11px, with em-based box padding.
- **ON AIR lamp.** It sits in flow above the door title, so long names never run under it.
