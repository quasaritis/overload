# Labour Chowk — design system ("Akhada")

The interface is an akhada, the Indian wrestling pit: a floor of red earth (mitti), lime-chalk lettering, a turmeric
(haldi) hand for anything you can press, and one slate board where the next lift is chalked up. It's built for a phone
glanced at between sets in a dim gym, so it stays dark, with big condensed numerals and 44px+ tap targets.

## Colour roles (`src/styles/app.css`)
- **Mitti** `--stage-0 / --stage / --stage-2 / --stage-3`: red-earth surfaces. Darkest = pressed into the floor
  (inputs, steppers, wells), lightest = raised (sheets, buttons). The page carries a fine earth grain.
- **Chalk** `--chalk / --chalk-2 / --chalk-3`: primary, secondary, tertiary text. All pass WCAG AA on every mitti tone.
- **Slate** `--slate`, framed in `--frame`: only the board that shows a number to act on (next lift, calories left).
- **Pigments** — each has one job:
  - `--haldi` turmeric: action, focus, selection, the active nav mark. Nothing decorative.
  - `--sindoor` vermilion: no-lift, deload, over target, delete.
  - `--patti` leaf: weight going up, sets in the growth range.
- **Data** is drawn in chalk (`--data`). The one figure that matters right now (this week's volume, the selected day,
  protein) takes haldi (`--data-now`). The four meals are one chalk pressed harder or lighter (`--meal-1…4`). No
  indigo, no rainbow: one hue per chart.
- **Plates** `--plate-25 … --plate-1`: IPF colours, barbell diagram only.

## Type
- **Archivo** (variable, width axis 62–125%) for everything.
  - Display / titles: 62% width, 820–860 weight, uppercase — painted-signboard lettering (`.t-display`, `.t-title`).
  - Heads: 72% width, uppercase (`.t-head`). Numbers: 62–78% width, tabular figures (`.num`).
  - Body and labels: 100% width, sentence case, 16px body (`.t-label`, `.t-small`).
- **Yatra One** (hand-painted Devanagari) only for the wordmark लेबर चौक and the शाबाश! stamp.

## One page grammar
Every screen is built from the same five pieces, in this order, and nothing else:
1. `<PageHead>`: optional back link, the title in sign lettering, one line of real context (a date, a count, the
   plan's state; never a line about the interface), actions on the right.
2. `<SectionHead>`: a sign-lettered section name, an optional grey line of facts, at most one action.
3. Figures as a `.facts` strip (big condensed number over a small grey label), never as tiles.
4. Lists with hairline rules (`.list`), never cards.
5. The slate (`.board`) only for the number to act on.
Choices use `<Seg>` (two to four options) or chips (filters). Anything you can't undo uses `<HoldButton>`.
Radii are one tight family: 4 (tags), 6 (controls), 8 (slabs).

## Components
- **Slate** (`.board`): framed chalkboard with rubbed-out smudges and dust. Its big number (`.attempt`) is drawn through
  the `#chalk` SVG filter (in `index.html`), which roughens edges and knocks out ~20% of the stroke like real chalk,
  and is written in left-to-right on first view.
- **Tally** (`<Lights>`): chalk tally marks, one per set; every fifth crosses the gate. Done = chalk, miss = sindoor,
  to-do = faint dashes. A new stroke draws itself in.
- **Barbell** (`<Barbell>`): one side of the bar on the slate; plates slide on heaviest-first.
- **Brandmark** (`<Brandmark>`): लेबर चौक in haldi over a tracked Latin line. In the sidebar on desktop, at the top of
  Today on phones.
- **Buttons**: painted. Primary is haldi with a darker pressed edge; all buttons scale to 0.97 on press.
- **Set row**, **stepper**, **readout**: wells pressed into the earth (inset shadow); a done set turns chalky.
- Lists use hairline rules, not cards. Chips for filters, segmented controls for binary choices.

## Motion: chalk and iron
Everything that moves is chalk being written or wiped, or iron being loaded.
- Ease-out `cubic-bezier(0.23, 1, 0.32, 1)` for anything answering a tap (120–300ms); drawer curve
  `cubic-bezier(0.32, 0.72, 0, 1)` for sheets, toasts and the rest timer sliding in (≈420–500ms). Exits are faster
  than entrances (150–240ms) and leave the way they came.
- The slate number chalks in left to right, and is wiped and rewritten whenever it changes (calories left).
- Logging a set wipes chalk across its row; undoing it rubs it off fast. Tally strokes draw themselves.
- Plates slide onto the bar heaviest first.
- `<Seg>` moves one thumb between options instead of swapping colours.
- Sheets slide out on close and can be dragged or flicked down on phones (velocity over 0.11 px/ms closes them;
  upward drags meet friction).
- `<HoldButton>` fills with sindoor while held (about one second), snaps back in 200ms if you let go.
- The one celebration: शाबाश! stamps in, the session's tally chalks itself stroke by stroke, then the numbers and
  records arrive in turn.
- Not animated on purpose: moving between tabs and screens (done dozens of times a day), keyboard actions, chart
  lines (data people read).
- Hover effects only on devices that hover. Under `prefers-reduced-motion` all travel is removed; the hold fill keeps
  its pace because it is a countdown, not decoration.
