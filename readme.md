# Weather Widget — Server-Side Rendered

A server-side rendered weather widget that can be embedded directly in Notion (or any iframe). Fetches live weather from the OpenWeather API, caches responses for 10 minutes via Upstash Redis, and renders a clean Tailwind-styled page on every request.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js ≥ 18 |
| Framework | Express |
| Templates | EJS (server-side rendered) |
| Styling | TailwindCSS (Play CDN) |
| Weather API | [OpenWeatherMap](https://openweathermap.org/api) |
| Cache | Upstash Redis (via Vercel Marketplace) + in-process node-cache fallback |
| Rate limiting | express-rate-limit |
| Hosting | Vercel (serverless) |

---

## Routes

| URL | Description |
|---|---|
| `/` | Redirects to `/weather/london` |
| `/weather/:city` | Weather by city name (e.g. `/weather/paris`) |
| `/weather/coordinate/:lat/:lon` | Weather by coordinates (e.g. `/weather/coordinate/50.447/5.962`) |

### Query parameters

| Parameter | Values | Default |
|---|---|---|
| `units` | `metric` (°C, m/s) \| `imperial` (°F, mph) | `metric` |

Example: `/weather/london?units=imperial`

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENWEATHERMAP_API_KEY` | ✅ | Free API key from openweathermap.org |
| `UPSTASH_REDIS_REST_URL` | ✅ (production) | Set automatically by Vercel Marketplace integration |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ (production) | Set automatically by Vercel Marketplace integration |

Copy `.env.example` → `.env.local` and fill in your values for local development.

---

## Deploying to Vercel

### 1. Install the Vercel CLI (if you haven't already)
```bash
npm i -g vercel
```

### 2. Add the Upstash Redis integration
Go to **Vercel Dashboard → your project → Integrations → Marketplace** and search for **Upstash Redis**. Add it and create a database. Vercel will automatically inject `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` into your project.

### 3. Add your OpenWeather API key
In **Vercel Dashboard → Settings → Environment Variables** add:
```
OPENWEATHERMAP_API_KEY = <your key>
```

### 4. Deploy
```bash
vercel --prod
```

---

## Local Development

### Pull env vars from Vercel (recommended)
```bash
vercel env pull .env.local
# then add OPENWEATHERMAP_API_KEY to .env.local
npm run dev
```

### Without Vercel KV
If `UPSTASH_REDIS_REST_URL` is not set, the app automatically falls back to an in-process `node-cache`. Caching will work within a single process but won't survive restarts.

```bash
cp .env.example .env.local
# Fill in OPENWEATHERMAP_API_KEY
npm run dev
```

App will be available at `http://localhost:3000`.

---

## Notion Embedding

Paste any widget URL into a Notion page → select **Embed**. The widget sets `Content-Security-Policy: frame-ancestors *` so Notion can iframe it without restriction.

Example URL: `https://your-deployment.vercel.app/weather/london`

---

## UI

- Background gradient changes with weather condition (sunny → amber/sky, rainy → blue/slate, snow → light blue, storm → purple/dark, clouds → slate, fog → grey)
- Displays: temperature, "feels like", weather description, icon (OpenWeatherMap CDN), humidity, wind speed
- Fully responsive; works at any iframe size
- Accessible semantic HTML with ARIA labels and alt text
- Error state shown when the city is not found or the API is unreachable
