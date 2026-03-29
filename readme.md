# Weather Widget (SSR)

Server-side rendered weather widget for embeds (Notion, dashboards, iframes), built with Express + EJS + Tailwind CSS.

## Features

- SSR via Express + EJS (no client-side framework required).
- OpenWeather current weather + date-aware forecast lookup.
- Default units are metric (Celsius), with optional imperial (Fahrenheit).
- Default landing route redirects to London.
- Caching with Upstash Redis (Vercel KV-compatible setup) and automatic local `node-cache` fallback.
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

| Param   | Values                 | Default  | Notes                                                |
| ------- | ---------------------- | -------- | ---------------------------------------------------- |
| `units` | `metric` or `imperial` | `metric` | `metric` = Celsius, `imperial` = Fahrenheit          |
| `date`  | `YYYY-MM-DD`           | none     | Requests forecast for a specific date when available |

Examples:

- `/city/london`
- `/city/london?units=imperial`
- `/city/london?date=2026-04-02`
- `/coordinates/48.8566/2.3522?units=metric&date=2026-04-02`

## Date behavior

- Missing `date`: shows live weather.
- Invalid `date` format: shows live weather + validation message.
- Past `date`: shows live weather + past-date message.
- Valid non-past `date` with forecast available: shows forecast for that date.
- Valid non-past `date` with no forecast data: shows live weather + `Unavailable, showing live.`

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

If Upstash Redis env vars are missing locally, the app automatically uses in-process cache.

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

```bash
npm run format
npm run format:check
```

```bash
npm run prepare
```

## Lighthouse checks (manual)

Run this flow when you want Lighthouse scores locally without relying on the git hook:

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

- Audited URLs are defined in `.lighthouserc.cjs` (`/city/london` and `/demo`).
- The default assertions require `1.00` minimum score for Performance, Accessibility, Best Practices, and SEO.
- `⚠️ GitHub token not set` during `lhci healthcheck` is expected unless you plan to post results to GitHub status checks.

## Pre-merge quality command

```bash
npm run quality:premerge
```

This runs formatting check, tests, production build, and Lighthouse in one command.

## Deploy (Vercel)

1. Add Upstash Redis integration from Vercel Marketplace.
2. Set `OPENWEATHERMAP_API_KEY` (and optional `GITHUB_REPO_URL`).
3. Deploy:

```bash
vercel --prod
```

## UI notes

- Main layout adapts for both portrait and short/wide landscape embeds.
- Weather details include humidity, wind, precipitation chance, and precipitation amount.
- At narrow widths, labels switch to icons with tooltips for readability.
- Date label remains visible across sizes; only the `Forecast for:` prefix is hidden on small screens.
- Bottom-right action icons: open-in-new-tab (always) and GitHub (when configured).
