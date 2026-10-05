---
version: 1
slug: "src-client-themes-bakeoff-css"
primary_target: "src/client/themes/bakeoff.css"
related_targets: ["src/client/components/WorldEmblem.svelte","src/client/components/BingoCard.svelte"]
---

# The Great British Bake Off world

Scope: /bake-off show page, join screen, room, end screens and home door. Mode: Operate (the room). Users watch on Tuesday evenings with the telly as the main light. The user's red line is "hard to tap in the dark". The user delegated the direction choice ("pick for me").

## Direction contract

THESIS: The bingo card is a tray of pastel fondant tiles edged in piped royal icing. Marking one showers it in hundreds-and-thousands. This refuses the cream-paper-and-serif "baking" default and the gingham cliché.

OWN-WORLD:
- Dark chocolate-ganache ground (#22120c).
- Fondant tiles cycle through pink #f6b7c8, mint #a8e3cf, lemon #f6e39a and lavender #cdbcf0, with cocoa (#3a2016) lettering and a dotted piped-icing border.
- Raspberry (#e5466b) and gold (#e8b04a) are the accents.
- Sprinkles are an authored multi-colour SVG.
- Leckerli One (a rounded piped script) is the display face; a system sans carries reading text.
- State is never colour alone: a marked tile has sprinkles, a solid piped edge and a glazed label plate; a winning line gets a gold-leaf edge; the tile that would finish a line gets raspberry dotted piping.

STORY: A baker takes their bench ("Your bench is ready"). Each mark showers sprinkles, and calling a LINE reshowers the tray row by row.

FIRST VIEWPORT: Phone room:
- A compact header.
- Standard tabs.
- A full-width 5×5 fondant tray with the "Star Baker · FREE" centre.
- Pink pill calls.

Desktop at 1200px and wider: a bench sidebar (a bunting header and a pink tally tile of "squares iced"), the tray, then chat and people.

FORM: Piped icing and sprinkles, candidate 5 of my ordered list; seed key 91d5fa9e. Signature interaction: a sprinkle shower (the texture falls in). Motion: one shower per mark, a row-by-row shower on a claim, nothing loops, and reduced motion leaves instant states only.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
