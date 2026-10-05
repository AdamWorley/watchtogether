---
version: 1
slug: "src-client-themes-ice-css"
primary_target: "src/client/themes/ice.css"
related_targets: ["src/client/components/WorldEmblem.svelte","src/client/components/BingoCard.svelte"]
---

# Dancing on Ice world

Scope: /dancing-on-ice show page, join screen, room, end screens and home door. Mode: Operate (the room). The show is currently off air (TVmaze lists it as ended), so its home door and show page mostly render in the off-air state; the user chose to add it anyway. The user's red line is "hard to tap in the dark". The user delegated the direction choice.

## Direction contract

THESIS: The bingo card is a 1980s light-entertainment rink. Dark ice tiles flood ice-cyan when marked, and a star-filter glint flashes across them. This refuses the default of a pale frosty-white snowflake theme.

OWN-WORLD:
- Deep studio-blue ground (#071330) with violet and cyan studio-light washes.
- Dark ice tiles (#10305c) with frost-highlight edges.
- Marked tiles are ice-cyan (#5ee7ff) with navy lettering, and the FREE centre is Bolero violet (#7a3cf0) with gold.
- Display lettering is bevelled silver: a solid colour with an offset shadow, never gradient text.
- Righteous (80s geometric) is the display face; a system sans carries reading text.
- State is never colour alone: a marked tile has a cyan flood plus a four-point glint star; a winning line gets a gold edge; the tile that would finish a line gets a dashed frost edge.

STORY: A skater joins ("Your skates are laced"). Each mark floods a tile and flashes a glint, and a claim streaks light across every marked tile.

FIRST VIEWPORT: Phone room:
- A compact header.
- Standard tabs.
- A full-width 5×5 rink with the "Bolero · FREE" centre.
- Cyan pill calls.

Desktop at 1200px and wider: a scoreboard sidebar (a violet-to-cyan header and a gold-edged tally of "squares landed"), the rink, then chat and people. The home door is the oval rink emblem with "6.0".

FORM: 1980s light-entertainment TV, candidate 5 of my ordered list; seed key acbe8a4d. Signature interaction: the glint (the star scales and rotates in while a light streak crosses). Motion: one glint per mark, a streak across marked tiles on a claim, nothing loops, and reduced motion leaves instant states only.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
