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
- The headline is set at poster scale (up to 7.2rem, 800 weight), with "Bring everyone." in chrome yellow, over a telly test-card strip of eight bars drawn from both worlds' colours. A status line under the intro says how many shows are on air.
- A live door is a link, edged in its world accent and glowing, with a lit studio ON AIR lamp (red, slow breath) in its top-right corner and "Series premiere / Series N, episode N · rooms open until HH:MM".
- An off-air door is not a link: dashed edge, emblem greyscaled, copy dimmed. It shows "Next on <day, time>" (or "Series N starts …" for a new series) and "Rooms open at HH:MM · in <duration>". A new series adds a tilted "New series" tag in the world accent. With no episodes scheduled it reads "Off air until the next series is announced".
