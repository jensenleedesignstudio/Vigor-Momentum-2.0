# Vigor Momentum

A local-first strength-training app: plan a week, run the session, log what
happened, and get coaching feedback derived from your own data. Everything is
stored in the browser — there is no account and no server.

## Prerequisites

- Node.js `>=22.13.0`

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
```

## Other scripts

```bash
npm run build      # production bundle into dist/
npm run start      # preview the production build on :4173
npm run typecheck  # tsc --noEmit
npm run test       # typecheck + build
npm run lint       # eslint
```

## Project layout

```
src/
  main.tsx           mounts <App/>
  App.tsx            shell: state, persistence, navigation, shortcuts
  types.ts           every shared data shape, including what gets persisted
  data/              static reference data (muscles, 100 exercises, 35 foods)
  lib/
    dates.ts         local YYYY-MM-DD keys, week maths, time-aware greeting
    metrics.ts       rep parsing, volume, balance, recovery, streaks, records
    coach.ts         the feedback engine — ranked insights and the week score
    storage.ts       localStorage plumbing, export/import
  hooks/             toasts (with undo), theme
  components/        charts, anatomy maps, palette, session runner, settings
  screens/           the four onboarding screens
  features/          one file per tab, plus the report/macro/stat panels
  styles/            tokens first, then one sheet per area
```

## How the feedback works

`lib/coach.ts` reads the routine, logged sessions, effort, recovery gaps and
nutrition, then returns a ranked list of insights plus a score broken into four
weighted parts. The score is expandable in the UI so every point is explainable.
Nothing is seeded with sample data: charts stay empty until you log something.

Weekly set volume is compared against per-muscle landmarks in
`data/muscles.ts`, and progression suggestions come from logged RPE — a set that
felt easy earns load, a maximal set earns a deload prompt.

## Keyboard

| Key | Action |
| --- | --- |
| `Ctrl`/`⌘` + `K` | Command palette — jump to a tab, add an exercise, log a food, run an action |
| `1`–`6` | Switch tab |
| `Esc` | Close any dialog |

## Notes

- Data lives under the `vm-*` keys in `localStorage`. Settings → Your data
  exports and restores a full JSON backup.
- Appearance follows the OS by default; light and dark can be pinned in
  settings, alongside a reduce-motion switch.
- `examples/`, `db/`, `drizzle/`, `work/` and `outputs/` are leftovers from the
  original project template and are excluded from typechecking.
