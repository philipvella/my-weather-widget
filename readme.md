# Weather Widget (SSR)

Server-side weather widget for Notion or any iframe host.

- Express + EJS + Tailwind Play CDN
- OpenWeather current + forecast APIs
- Upstash Redis cache with local `node-cache` fallback
- Vercel-friendly serverless entrypoint

## Routes

| Route | Description |
|---|---|
| `/` | Redirects to `/city/london` |
| `/city/:city` | Weather by city, e.g. `/city/paris` |
| `/coordinates/:lat/:lon` | Weather by coordinates, e.g. `/coordinates/50.447/5.962` |

### Query params

| Param | Values | Default |
|---|---|---|
| `units` | `metric` or `imperial` | `metric` |
| `date` | `YYYY-MM-DD` | none |

Examples:

- `/city/london?units=imperial`
- `/city/london?date=2026-04-01`

## Date resolution behavior

- Valid future `date` (within forecast window): shows forecast.
- Past `date`: falls back to current weather + message.
- Invalid `date`: falls back to current weather + message.
- No forecast for requested date: falls back to current weather + `Unavailable, showing live.`

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `OPENWEATHERMAP_API_KEY` | yes | OpenWeather API key |
| `UPSTASH_REDIS_REST_URL` | prod yes | Added by Vercel Upstash integration |
| `UPSTASH_REDIS_REST_TOKEN` | prod yes | Added by Vercel Upstash integration |
| `GITHUB_REPO_URL` | optional | Shows a GitHub icon button (bottom-right, next to the open-in-new icon) |

Copy `.env.example` to `.env.local` for local development.

## Local run

```bash
cp .env.example .env.local
npm install
npm run dev
```

Optional (recommended when linked to Vercel):

```bash
vercel env pull .env.local
```

App runs at `http://localhost:3000`.

If Upstash vars are missing locally, cache falls back to in-process `node-cache`.

## Testing

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

## Deploy (Vercel)

1. Add Upstash Redis integration in Vercel Marketplace.
2. Set `OPENWEATHERMAP_API_KEY` in project env vars.
3. Deploy:

```bash
vercel --prod
```

## UI notes

- Responsive layout optimized for very small landscape embeds.
- Stats show text labels on larger widths and icon labels on very narrow widths.
- Precip chance may be `--` for live weather when API probability is unavailable.
- Optional GitHub icon badge appears when `GITHUB_REPO_URL` is set.
- Bottom-right action buttons: open-in-new-tab icon (always shown) + GitHub icon (when `GITHUB_REPO_URL` is set).
