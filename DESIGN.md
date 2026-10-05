---
name: WatchTogether
description: Live-episode bingo and chat rooms for UK reality TV, one neutral lobby and a hand-made world per show.
colors:
  # Lobby (app.css :root). Also the defaults every world overrides.
  lobby-charcoal: '#121214'
  lobby-surface: '#1b1b1f'
  lobby-surface-raised: '#26262b'
  lobby-bone: '#f1efe9'
  lobby-muted: '#aaa69e'
  lobby-border: '#34343b'
  lobby-danger: '#ff7b6e'
  lobby-ok: '#6fd39a'
  on-air-red: '#e3261b'
  # The Celebrity Traitors / The Traitors: [data-world='traitors']
  reading-cloth-indigo: '#17142e'
  traitors-surface: '#201c3f'
  traitors-surface-raised: '#2a2552'
  traitors-text: '#ece5d3'
  traitors-muted: '#b3abc6'
  tarot-ink: '#0e0b1c'
  tarot-bone: '#e6dfcd'
  stencil-vermilion: '#d8402b'
  stencil-ultramarine: '#2c4bb0'
  chrome-yellow: '#f2c230'
  # Strictly Come Dancing: [data-world='strictly']
  velvet-plum: '#140a1f'
  strictly-surface: '#1e1029'
  chiffon-panel: '#26142f'
  strictly-text: '#f7f2ff'
  strictly-muted: '#c3b2dc'
  strictly-border: '#3d2552'
  costume-fuchsia: '#ff2e93'
  costume-turquoise: '#19d3c5'
  costume-flame: '#ff7a1a'
  gold-lame: '#f5c542'
  costume-emerald: '#23c06b'
  costume-violet: '#a678ff'
  # I'm a Celebrity: [data-world='jungle']
  jungle-night: '#0c1710'
  jungle-surface: '#14231a'
  jungle-text: '#f3ead8'
  jungle-muted: '#b9c2a8'
  camp-cedar: '#a8743d'
  char-keyline: '#2e1b0e'
  pinstripe-brown: '#6b4220'
  torch-orange: '#ff8a1f'
  ember-glow: '#ffc46b'
  lashing-rope: '#cfa86a'
  scorch-core: '#170a04'
  brand-burn: '#8a3b0f'
  # The Great British Bake Off: [data-world='bakeoff']
  chocolate-ganache: '#22120c'
  bakeoff-surface: '#2e1912'
  bakeoff-text: '#fbefe6'
  bakeoff-muted: '#d6bfb1'
  fondant-pink: '#f6b7c8'
  fondant-mint: '#a8e3cf'
  fondant-lemon: '#f6e39a'
  fondant-lavender: '#cdbcf0'
  royal-icing: '#fff8f1'
  raspberry-piping: '#e5466b'
  gold-leaf: '#e8b04a'
  cocoa: '#3a2016'
  # Dancing on Ice: [data-world='ice']
  studio-blue: '#071330'
  ice-surface: '#0d1f47'
  ice-text: '#ecf6ff'
  ice-muted: '#a9bddc'
  ice-border: '#22406f'
  rink-blue: '#10305c'
  rink-edge: '#2b5a94'
  frost: '#8fd3ff'
  ice-cyan: '#5ee7ff'
  bolero-violet: '#7a3cf0'
  perfect-score-gold: '#ffcc33'
  bevel-silver: '#dfe8f5'
typography:
  display:
    fontSize: 'clamp(2.1rem, 7vw, 3.6rem)'
    fontWeight: 400
    lineHeight: 1.08
  headline:
    fontSize: 'clamp(1.35rem, 4vw, 1.85rem)'
    fontWeight: 400
    lineHeight: 1.08
  title:
    fontSize: '1.2rem'
    fontWeight: 400
    lineHeight: 1.08
  body:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: '16px'
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: '16px'
    fontWeight: 600
    lineHeight: 1.5
  button:
    fontSize: '1rem'
    fontWeight: 600
    letterSpacing: '0.01em'
  tile-caption:
    fontSize: 'clamp(0.6rem, 2.35vw, 0.86rem)'
    fontWeight: 700
    lineHeight: 1.15
  room-code:
    fontFamily: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace"
    letterSpacing: '0.08em'
    fontFeature: "'tnum'"
  display-traitors:
    fontFamily: "'IM Fell English SC', 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif"
    fontWeight: 400
    letterSpacing: '0.01em'
  display-strictly:
    fontFamily: "'Limelight', 'Didot', 'Bodoni 72', Georgia, serif"
    fontWeight: 400
    letterSpacing: '0.005em'
  display-jungle:
    fontFamily: "'Rye', 'Rockwell', Georgia, serif"
    fontWeight: 400
    letterSpacing: '0.01em'
  display-bakeoff:
    fontFamily: "'Leckerli One', 'Brush Script MT', Georgia, serif"
    fontWeight: 400
    letterSpacing: '0'
  display-ice:
    fontFamily: "'Righteous', 'Avant Garde', 'Century Gothic', sans-serif"
    fontWeight: 400
    letterSpacing: '0.02em'
rounded:
  lobby-panel: '14px'
  lobby-control: '999px'
  lobby-input: '10px'
  traitors-panel: '4px'
  traitors-control: '3px'
  traitors-input: '3px'
  strictly-panel: '18px'
  strictly-control: '999px'
  strictly-input: '12px'
  strictly-tile: '10px'
  jungle-panel: '10px'
  jungle-control: '8px'
  jungle-input: '8px'
  jungle-tile: '6px'
  bakeoff-panel: '20px'
  bakeoff-control: '999px'
  bakeoff-input: '14px'
  bakeoff-tile: '14px'
  ice-panel: '12px'
  ice-control: '999px'
  ice-input: '10px'
  ice-tile: '10px'
spacing:
  gutter: '16px'
  panel: '20px'
  field: '14px'
  layout: '16px'
  layout-wide: '24px'
  control-height: '48px'
  control-height-small: '40px'
  tab-height: '46px'
  button-inline: '22px'
  button-small-inline: '14px'
  input-inline: '14px'
components:
  button-primary:
    backgroundColor: '{colors.lobby-bone}'
    textColor: '{colors.lobby-charcoal}'
    typography: '{typography.button}'
    rounded: '{rounded.lobby-control}'
    padding: '0 22px'
    height: '48px'
  button-secondary:
    backgroundColor: 'transparent'
    textColor: '{colors.lobby-bone}'
    typography: '{typography.button}'
    rounded: '{rounded.lobby-control}'
    padding: '0 22px'
    height: '48px'
  button-danger:
    backgroundColor: 'transparent'
    textColor: '{colors.lobby-danger}'
    rounded: '{rounded.lobby-control}'
    padding: '0 22px'
    height: '48px'
  button-small:
    rounded: '{rounded.lobby-control}'
    padding: '0 14px'
    height: '40px'
  input-text:
    backgroundColor: '{colors.lobby-surface-raised}'
    textColor: '{colors.lobby-bone}'
    typography: '{typography.body}'
    rounded: '{rounded.lobby-input}'
    padding: '0 14px'
    height: '48px'
  tab:
    backgroundColor: '{colors.lobby-surface}'
    textColor: '{colors.lobby-bone}'
    rounded: '{rounded.lobby-control}'
    height: '46px'
  tab-active:
    backgroundColor: '{colors.lobby-bone}'
    textColor: '{colors.lobby-charcoal}'
    rounded: '{rounded.lobby-control}'
    height: '46px'
  panel:
    backgroundColor: '{colors.lobby-surface}'
    textColor: '{colors.lobby-bone}'
    rounded: '{rounded.lobby-panel}'
    padding: '20px'
  room-code-plate:
    backgroundColor: '{colors.lobby-surface-raised}'
    textColor: '{colors.lobby-bone}'
    typography: '{typography.room-code}'
    rounded: '{rounded.lobby-input}'
    padding: '8px 12px'
  on-air-lamp:
    backgroundColor: '{colors.on-air-red}'
    textColor: '#fff4ef'
    rounded: '6px'
    padding: '6px 12px 5px'
  tile-traitors:
    backgroundColor: '{colors.tarot-bone}'
    textColor: '{colors.tarot-ink}'
    typography: '{typography.tile-caption}'
    rounded: '{rounded.traitors-panel}'
  tile-traitors-marked:
    backgroundColor: '{colors.stencil-ultramarine}'
    textColor: '{colors.tarot-bone}'
    rounded: '{rounded.traitors-panel}'
  tile-strictly:
    backgroundColor: '{colors.chiffon-panel}'
    textColor: '{colors.strictly-text}'
    typography: '{typography.tile-caption}'
    rounded: '{rounded.strictly-tile}'
    padding: '4px'
  tile-jungle:
    backgroundColor: '{colors.camp-cedar}'
    textColor: '#22120a'
    typography: '{typography.tile-caption}'
    rounded: '{rounded.jungle-tile}'
    padding: '7px'
  tile-bakeoff:
    backgroundColor: '{colors.fondant-pink}'
    textColor: '{colors.cocoa}'
    typography: '{typography.tile-caption}'
    rounded: '{rounded.bakeoff-tile}'
    padding: '7px'
  tile-ice:
    backgroundColor: '{colors.rink-blue}'
    textColor: '{colors.ice-text}'
    typography: '{typography.tile-caption}'
    rounded: '{rounded.ice-tile}'
    padding: '6px 5px'
  tile-ice-marked:
    backgroundColor: '{colors.ice-cyan}'
    textColor: '#04203a'
    rounded: '{rounded.ice-tile}'
---

# Design System: WatchTogether

## Overview

**Creative North Star: "One Living Room, Five Studios"**

WatchTogether is one product with a quiet lobby and five per-show worlds. The lobby is the dim living room where the telly is the main light: a charcoal ground, bone text and a plain sans. Each show is a studio set you step into, with its own type, palette, density and one signature move: The Traitors is a tarot spread, Strictly is sequinned costume fabric, I'm a Celeb is sign-painted camp planks, Bake Off is piped icing and sprinkles, and Dancing on Ice is a 1980s light-entertainment rink. Several shows can share one world (`src/shared/shows.ts` maps The Traitors and The Celebrity Traitors to `traitors`).

The structure never changes; only the skin does. Every page is built from standard tabs, buttons, inputs, panels and a 5×5 card made of real buttons. Components read tokens and nothing else. A world applies through `[data-world=…]`: on `<html>` for a show's pages, and on each home door so the lobby shows every world as a physical sample of itself. Worlds override the same token contract from `src/client/app.css` and add their material (keylines, sequin masks, icing, rope, glints) on top of the shared structure.

The system is built for glances in a dark room, one-handed, while the show is on. It is dark everywhere (`color-scheme: dark`), state is always carried by two signals, and motion happens once per action and then stops. The hard constraints are part of the design: a strict CSP (no inline styles, no external fonts), Trusted Types, and a 60 KB gzip first-load JS budget. Those constraints are why state lives in classes and data attributes, and why every face is a self-hosted woff2.

**Key Characteristics:**

- One token contract, six skins (the lobby plus five worlds), and fixed structure.
- Dark grounds everywhere: charcoal, indigo, velvet, jungle night, ganache and studio blue.
- One self-hosted display face per world, with the system sans for all reading text.
- A 5×5 card of real buttons whose marked state is a material change (a turned card, sewn sequins, a brand, sprinkles, a flood with a glint), never a colour change alone.
- One signature animation per mark and one full-card event per claim. Nothing else moves.

## Colors

Each world is a closed palette of named physical materials over a dark ground, and the lobby is a neutral charcoal that keeps every world's colour for its own door.

### Primary

- **Telly Bone** (lobby-bone): the lobby's text and its accent. It fills the lobby's primary buttons and active tab with charcoal lettering, so the lobby has no hue of its own.
- **Chrome Yellow** (chrome-yellow): the Traitors accent. It fills buttons, focus rings, the gilt inner keyline of a turned card and its numeral.
- **Costume Fuchsia** (costume-fuchsia): the Strictly accent, used on buttons, active tabs and the default sequin colour. Focus is turquoise.
- **Torch Orange** (torch-orange): the I'm a Celeb accent. It fills buttons, the torch-lit keyline of a branded plank, and the dashed rope on the plank that would finish a line. Focus is ember.
- **Fondant Pink** (fondant-pink): the Bake Off accent, used on buttons with cocoa lettering, the first fondant in the tray, the cake emblem and the rail bunting. Focus is lemon.
- **Ice Cyan** (ice-cyan): the Dancing on Ice accent. It fills buttons and floods marked tiles. Focus is perfect-score gold.

### Secondary

- **Stencil Ultramarine** and **Stencil Vermilion**: the Traitors' other two stencil inks. Ultramarine floods an illuminated (turned) card, and vermilion marks the winning-line edge. Together with chrome they make the three-ink rail band.
- **Gold Lamé** (gold-lame): Strictly's free-square sequins, its winning-line edge, the near-line glint and the score paddle.
- **Camp Cedar**, **Char Keyline** and **Pinstripe Brown**: the I'm a Celeb plank is flat cedar with a char border and a brown painter's pinstripe inset. A branded plank scorches outward from **Scorch Core** around a **Brand Burn** star.
- **Royal Icing** (royal-icing): Bake Off's piped dotted edge, which becomes solid when a tile is marked. It is also the glaze behind marked captions.
- **Bolero Violet** (bolero-violet): the Dancing on Ice free centre and the left end of the rail's lighting strip.

### Tertiary

- **Costume colours** (fuchsia, turquoise, flame, gold lamé, emerald, violet): Strictly's per-person slots. Each person wears one colour on their chat name, their sequins and their rail strip.
- **Fondants** (pink, mint, lemon, lavender): Bake Off cycles four fondants across the tray with `4n` selectors. **Raspberry Piping** marks the near-line tile and the FREE label, and **Gold Leaf** is the free tile and the winning edge.
- **Frost**, **Perfect-Score Gold** and **Bevel Silver**: on Dancing on Ice, frost is the dashed near-line edge, gold is the winning edge and score, and silver is the bevelled display lettering.
- **On-Air Red** (on-air-red): only the lobby's studio ON AIR lamp.

### Neutral

- Each world defines `--bg`, `--surface`, `--surface-2`, `--text`, `--muted` and `--border` in its own hue family. They are listed in the frontmatter as `<world>-surface`, `<world>-text`, `<world>-muted` and the named ground (`reading-cloth-indigo`, `velvet-plum`, `jungle-night`, `chocolate-ganache`, `studio-blue`). Traitors' `--border` is near-black tarot ink, so its panels read as woodcut.
- `--danger`, `--ok` and `--selection` are re-tinted per world so they stay legible on its ground.

### Named Rules

**The Contract Rule.** A world may only override the shared contract: `--font-body`, `--font-display`, `--display-case`, `--display-tracking`; `--bg`, `--surface`, `--surface-2`, `--text`, `--muted`, `--border`, `--accent`, `--accent-text`, `--danger`, `--ok`, `--focus`, `--selection`; `--radius`, `--radius-control`, `--radius-input`, `--keyline`, `--shadow`; `--btn-tracking`, `--btn-size`, `--btn-small-size`, `--btn-weight`; and `--c0` to `--c5`. Its material names (`--bone`, `--cedar`, `--icing`) stay private to its stylesheet. Components never read a world's private names.

**The Per-Person Slot Rule.** A person's colour reaches the page only through `data-c="0…5"`, which sets `--person` from `--c0…--c5`. Every world redefines all six slots so they are readable on its own ground. Never write a person's colour as an inline style.

**The Two-Signal Rule.** State is never colour alone. A marked tile changes material (a turned face, sequin texture with a stitched edge, a scorch with a burned star, sprinkles with solid piping, a flood with a glint). A near-line tile gains a dashed or dotted edge. A disabled button gets a dimmed fill, muted lettering and a dashed edge. An off-air home door is dashed and desaturated.

## Typography

**Display Font:** one self-hosted face per world: IM Fell English SC (Traitors), Limelight (Strictly), Rye (I'm a Celeb), Leckerli One (Bake Off) and Righteous (Dancing on Ice). Each has its own serif or sans fallback stack.
**Body Font:** the system sans stack, in every world.
**Label/Mono Font:** `ui-monospace` for room codes only, with tabular figures and 0.08–0.1em tracking.

**Character:** a theatrical, period-specific display face against a plain, quick-reading sans. The display face sets headings, buttons, tabs, the tally, the free square and the claim banner. Reading text, captions, chat and meta stay in the sans.

### Hierarchy

- **Display** (400, clamp(2.1rem, 7vw, 3.6rem), 1.08): page titles. The show page scales it to clamp(2.2rem, 8vw, 4.2rem) and the room to clamp(1.5rem, 5vw, 2.3rem). Headings balance their wrap.
- **Headline** (400, clamp(1.35rem, 4vw, 1.85rem), 1.08): panel headings.
- **Title** (400, 1.2rem, 1.08): door names and minor headings. Doors scale it up to clamp(1.8rem, 4.4vw, 2.8rem).
- **Body** (400, 16px, 1.5): all reading text. Leads cap at 56–60ch. Inputs stay at 16px to prevent iOS zoom.
- **Label** (600, 16px): form labels and the `.when` meta lines (700).
- **Button** (world `--btn-weight`, `--btn-size` 1–1.12rem, `--btn-tracking`): set in the display face, using the world's display case.
- **Tile caption** (600–700, clamp(0.6rem, 2.35vw, 0.86rem), 1.15): the one size that does all the work inside a card.

### Named Rules

**The One Face Per World Rule.** Each world ships exactly one OFL display face as a latin-subset woff2 under `src/client/assets/fonts/` (licences in `LICENSES.md`), declared with `font-display: swap`. Nothing loads from a font CDN; the CSP forbids it.

**The Whole-Ladder Rule (Traitors only).** In the Traitors world the display face also sets labels, tags, fact lists, the tally line and the countdown label at weight 400. The other worlds keep labels in the sans.

**The Frame Clearance Rule.** A caption never crosses its tile's frame and never splits a word without a hyphen. Each world sets the tile's padding to clear its own frame (Traitors' inner keyline sits 4.5px in; the jungle pinstripe sits 4.5px in and its rope 6px in; Bake Off's piping is 3px wide and sits 6px in). Hyphenation is limited to words of 9 or more characters (`hyphenate-limit-chars: 9 4 3`) and is manual from 900px up. If the widest unbreakable word still doesn't fit, `lib/fit.ts` steps the caption down through `fit-1`, `fit-2` and `fit-3` (0.9em, 0.82em, 0.75em). The tile padding never shrinks to make room. `test/e2e/captions.spec.ts` enforces this.

## Layout

The layout is mobile-first and shared by every world. `.container` caps at 1120px with a 16px gutter. Panels pad 20px, fields sit 14px apart, and labels sit 6px above their inputs.

- **Room, phones (under 900px):** a sticky three-tab bar (Bingo, Chat, People; 46px tall, 4px apart) shows one panel at a time. The chat fills `100dvh - 76px` so the composer stays in reach. A claim arrives as a bottom sheet under 600px.
- **Room, 900px and up:** the tabs disappear. The card and chat sit side by side (3fr and minmax(320px, 2fr)), with People under Chat.
- **Room, 1200px and up:** a three-column room up to 1440px wide: a 280px world rail, the card, and chat plus People (320–380px), with 24px gaps. The rail takes over the header's job and holds the rail head (each world's band), the episode title, a tally plate, facts, the room code and Share.
- **The card:** a 5-column grid (default max 640px). Worlds set the gap (3–9px, clamped), the row height and the max width (680px from 1200px; Traitors sizes its spread from the viewport height). Rows share one height so a long caption makes the whole card taller, not one tile.
- **The lobby:** a hero (headline, a test-card bar, the lead and a live status line), then an "On air now" group of large doors (min 520px columns; an odd last door spans the full width and gets a 1.4× emblem), then a compact "Coming up" row (min 330px columns, emblem at 0.62×). Under 560px, doors stack with the emblem centred.
- **Show page:** the intro and world emblem sit in the hero (the emblem scales 1.55× from 1100px and 0.82× under 560px), with a 3fr/2fr panel pair from 800px.

## Elevation & Depth

The system uses soft shadows with tonal layering. Depth means objects resting on a dark cloth: panels lift with a two-part `--shadow` (a tight contact shadow plus a long ambient drop), and surfaces step up from `--bg` to `--surface` to `--surface-2`. Each world tunes `--shadow` to its own ground colour. Depth inside a tile comes from the tile's material, not from more elevation.

### Shadow Vocabulary

- **Lobby panel** (`0 2px 4px rgb(0 0 0 / 0.25), 0 12px 32px rgb(0 0 0 / 0.3)`): the default `--shadow`.
- **World panels:** Traitors `0 2px 0 rgb(0 0 0 / 0.45), 0 10px 24px rgb(5 3 15 / 0.55)`; Strictly `0 2px 6px rgb(0 0 0 / 0.35), 0 18px 40px rgb(6 0 14 / 0.55)`; I'm a Celeb `0 2px 0 rgb(0 0 0 / 0.4), 0 14px 30px rgb(0 0 0 / 0.5)`; Bake Off `0 2px 6px rgb(0 0 0 / 0.35), 0 16px 34px rgb(10 3 0 / 0.5)`; Dancing on Ice `0 2px 6px rgb(0 0 0 / 0.4), 0 18px 40px rgb(0 4 20 / 0.55)`.
- **Inset keylines:** stacked `inset 0 0 0 Npx` rings draw printed frames inside a border. Examples are the tarot card's inner frame, the plank pinstripe, the Traitors panel's gilt rule and the jungle panel's cedar lintel. They are drawn lines, not elevation.
- **Live door glow** (`0 24px 60px color-mix(in srgb, var(--accent) 22%, transparent)`): only on a lobby door that is on air.

### Named Rules

**The Thickness Rule.** The crisp 2–3px drop under a tile (`0 2px 0` or `0 3px 0` at 0.35–0.5 black) is the thickness of that world's object: a card, a plank, a fondant tile or an ice tile. It always comes with that world's material, and on panels it always pairs with a soft ambient drop. It is not a standalone offset-shadow device.

## Shapes

Corners come from the world. Traitors is near-square (4px panels, 3px controls), like a printed card. Jungle is a cut plank (10px panels, 8px controls, 6px tiles). Ice is a softened rink board (12px panels, 10px tiles, pill controls). Strictly is costume-soft (18px panels, 10px tiles, pill controls). Bake Off is the roundest (20px panels, 14px tiles, pill controls). The lobby uses 14px panels and pill controls. `--keyline` sets every border weight: 1px for the lobby, Strictly and Ice, and 2px for Traitors, Jungle and Bake Off.

Each world also adds one recurring edge to every panel. Traitors gets an ink border with a gilt inner keyline. Strictly gets a dotted rhinestone outline 9px in. Jungle gets a cedar lintel across the top (the panel pads 28px at the top to clear it). Bake Off gets dotted piping 10px in. Ice gets a cyan light along the top edge. Compact read-only cards (someone else's claim) drop the frame, shadow and numerals, and keep only the state codes at 2–4px corners.

## Components

### Buttons

Full-height, tactile and set in the world's display face.

- **Shape:** `--radius-control`: pill (999px) in the lobby, Strictly, Bake Off and Ice; 3px in Traitors; 8px in Jungle.
- **Primary:** `--accent` fill with `--accent-text` lettering, 48px minimum height, 22px side padding. Size, weight and tracking come from the world's `--btn-*` values.
- **Hover / Focus / Active:** `brightness(1.08)` on hover, a 1px press on active (0.08s ease-out), and a 3px `--focus` outline offset 2px.
- **Secondary:** transparent with a `--border` edge and `--text` lettering. **Danger:** transparent with `--danger` lettering and a `currentColor` edge. **Small:** 40px tall, 14px side padding, `--btn-small-size`.
- **Disabled:** an 18% accent mix over `--surface`, `--muted` lettering and a dashed 35% text-mix edge. Traitors substitutes an indigo plate.

### Chips

- **Style:** person tags (HOST, YOU) are 0.72rem uppercase at 0.06em tracking, `--muted`, on a pill with a 1px `--border` edge. A winner tag swaps to `--accent` with a `currentColor` edge.
- **State:** the online dot uses `--ok` fill and offline uses `--border`. The name next to it carries the text, so the dot is never the only signal.

### Cards / Containers

- **Corner Style:** `--radius`.
- **Background:** `--surface`.
- **Shadow Strategy:** `--shadow` (see Elevation & Depth), plus the world's panel edge.
- **Border:** `--keyline` solid `--border`.
- **Internal Padding:** 20px. Jungle pads 28px at the top under the lintel.

### Inputs / Fields

- **Style:** `--surface-2` fill, `--keyline` `--border` edge, `--radius-input` (10px fallback), 48px tall, 14px side padding, 16px text. The placeholder is `--muted` at 0.85 opacity. The join-code input is uppercase at 0.08em tracking.
- **Focus:** the global 3px `--focus` outline offset 2px.
- **Error / Disabled:** `.error` text in `--danger` at 600, 10px below the field.

### Navigation

- **Room tabs:** a sticky bar on `--bg` with three equal tabs, 46px tall, in the display face at 1.05rem with `--radius-control`. An inactive tab is `--surface` with a `--border` edge. The active tab is `--accent` with `--accent-text` and also carries `aria-pressed`. Chat shows a pill unread count. The bar is hidden from 900px.
- **Back links:** the parent page's name, underlined at 40% text mix with a drawn 2px chevron, weight 600. They sit above the title as navigation and never stand in for a label.

### Bingo Card (signature)

A 5×5 grid of real `<button>`s with `aria-pressed`, plus a free centre. State lives in `data-state` (plain, marked, free, win) and `data-near`. `just-changed` fires the signature move, and `.event` on the grid plays the claim moment. Each world skins the tile:

- **Traitors:** a 5:7 tarot card with a bone face, ink border, inner keyline and a roman-numeral head. Marking it spins the card a full turn over 600ms: the authored back (`cardback.svg`) shows through the middle of the spin, and the colours swap at the three-quarter edge to an ultramarine face with a gilt keyline. On joining, the spread is dealt face-down and turns face-up in a 35ms-per-card ripple. The win state adds a vermilion edge. A claimed LINE inverts the whole spread for 150ms.
- **Strictly:** a chiffon panel with a dotted rhinestone edge. Marking sews in the wearer's `--person` sequins (a masked `sequins.svg`) with a white stitched edge, and the caption sits on a velvet plate. One 720ms light sweep crosses the new sequins. The near-line tile gets a gold dotted glint that pulses twice. A claim sweeps the card column by column.
- **I'm a Celeb:** a flat cedar plank. Marking scorches it radially and burns in a `star.svg` brand with an ember rim (a 420ms flare). The win state turns the edge and stars gold. The near-line tile is lashed with dashed torch rope. A claim flares every branded plank.
- **Bake Off:** pastel fondant with dotted royal-icing piping. Marking showers `sprinkles.svg` in over 460ms, the piping turns solid, and the caption sits on an icing glaze. The win state gets a gold-leaf edge. The near-line tile gets raspberry piping. A claim showers the tray row by row.
- **Dancing on Ice:** a dark rink tile with a frost top light. Marking floods it ice-cyan, and a `glint.svg` star spins in (520ms) while a light streak crosses. The win state gets a gold edge. The near-line tile gets a dashed frost edge. The free centre is bolero violet.

### Tarot Card Back (Traitors)

`cardback.svg` is an authored back in the deck's own inks, drawn with 180° rotational symmetry like a real tarot back:

- an ultramarine field with a fine chrome lattice and star crossings
- a bone outer keyline and a gilt inner frame
- mirrored vermilion turrets top and bottom
- a sun-and-moon medallion at the centre

It appears only while a card is face-down: mid-turn, during the deal, as the left card of the emblem fan, and as the sidebar deck. The deck stacks three backs beside "N still face down" in roman numerals.

### Printable Cards

`/{show}/print` deals 1–24 unique cards, using the same uniqueness rule as a live room, for offline play with a pen. On screen they are white paper sheets on the world's ground. In print they are ink only, two per A4 page, with a name line. Each sheet keeps its world's display face for the title and FREE square, and Traitors keeps its roman numerals. The page loads on demand, so it never adds to the first-load budget.

### Telly Mode

Telly mode is a full-screen view, loaded on demand, for casting the room to the TV. Its type is sized in `vw` and `vh` so it can be read from the sofa.

- **Leaderboard:** headed by the world's `voice.board`. Rows are ranked by full house, then line, then best line, then squares marked. Each row shows the name in its person colour, five best-line pips and the marked count. Only counts are shared, never which squares.
- **Side column:** a black-on-white QR code (always, so phones can scan it), the room code and the last five feed items.
- **Leaving:** Esc or "Leave telly mode" exits.

### Full-House Finale

When someone calls FULL HOUSE, an overlay shows one object from the world, the world's `finale.title` and the winner's name:

- **Traitors:** a card turns from its back to an ultramarine XXIV face.
- **Strictly:** a sequin glitterball drops and a gold 10 paddle goes up.
- **I'm a Celeb:** the camp sign flares as its star burns in.
- **Bake Off:** a Star Baker rosette spins in.
- **Dancing on Ice:** three 6.0s flip up.

Motion uses `cubic-bezier(0.16, 1, 0.3, 1)` with no overshoot. The overlay closes after 7s, on Esc or with its button.

### Card Keepsake

"Save my card" draws a 1080×1350 PNG on the device; nothing is uploaded. It reads the live world tokens and display face. It shows the card with marked tiles in the accent colour, the tally (roman numerals for Traitors), the player's calls and a watchtogether.uk date line. On phones it opens the share sheet, and elsewhere it downloads the file. It is offered in the room and on the ended screen.

### World Emblem and Lobby Door

Each world has a decorative, `aria-hidden` emblem: three fanned tarot cards, a sequin swatch with a score paddle, a hanging camp sign, a cake seen from above with a rosette, or a rink with a 6.0 score and glints. On the show page and on its home door, the emblem reacts to hover and focus with its world's move.

- **Door:** a lobby `<a>` that carries `data-world`, so its `--bg`, border, radius, shadow and accent are the world's own. It lifts 4px on hover over 0.25s with `cubic-bezier(0.2, 0.8, 0.2, 1)`.
- **Live door:** a 70% accent border, an accent glow, and the studio ON AIR lamp (On-Air Red, uppercase, 0.18em tracking, pulsing over 2.6s).
- **Off-air door:** not a link. It is a `<div>` with a dashed border, no shadow, and an emblem at `grayscale(0.85) brightness(0.7)`.

## Do's and Don'ts

### Do:

- **Do** read only contract tokens in components, and skin a new surface by overriding the contract under `[data-world=…]`.
- **Do** carry state in classes and data attributes (`data-state`, `data-near`, `data-c`, `data-tab`, `fit-1…3`). The CSP forbids `style` attributes.
- **Do** pair every colour change with a second signal: texture, a stitched, dotted or dashed edge, a burned mark, a glint, or text.
- **Do** keep one signature move per mark and one full-card event per claim. Nothing in a card loops (Strictly's near-line glint stops after two pulses), and `prefers-reduced-motion` reduces everything to instant state changes.
- **Do** set each world's tile padding to clear its own frame, and let `lib/fit.ts` step the caption size down rather than shrinking that padding.
- **Do** self-host each world's single display face as an OFL latin woff2 with `font-display: swap`, and record it in `LICENSES.md`.
- **Do** redefine all six `--c0…--c5` slots in a new world so every person's colour is readable on its ground.
- **Do** keep every touch target at 48px, or 40px for `.btn.small`.

### Don't:

- **Don't** let a caption cross a tile frame or split a word without a hyphen.
- **Don't** load fonts, styles or scripts from a third-party origin, write inline styles, or add a dependency that threatens the 60 KB gzip first-load JS budget.
- **Don't** add soft gradients, grain or glow to the Traitors world. Its stencil band uses hard colour stops and stays flat.
- **Don't** fake wood grain or bevels on the I'm a Celeb planks. The plank is flat sign-painted cedar, and the only gradients are its scorch and the torchlight.
- **Don't** set Dancing on Ice's silver lettering as gradient text. It is a solid colour with an offset bevel shadow.
- **Don't** fall back on the categories' default looks: no generic dark grid with a show-coloured accent for the Traitors, no purple-and-gold star sparkle for Strictly, no green leaves or emoji bugs for the jungle, no cream paper or gingham for Bake Off, and no pale frosty-white snowflakes for Ice.
- **Don't** let one world's material leak into another world or into the lobby's own chrome. A door shows a world only because it carries `data-world`.
