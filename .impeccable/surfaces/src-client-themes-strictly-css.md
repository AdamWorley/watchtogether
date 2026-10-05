---
version: 1
slug: "src-client-themes-strictly-css"
primary_target: "src/client/themes/strictly.css"
related_targets: ["src/client/routes/ShowPage.svelte","src/client/components/Room.svelte","src/client/components/RoomRail.svelte"]
---

# Strictly Come Dancing world

Scope: /strictly show page, join screen, room (card, chat, people, claim moment), end states. Mode: Operate (the room); the show page is its doorway in the same world. This is Saturday-evening sofa viewing; it must stay glanceable and must never compete with the telly. Taps must be easy one-handed in the dark (the user's stated red line). Voice is already set in src/client/lib/voice.ts.

## Direction contract

THESIS: The room is cut from a ballroom costume, and every square you mark gets sewn with sequins in your own colour. This refuses the category default, a purple-and-gold sparkle theme sprinkled with stars.

OWN-WORLD: Black velvet plum ground (#140a1f), with chiffon-panel cells (#24132f) edged in fine rhinestone dots. Costume colours: fuchsia #ff2e93, turquoise #19d3c5, flame #ff7a1a, gold lamé #f5c542, emerald #23c06b and violet #9b5cff. Each person wears one of them, on their chat name, their sequins and their winning card. Sequins are an authored SVG disc pattern, masked and tinted. Display type is Limelight, a theatrical deco face, for headings, scores and calls; a system sans carries reading text. Inside the card, one type size does all the work. State is never colour alone: a marked square has a sequin texture and a stitched dashed edge, and a near-complete line's empty squares get a gold rhinestone glint.

STORY: A friend is "on the guest list" and picks a name. They get their costume colour and mark squares as the clichés land. Each mark is sewn with sequins that catch one sweep of light. Calling FULL HOUSE sends a single glitterball sweep across the winner's card for the whole room.

FIRST VIEWPORT: Room on a phone:
- A compact header with the show link, episode name, people count, closing time, the room code and a "Share invite link" button.
- Standard Bingo / Chat / People tabs.
- The card is a full-width costume panel of 25 square swatches with the centre labelled "FAB-U-LOUS · FREE".
- The call buttons sit beneath in fuchsia with dark text.

On desktop, the card sits left with chat and people right; the card owns the field and everything else recedes into the velvet.

FORM: Sequinned costume fabric, candidate 4 of my ordered list; seed key 9e1f96ef. Signature interaction: marking sews sequins into the square, as a sequin field revealed with one diagonal light sweep. Motion grammar: one sweep per mark, a staggered sweep across the winning card on a claim, and the near-line glint pulses at most twice; nothing loops; reduced motion leaves only instant state changes.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Amendment (user request, 2026-10-05)

The user asked for a heavier design on larger screens, accepting stylised sidebars. From 1200px the room is three columns: a world sidebar (280px), the card, then chat and people. The header moves into the sidebar.
- The Strictly sidebar is "the scoreboard": a velvet panel topped by a strip of sequins in your own costume colour. It holds the show link, the episode in Limelight, the closing time, and a gold-edged score paddle with rhinestone dots counting your marks ("6 of 24 · squares sewn") with your best line's progress.
- Below the paddle sit the people count, the room code and "Share invite link".
- The card grows to 680px beside it. The show page emblem scales 1.55× from 1100px.
