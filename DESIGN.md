# Labour Chowk — design system ("Meet Day")

The interface borrows from a powerlifting meet: a matte stage, chalk-white numerals on a scoreboard,
calibrated plate colours, and the three judges' lights. It's built for a phone glanced at between sets,
often in a dim gym, so it's dark with large numerals and 44px+ tap targets.

## Colour roles (OKLCH, `src/styles/app.css`)
- **Stage** `--stage-0 / --stage / --stage-2 / --stage-3`: warm graphite surfaces, darkest = inset (inputs, boards).
- **Chalk** `--chalk / --chalk-2 / --chalk-3`: primary, secondary, tertiary text.
- **Plates** `--plate-25` red · `--plate-20` blue · `--plate-15` yellow · `--plate-10` green · `--plate-5` white.
  Used only in the barbell diagram and as semantic roles:
  - Action / focus / selection = yellow (15 kg plate)
  - No-lift / errors / deload = red
  - Data series = blue
  - Weight increase / gains = green
- **Judges' lights**: white dot per finished working set.

## Type
- Display and all numbers: Barlow Condensed 600/700, uppercase headings, tabular figures.
- UI and body: Barlow 400/500/600, 16px body.
- Roles: `.t-display`, `.t-title`, `.t-head`, `.t-label`, `.t-small`, `.num`.

## Components
- **Board** (`.board`): the scoreboard. Holds the Next Attempt (weight × reps), verdict chip, reason, plate diagram.
- **Barbell** (`<Barbell>`): one side of the bar, plates heaviest-first in IPF colours, with a per-side legend.
- **Set row** (`.set-row`): set number (tap for warm-up/delete), weight, reps, tick. Done rows lift to chalk tint.
- **Rest bar** (`.rest`): chalk slab pinned above the nav; turns yellow at zero and vibrates.
- Lists with hairline rules instead of cards; chips for filters; segmented controls for binary choices.

- **Food board**: the same scoreboard, counting calories left (red numerals when over). Below it, the day as one track
  split by meal — meals are a single data series, so they're blue stepped in lightness — then protein / carbs / fat bars.
- **Diet mark** (`<DietMark>`): the Indian food-packet convention — green square + dot veg, red-brown square + triangle
  non-veg, yellow for egg.
- **Readout** (`.readout`): what's about to be logged, on an inset slab. **Stepper** (`<Stepper>`): − value +, quarter
  steps below one serving.

## Motion
Exponential ease-out (`--ease-out`), 120–380ms. Rest bar and sheets rise in; bars grow from zero once.
All motion collapses under `prefers-reduced-motion`.
