# Meridian Transit Schedule System

An enterprise public transit schedule and routing information system built with **Angular 22**,
**standalone components**, **signals**, and **strict TypeScript**. Passengers can discover routes,
inspect stop sequences, browse planned departure timetables by day type, and compute the next
departure for any reference time. All data is a static, validated, immutable mock dataset.

This repository is a complete, self-contained workspace: it builds, serves, and passes its unit
test suite without any external service.

## At a glance

| Area | Choice |
| --- | --- |
| Framework | Angular 22.2.x, standalone components, `@if`/`@for` control flow |
| Language | TypeScript in strict mode, `strictTemplates`, zero `any` |
| State | Signals (`signal`, `computed`, `toSignal`) with an RxJS bridge |
| Styling | One centralized Swiss editorial design system in `src/styles.css` |
| Tests | Jasmine via Karma, including a 500-route scale suite |
| Data | Normalized, deep frozen mock network with integrity sanitization |

## Requirements

- Node.js `^22.22.3`, `^24.15.0`, or `>=26.0.0` (declared in `package.json`, matching the
  engines range of `@angular/cli@22.2.3`; the project was verified on Node 24.21 with npm 11).
- A Chromium based browser is required for the Karma test run.

The Angular framework version support matrix lives at
[angular.dev/reference/versions](https://angular.dev/reference/versions).

## Getting started

```bash
npm install
npm start          # development server, http://localhost:4200
npm test           # interactive unit test run (Karma)
npm run test:ci    # single headless test run
npm run build      # production build into dist/
```

## Screens

| Route | Screen | Purpose |
| --- | --- | --- |
| `/` | Route dashboard | Search, transport and day filters, route rows with first and last departure |
| `/routes/:id` | Route detail | Stop sequence timeline, departure matrix, next departure engine |
| `/stops` | Stop directory | Every stop with its serving route count, searchable |
| `/stops/:id` | Stop detail | All active routes serving the stop with next two departures each |
| `/about` | Schedule notes | Planned versus live data, data model, algorithm, accessibility notes |
| `/legal/terms`, `/legal/privacy` | Legal | Terms of use and privacy policy for the demonstration system |

## Architecture

```
src/app/
  core/
    models/          Domain types, labels, URL coercion helpers
    data/            Curated dataset + deterministic 500-route synthetic builder
    validation/      Integrity validation and record level sanitization
    repository/      Observable dataset source (simulated latency, injectable)
    services/        ScheduleService (time engine), RouteService (query layer),
                     ClockService, SystemAlertService, GlobalErrorHandler
  shared/
    icons/           Hand drawn inline SVG icon set (no icon library)
    components/      Reusable empty state panel
  features/
    route-list/      Screen A
    route-details/   Screen B
    stops/           Screen C and the stop directory
    info/            About and legal pages
    not-found/       404 state
    system/          Global fault banner
```

### Data flow

The repository wraps the dataset in an observable that emits after a simulated latency
(`SIMULATED_LATENCY_MS`, 450 ms by default; `0` emits synchronously). Both domain services convert
that stream into a signal via `toSignal`. Components read signals and derive everything else with
`computed()`, so a single immutable snapshot feeds every screen. The RxJS layer stays exactly where
a real HTTP client would later plug in; no component knows the data is local.

### Domain model

Four normalized entities, managed independently: `Route`, `Stop`, `RouteStop` (with a strict
`sequence` ordering), and `Departure` (one planned `HH:mm` time per route per day type).
Key invariants, all enforced by `network-validation.ts` and covered by tests:

- Unique numeric primary keys across every entity.
- `RouteStop.sequence` is contiguous from 1 and strictly dictates stop ordering.
- Route numbers are display labels only, never identifiers.
- Departure times always compare as minutes from midnight, never as strings.

### Next departure algorithm

`ScheduleService.findNextDeparture(routeId, dayType, selectedTime)`:

1. Rejects malformed reference times with an explicit `invalid-time` state.
2. Pulls the cached, sorted, integrity-checked departure list for the route and day type.
3. Binary searches for the first departure at or after the reference time (O(log n)).
4. Returns `found` with the time, minutes until, and matrix index, or an explicit
   `after-last` / `no-service` state. The UI renders the exact sentence
   "No further departures scheduled for today" for end of service.

The same sorted cache powers first and last departure windows, the departure matrix, and the
next-two-departures board on the stop screen.

### Resilience

- `sanitizeNetwork` drops duplicate ids, orphaned joins, and malformed times, then freezes the
  result; the repository logs what it repaired and the application continues on healthy data.
- Unknown route or stop ids render typed 404 empty states, never exceptions.
- The global `ErrorHandler` surfaces a dismissible system banner for anything unexpected and the
  shell keeps navigating.

## Design system

The visual language is a deliberate **Swiss transit authority** direction: warm archival paper,
near black ink, a single signal red, hairline rules, sharp corners, uppercase grotesque display
type (Archivo), IBM Plex Sans for body text, and IBM Plex Mono with tabular numerals for every
timetable figure. Everything lives in one tokenized file, `src/styles.css`.

Deliberate design decisions:

- Flat surfaces only: no gradients, no drop shadows, no glass, no radial decorations.
- Zero border radius across the entire system, matching printed timetable aesthetics.
- Structure comes from hairline rules and typographic hierarchy, not ornament.
- Route badges use transit iconography: filled ink for bus, outlined for minibus.
- Skeleton loaders for the initial dataset fetch; opacity pulse only, disabled under
  `prefers-reduced-motion`.
- A print stylesheet turns any route timetable into a clean leaflet.
- Color contrast: body ink on paper exceeds WCAG AA; signal red is used for large text,
  tags, and accents at 4.9:1 on paper.
- Icons are a hand drawn inline SVG set (square caps, 24 unit grid), so no third party icon
  library ships to the user.

## Testing

The suite runs with Jasmine on Karma and covers the algorithmic core end to end:

| Spec | Coverage |
| --- | --- |
| `schedule.service.spec.ts` | Time parsing and formatting, round trips, calendar day type mapping, exact match, between departures, before first departure, exact last departure, end of service, invalid time, unknown route, multi departure windows |
| `route.service.spec.ts` | Natural sorting, case insensitive search over numbers and termini, transport filters, stop to route mapping, ordered sequences, summaries with departure windows, unknown record safety, and the full curated dataset integrity |
| `route.service.spec.ts` (synthetic) | 500-route network: indexing, search correctness and scale, transport splits, next departure computation |
| `network-validation.spec.ts` | Curated and synthetic datasets pass validation; corrupt records are detected and dropped; immutability freezing; lossless sanitization of healthy data |
| `route-list.component.spec.ts` | Row rendering, empty state with reset, transport filtering, stop suggestions |

Run with `npm test` (watch mode) or `npm run test:ci` (single headless run).

## Configuration

| Injection token | Default | Purpose |
| --- | --- | --- |
| `SIMULATED_LATENCY_MS` | `450` | Simulated dataset latency in `app.config.ts`. `0` loads synchronously and removes the skeleton state. |
| `DATASET_SOURCE` | `buildCuratedNetwork` | Swap in `buildSyntheticNetwork(500)` (already exercised in tests) to run the UI on a 500-route network. |

Example override in `app.config.ts`:

```ts
{ provide: SIMULATED_LATENCY_MS, useValue: 0 }
```

## Scope and honest limitations

- **Mock data.** The network is fictional sample data. Departure times are internally consistent
  (headway plans anchored at a real last departure) but represent no real operator.
- **Planned timetables only.** No GPS, no delay estimation, no realtime layer, by specification.
  The distinction is stated in the interface, not just in documentation.
- **No admin CRUD.** The specification marks the administrative module as optional and
  extensible. This release focuses on the passenger system; the repository is the single
  mutation boundary where a CRUD layer would attach.
- **Fonts load from Google Fonts.** The `index.html` requests Archivo and IBM Plex families from
  a CDN, which is disclosed in the privacy policy; replace the links with self-hosted files for a
  fully offline deployment.
- **Zone based change detection.** The app uses `provideZoneChangeDetection` with coalescing.
  All state is signals first, so a move to zoneless change detection is a configuration change,
  not a rewrite.

## Upgrade path

The project pins Angular 22.2.x, the current active release line (released 2026-06-03, active
support to 2027-06, LTS to 2028-06 per the Angular release schedule at
[angular.dev/reference/releases](https://angular.dev/reference/releases)). To move to a newer
major, run `ng update` following
[the Angular update guide](https://angular.dev/tools/cli/update).

## References

- Angular documentation: [angular.dev](https://angular.dev)
- Signals guide: [angular.dev/guide/signals](https://angular.dev/guide/signals)
- Control flow: [angular.dev/guide/templates/control-flow](https://angular.dev/guide/templates/control-flow)
- RxJS interop: [angular.dev/ecosystem/rxjs-interop](https://angular.dev/ecosystem/rxjs-interop)
- Testing with Karma and Jasmine: [angular.dev/guide/testing](https://angular.dev/guide/testing)

