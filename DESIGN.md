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
  - `--patti` leaf: weight going up.
  - `--neel` indigo: data series (charts, meals, macro bars).
- **Plates** `--plate-25 … --plate-1`: IPF colours, barbell diagram only.

## Type
- **Archivo** (variable, width axis 62–125%) for everything.
  - Display / titles: 62% width, 820–860 weight, uppercase — painted-signboard lettering (`.t-display`, `.t-title`).
  - Heads: 72% width, uppercase (`.t-head`). Numbers: 62–78% width, tabular figures (`.num`).
  - Body and labels: 100% width, sentence case, 16px body (`.t-label`, `.t-small`).
- **Yatra One** (hand-painted Devanagari) only for the wordmark लेबर चौक and the शाबाश! stamp.

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

## Motion
- Ease-out `cubic-bezier(0.23, 1, 0.32, 1)` for anything answering a tap (120–300ms); drawer curve
  `cubic-bezier(0.32, 0.72, 0, 1)` for sheets, toasts and the rest timer sliding in (≈420–500ms).
- One authored moment per screen at most: the slate number chalking in, plates sliding on, the शाबाश! stamp after a
  workout. Hover effects only on devices that hover.
- Everything collapses under `prefers-reduced-motion`.
