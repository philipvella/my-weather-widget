const axios = require('axios');
const cacheService = require('./cacheService');

const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';
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

module.exports = { getWeatherByCity, getWeatherByCoordinates };

