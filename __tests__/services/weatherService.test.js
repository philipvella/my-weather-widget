import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const axios = require('axios');
const cacheService = require('../../src/services/cacheService');
const weatherService = require('../../src/services/weatherService');

describe('weatherService', () => {
  let axiosGetSpy;
  let cacheGetSpy;
  let cacheSetSpy;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.OPENWEATHERMAP_API_KEY = 'test-key';
    axiosGetSpy = vi.spyOn(axios, 'get');
    cacheGetSpy = vi.spyOn(cacheService, 'get');
    cacheSetSpy = vi.spyOn(cacheService, 'set');
  });

  it('returns cached current city weather when available', async () => {
    const cached = { cached: true };
    cacheGetSpy.mockResolvedValueOnce(cached);

    const data = await weatherService.getWeatherByCity('Paris', 'metric');

    expect(data).toBe(cached);
    expect(axiosGetSpy).not.toHaveBeenCalled();
    expect(cacheSetSpy).not.toHaveBeenCalled();
    expect(cacheGetSpy).toHaveBeenCalledWith('weather:city:paris:metric');
  });

  it('fetches and caches current city weather when cache misses', async () => {
    const apiData = { name: 'Paris' };
    cacheGetSpy.mockResolvedValueOnce(null);
    axiosGetSpy.mockResolvedValueOnce({ data: apiData });

    const data = await weatherService.getWeatherByCity('Paris', 'imperial');

    expect(data).toEqual(apiData);
    expect(axiosGetSpy).toHaveBeenCalledWith('https://api.openweathermap.org/data/2.5/weather', {
      params: { q: 'Paris', units: 'imperial', appid: 'test-key' },
    });
    expect(cacheSetSpy).toHaveBeenCalledWith('weather:city:paris:imperial', apiData, 600);
  });

  it('normalizes 404 errors', async () => {
    cacheGetSpy.mockResolvedValueOnce(null);
    axiosGetSpy.mockRejectedValueOnce({ response: { status: 404 } });

    await expect(weatherService.getWeatherByCity('NoCity', 'metric')).rejects.toMatchObject({
      status: 404,
      message: '"NoCity" not found',
    });
  });

  it('returns normalized forecast entry for selected date', async () => {
    cacheGetSpy.mockResolvedValueOnce(null);
    axiosGetSpy.mockResolvedValueOnce({
      data: {
        city: { name: 'Paris', country: 'FR' },
        list: [
          {
            dt: Math.floor(new Date('2030-04-01T12:00:00.000Z').getTime() / 1000),
            dt_txt: '2030-04-01 12:00:00',
            main: { temp: 20 },
            weather: [{ main: 'Clear', description: 'clear sky', icon: '01d' }],
            wind: { speed: 5 },
            pop: 0.4,
            rain: { '3h': 1.2 },
          },
        ],
      },
    });

    const data = await weatherService.getForecastByCityAndDate('Paris', '2030-04-01', 'metric');

    expect(data).toEqual({
      name: 'Paris',
      sys: { country: 'FR' },
      dt: Math.floor(new Date('2030-04-01T12:00:00.000Z').getTime() / 1000),
      dt_txt: '2030-04-01 12:00:00',
      main: { temp: 20 },
      weather: [{ main: 'Clear', description: 'clear sky', icon: '01d' }],
      wind: { speed: 5 },
      pop: 0.4,
      rain: { '3h': 1.2 },
      snow: undefined,
    });
    expect(cacheSetSpy).toHaveBeenCalledWith(
      'forecast:city:paris:2030-04-01:metric',
      expect.any(Object),
      600
    );
  });

  it('returns normalized multi-day forecast range and caches it', async () => {
    cacheGetSpy.mockResolvedValueOnce(null);
    axiosGetSpy.mockResolvedValueOnce({
      data: {
        city: { name: 'Paris', country: 'FR' },
        list: [
          {
            dt: Math.floor(new Date('2030-04-01T12:00:00.000Z').getTime() / 1000),
            dt_txt: '2030-04-01 12:00:00',
            main: { temp: 20 },
            weather: [{ main: 'Clear', description: 'clear sky', icon: '01d' }],
            wind: { speed: 5 },
            pop: 0.4,
          },
          {
            dt: Math.floor(new Date('2030-04-02T12:00:00.000Z').getTime() / 1000),
            dt_txt: '2030-04-02 12:00:00',
            main: { temp: 22 },
            weather: [{ main: 'Clouds', description: 'few clouds', icon: '02d' }],
            wind: { speed: 4 },
            pop: 0.2,
          },
        ],
      },
    });

    const data = await weatherService.getForecastRangeByCity(
      'Paris',
      '2030-04-01',
      '2030-04-03',
      'metric'
    );

    expect(data).toHaveLength(2);
    expect(data[0]).toMatchObject({
      name: 'Paris',
      sys: { country: 'FR' },
      dt_txt: '2030-04-01 12:00:00',
    });
    expect(cacheSetSpy).toHaveBeenCalledWith(
      'forecast-range:city:paris:2030-04-01:2030-04-03:metric',
      expect.any(Array),
      600
    );
  });
});
