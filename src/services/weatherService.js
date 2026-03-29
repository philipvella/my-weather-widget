const axios = require('axios');
const cacheService = require('./cacheService');

const API_ENDPOINTS = {
  current: 'https://api.openweathermap.org/data/2.5/weather',
  forecast: 'https://api.openweathermap.org/data/2.5/forecast',
};
const CACHE_TTL_SECONDS = 600;

function getApiKey() {
  const key = process.env.OPENWEATHERMAP_API_KEY;
  if (!key) throw Object.assign(new Error('OPENWEATHERMAP_API_KEY is not set'), { status: 500 });
  return key;
}

function normaliseError(err, label) {
  if (err.response?.status === 404) {
    return Object.assign(new Error(`"${label}" not found`), { status: 404 });
  }
  if (err.response?.status === 401) {
    return Object.assign(new Error('Invalid API key'), { status: 401 });
  }
  console.error(`[weatherService] Error fetching weather for "${label}":`, err.message);
  return Object.assign(new Error('Unable to fetch weather data'), { status: 502 });
}

async function getOrSetCache(cacheKey, fetcher) {
  const cached = await cacheService.get(cacheKey);
  if (cached) return cached;

  const fresh = await fetcher();
  await cacheService.set(cacheKey, fresh, CACHE_TTL_SECONDS);
  return fresh;
}

async function fetchWeatherFromApi(endpoint, params, label) {
  try {
    const { data } = await axios.get(endpoint, {
      params: {
        ...params,
        appid: getApiKey(),
      },
    });
    return data;
  } catch (err) {
    throw normaliseError(err, label);
  }
}

async function getWeatherByCity(city, units = 'metric') {
  const cacheKey = `weather:city:${city.toLowerCase()}:${units}`;
  return getOrSetCache(cacheKey, () => fetchWeatherFromApi(API_ENDPOINTS.current, { q: city, units }, city));
}

async function getWeatherByCoordinates(lat, lon, units = 'metric') {
  const cacheKey = `weather:coord:${lat}:${lon}:${units}`;
  return getOrSetCache(cacheKey, () => fetchWeatherFromApi(API_ENDPOINTS.current, { lat, lon, units }, `${lat}, ${lon}`));
}

function selectForecastForDate(entries, dateQuery) {
  if (!Array.isArray(entries) || entries.length === 0) return null;

  const sameDayEntries = entries.filter((entry) => {
    const dtTxt = entry.dt_txt;
    return typeof dtTxt === 'string' && dtTxt.startsWith(dateQuery);
  });

  if (sameDayEntries.length === 0) return null;

  // Use noon as a stable target and pick the nearest 3-hour forecast point.
  const targetEpoch = Math.floor(new Date(`${dateQuery}T12:00:00.000Z`).getTime() / 1000);
  return sameDayEntries.reduce((best, current) => {
    const bestDelta = Math.abs(best.dt - targetEpoch);
    const currentDelta = Math.abs(current.dt - targetEpoch);
    return currentDelta < bestDelta ? current : best;
  });
}

function normalizeForecastEntry(entry, cityMeta) {
  return {
    name: cityMeta.name,
    sys: { country: cityMeta.country },
    main: entry.main,
    weather: entry.weather,
    wind: entry.wind,
    pop: entry.pop,
    rain: entry.rain,
    snow: entry.snow,
  };
}

async function getForecastByCityAndDate(city, dateQuery, units = 'metric') {
  const cacheKey = `forecast:city:${city.toLowerCase()}:${dateQuery}:${units}`;
  return getOrSetCache(cacheKey, async () => {
    const data = await fetchWeatherFromApi(API_ENDPOINTS.forecast, { q: city, units }, city);
    const selected = selectForecastForDate(data.list, dateQuery);
    if (!selected) return null;
    return normalizeForecastEntry(selected, data.city);
  });
}

async function getForecastByCoordinatesAndDate(lat, lon, dateQuery, units = 'metric') {
  const cacheKey = `forecast:coord:${lat}:${lon}:${dateQuery}:${units}`;
  return getOrSetCache(cacheKey, async () => {
    const data = await fetchWeatherFromApi(API_ENDPOINTS.forecast, { lat, lon, units }, `${lat}, ${lon}`);
    const selected = selectForecastForDate(data.list, dateQuery);
    if (!selected) return null;
    return normalizeForecastEntry(selected, data.city);
  });
}

module.exports = {
  getWeatherByCity,
  getWeatherByCoordinates,
  getForecastByCityAndDate,
  getForecastByCoordinatesAndDate,
};

