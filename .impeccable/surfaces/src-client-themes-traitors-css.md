---
version: 1
slug: "src-client-themes-traitors-css"
primary_target: "src/client/themes/traitors.css"
related_targets: ["src/client/routes/ShowPage.svelte","src/client/components/Room.svelte","src/client/components/RoomRail.svelte"]
---

# The Celebrity Traitors world

Scope: /traitors show page, join screen, room (spread, chat, people, claim moment), end states. Mode: Operate (the room); the show page is its doorway in the same world. Users glance between the telly and a phone in a dim lounge; marking must be easy to tap one-handed in the dark (the user's stated red line). Voice is already set in src/client/lib/voice.ts.

## Direction contract

THESIS: The bingo card is a tarot spread of 24 fates laid face up. Marking a square turns that card to its illuminated face. This refuses the category default, a dark app grid with a show-coloured accent and rounded tiles.

OWN-WORLD: Tarot de Marseille, flat. The ground is reading-cloth indigo (#17142e). Cards have bone faces with hard black keylines, small square corners, a roman numeral head and a caption plate. Colour is vermilion, ultramarine and chrome yellow, stencilled flat: no gradient, grain or glow. One display face (IM Fell English SC) sets the whole type ladder for numerals, headings, labels and buttons; a system sans carries reading text. Every card is the same size on one baseline. There are three state codes, never mixed: plain face, illuminated face (ultramarine flood, gilt keyline) and winning line (vermilion edge).

STORY: A friend joins from a group-chat link and is "summoned". They see their spread and tap cards as the show's clichés happen. Each tap turns a card. When they complete a line, they call it, and the whole room sees the spread invert for a beat and the reading land.

FIRST VIEWPORT: Room on a phone:
- A compact header with the show link, episode name, people count, closing time, the room code and a "Share invite link" button.
- Standard Bingo / Chat / People tabs.
- The spread fills the width: 5 columns of portrait cards (5:7). Each card has a numeral I–XXIV, text in a caption face, and the centre card "0 · THE FOOL · FREE".
- The call buttons sit beneath in chrome yellow.

On desktop, the spread sits left with chat and people right.

FORM: Tarot de Marseille spread, candidate 7 of my ordered list; seed key 7e4bd98d. Signature interaction: marking turns the card (rotateY through 90°, with the face colour swapping at the edge). Motion grammar: a single turn per mark; a called LINE produces one 120 ms inversion of the whole spread; nothing loops; reduced motion leaves only instant state changes.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Amendment (user request, 2026-10-05)

The user asked for a heavier design on larger screens, accepting stylised sidebars. From 1200px the room is three columns: a world sidebar (280px), the spread, then chat and people. The header moves into the sidebar.
- The Traitors sidebar is "the reading": an indigo panel with a gilt inner keyline, topped by a stencilled band of the deck's three inks (vermilion, ultramarine, chrome). It holds the show link, the episode in IM Fell, the closing time, and a turned tally card (ultramarine, gilt frame) counting your marks in roman numerals ("VI of XXIV · fates turned") with your best line's progress.
- Below the tally sit the people count, the room code and "Share invite link".
- The spread scales up beside it, sized to the viewport height so the calls stay in view. The show page emblem scales 1.55× from 1100px.
