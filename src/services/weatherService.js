const axios = require('axios');
const cacheService = require('./cacheService');

const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';
const FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast';
const CACHE_TTL = 600; // 10 minutes

function apiKey() {
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

async function getWeatherByCity(city, units = 'metric') {
  const cacheKey = `weather:city:${city.toLowerCase()}:${units}`;

  const cached = await cacheService.get(cacheKey);
  if (cached) return cached;

  try {
    const { data } = await axios.get(BASE_URL, {
      params: { q: city, appid: apiKey(), units },
    });
    await cacheService.set(cacheKey, data, CACHE_TTL);
    return data;
  } catch (err) {
    throw normaliseError(err, city);
  }
}

async function getWeatherByCoordinates(lat, lon, units = 'metric') {
  const cacheKey = `weather:coord:${lat}:${lon}:${units}`;

  const cached = await cacheService.get(cacheKey);
  if (cached) return cached;

  try {
    const { data } = await axios.get(BASE_URL, {
      params: { lat, lon, appid: apiKey(), units },
    });
    await cacheService.set(cacheKey, data, CACHE_TTL);
    return data;
  } catch (err) {
    throw normaliseError(err, `${lat}, ${lon}`);
  }
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
  };
}

async function getForecastByCityAndDate(city, dateQuery, units = 'metric') {
  const cacheKey = `forecast:city:${city.toLowerCase()}:${dateQuery}:${units}`;

  const cached = await cacheService.get(cacheKey);
  if (cached) return cached;

  try {
    const { data } = await axios.get(FORECAST_URL, {
      params: { q: city, appid: apiKey(), units },
    });

    const selected = selectForecastForDate(data.list, dateQuery);
    if (!selected) return null;

    const normalized = normalizeForecastEntry(selected, data.city);
    await cacheService.set(cacheKey, normalized, CACHE_TTL);
    return normalized;
  } catch (err) {
    throw normaliseError(err, city);
  }
}

async function getForecastByCoordinatesAndDate(lat, lon, dateQuery, units = 'metric') {
  const cacheKey = `forecast:coord:${lat}:${lon}:${dateQuery}:${units}`;

  const cached = await cacheService.get(cacheKey);
  if (cached) return cached;

  try {
    const { data } = await axios.get(FORECAST_URL, {
      params: { lat, lon, appid: apiKey(), units },
    });

    const selected = selectForecastForDate(data.list, dateQuery);
    if (!selected) return null;

    const normalized = normalizeForecastEntry(selected, data.city);
    await cacheService.set(cacheKey, normalized, CACHE_TTL);
    return normalized;
  } catch (err) {
    throw normaliseError(err, `${lat}, ${lon}`);
  }
}

module.exports = {
  getWeatherByCity,
  getWeatherByCoordinates,
  getForecastByCityAndDate,
  getForecastByCoordinatesAndDate,
};

