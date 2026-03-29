# Weather Widget (SSR)

Server-side rendered weather widget for embeds (Notion, dashboards, iframes), built with Express + EJS + Tailwind CSS.

## Features

- SSR via Express + EJS (no client-side framework required).
- OpenWeather current weather + single-date or date-range forecast lookup.
- Default units are metric (Celsius), with optional imperial (Fahrenheit).
- Default landing route redirects to London.
- Caching with Upstash Redis (Vercel KV-compatible setup) and automatic local `node-cache` fallback.
- Build/dev generate a local `favicon.ico` (plus `favicon.svg` static icon).
- Responsive widget tuned for tiny landscape sizes and mobile embeds.

## Routes

| Route                    | Description                                                |
| ------------------------ | ---------------------------------------------------------- |
| `/`                      | Redirects to `/city/london`                                |
| `/demo`                  | Live embed demo showing common iframe sizes                |
| `/city/:city`            | Weather by city, e.g. `/city/paris`                        |
| `/coordinates/:lat/:lon` | Weather by coordinates, e.g. `/coordinates/48.8566/2.3522` |

No `/weather/*` prefix is used.

## Query parameters

| Param   | Values                 | Default  | Notes                                                    |
| ------- | ---------------------- | -------- | -------------------------------------------------------- |
| `units` | `metric` or `imperial` | `metric` | `metric` = Celsius, `imperial` = Fahrenheit              |
| `date`  | `YYYY-MM-DD`           | none     | Requests forecast for a specific date when available     |
| `from`  | `YYYY-MM-DD`           | none     | Start date for range forecast (must be paired with `to`) |
| `to`    | `YYYY-MM-DD`           | none     | End date for range forecast (inclusive)                  |

When `from` or `to` is present, range mode is used and `date` is ignored.

Examples:

- `/city/london`
- `/city/london?units=imperial`
- `/city/london?date=2026-04-02`
- `/city/london?from=2026-03-29&to=2026-03-31`
- `/coordinates/48.8566/2.3522?units=metric&date=2026-04-02`

## Date behavior

- Missing `date`: shows live weather.
- Invalid `date` format: shows live weather + validation message.
- Past `date`: shows live weather + past-date message.
- Valid non-past `date` with forecast available: shows forecast for that date.
- Valid non-past `date` with no forecast data: shows live weather + `Unavailable, showing live.`

## Date range behavior (`from` + `to`)

- Uses OpenWeather 5-day / 3-hour forecast API data filtered across the requested inclusive range.
- Both `from` and `to` are required and must be valid `YYYY-MM-DD` values.
- If range is valid and data exists, widget renders a compact multi-day forecast strip.
- Clicking a day in the strip keeps the same range length and shifts the window to start at that clicked day.
  - Example: `from=2026-03-29&to=2026-03-31` (3 days) -> click `2026-03-30` -> new range becomes `from=2026-03-30&to=2026-04-01`.
- If only some days have forecast data, all requested day boxes still render; missing days show `Too early to predict`.
- `Too early to predict` boxes are intentionally non-clickable.
- If range is invalid or includes past days, widget falls back to live weather with a message.
- If no forecast exists for that range window, widget falls back to live weather + `Unavailable, showing live.`

## Environment variables

| Variable                   | Required               | Notes                                                |
| -------------------------- | ---------------------- | ---------------------------------------------------- |
| `OPENWEATHERMAP_API_KEY`   | yes                    | OpenWeather API key                                  |
| `UPSTASH_REDIS_REST_URL`   | production recommended | Provided by Vercel Upstash Redis integration         |
| `UPSTASH_REDIS_REST_TOKEN` | production recommended | Provided by Vercel Upstash Redis integration         |
| `GITHUB_REPO_URL`          | optional               | Enables GitHub icon button in the widget footer area |

Setup local env:

```bash
cp .env.example .env.local
```

If your project is linked to Vercel, prefer pulling env values:

```bash
vercel env pull .env.local
```

## Local development

```bash
npm install
npm run dev
```

App URL: `http://localhost:3000`

`npm run dev` generates the favicon once, does an initial CSS build, then runs the Tailwind CSS watcher and nodemon in parallel so both stylesheet and server changes are picked up automatically.

If Upstash Redis env vars are missing locally, the app automatically uses in-process cache.
Current weather, single-date forecasts, and date-range forecasts all use cache keys (location + units + date inputs).

## Tests

```bash
npm test
```

```bash
npm run test:watch
```

All tests live under `__tests__/`.

## Formatting and hooks

Prettier is enforced via Husky + lint-staged on commit.

Pre-push runs only:

- `npm run format:check`
- `npm test`

```bash
npm run format
npm run format:check
```

```bash
npm run prepare
```

## Lighthouse checks (manual)

Lighthouse is intentionally manual (not enforced in git hooks). Run this flow when needed:

1. Build assets

```bash
npm run build
```

2. Start app on test port

```bash
npm run start:test
```

3. Run Lighthouse CI from a second terminal

```bash
LHCI_BASE_URL=http://localhost:4173 npm run lighthouse:ci
```

4. Stop the test server (`Ctrl+C`)

Notes:

- Audited URLs are defined in `.lighthouserc.cjs` (`/city/london` and `/coordinates/50.447086/5.962080`).
- The default assertions require `1.00` minimum score for Performance, Accessibility, Best Practices, and SEO.
- `⚠️ GitHub token not set` during `lhci healthcheck` is expected unless you plan to post results to GitHub status checks.

## Deploy (Vercel)

1. Add Upstash Redis integration from Vercel Marketplace.
2. Set `OPENWEATHERMAP_API_KEY` (and optional `GITHUB_REPO_URL`).
3. Deploy:

```bash
vercel --prod
```

## UI notes

- Main layout adapts for both portrait and short/wide landscape embeds.
- In multi-day mode, very wide + short landscape layouts hide the large current temperature block to preserve space for day boxes.
- Weather details include humidity, wind, precipitation chance, and precipitation amount.
- At narrow widths, labels switch to icons with tooltips for readability.
- Date label remains visible across sizes; only the `Forecast for:` prefix is hidden on small screens.
- In range mode, the active day is visually highlighted; day boxes keep equal dimensions to avoid layout shift.
- Missing forecast days render as `Too early to predict` placeholder boxes.
- Bottom-right action icons: open-in-new-tab (always) and GitHub (when configured).

## Demo page

- `/demo` includes a date-range section that starts from today (`from=today`, `to=today+2`) and demonstrates click-to-shift behavior.
- Other demo sections show common embed sizes for city/coordinates routes.
