import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const weatherService = require('../../src/services/weatherService');
const router = require('../../src/routes/weather');

function makeApp() {
  const app = express();
  app.use((req, res, next) => {
    res.render = (view, locals) => res.status(res.statusCode || 200).json({ view, locals });
    next();
  });
  app.use(router);
  return app;
}

describe('weather routes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.GITHUB_REPO_URL = 'https://github.com/example/repo';
  });

  it('renders city weather with date and units', async () => {
    vi.spyOn(weatherService, 'getForecastByCityAndDate').mockResolvedValueOnce({
      name: 'London',
      sys: { country: 'GB' },
      main: { temp: 12, feels_like: 10, humidity: 75 },
      weather: [{ main: 'Clouds', description: 'few clouds', icon: '02d' }],
      wind: { speed: 3 },
      pop: 0.2,
    });

    const res = await request(makeApp()).get('/city/london?units=imperial&date=2099-04-01');

    expect(res.status).toBe(200);
    expect(weatherService.getForecastByCityAndDate).toHaveBeenCalledWith(
      'london',
      '2099-04-01',
      'imperial'
    );
    expect(res.body.view).toBe('weather');
    expect(res.body.locals.units).toBe('imperial');
    expect(res.body.locals.selectedDate).toBe('2099-04-01');
  });

  it('defaults city units to metric when query omitted', async () => {
    vi.spyOn(weatherService, 'getWeatherByCity').mockResolvedValueOnce({
      name: 'Paris',
      sys: { country: 'FR' },
      main: { temp: 13, feels_like: 11, humidity: 66 },
      weather: [{ main: 'Clear', description: 'clear sky', icon: '01d' }],
      wind: { speed: 2 },
    });

    const res = await request(makeApp()).get('/city/paris');

    expect(res.status).toBe(200);
    expect(weatherService.getWeatherByCity).toHaveBeenCalledWith('paris', 'metric');
    expect(res.body.locals.units).toBe('metric');
  });

  it('renders error page for city errors', async () => {
    vi.spyOn(weatherService, 'getWeatherByCity').mockRejectedValueOnce(
      Object.assign(new Error('city boom'), { status: 404 })
    );

    const res = await request(makeApp()).get('/city/unknown');

    expect(res.status).toBe(404);
    expect(res.body.view).toBe('error');
    expect(res.body.locals).toEqual({ message: 'city boom', location: 'unknown' });
  });

  it('renders coordinates weather', async () => {
    vi.spyOn(weatherService, 'getWeatherByCoordinates').mockResolvedValueOnce({
      name: 'Spa',
      sys: { country: 'BE' },
      main: { temp: 9, feels_like: 7, humidity: 81 },
      weather: [{ main: 'Rain', description: 'light rain', icon: '10d' }],
      wind: { speed: 4 },
    });

    const res = await request(makeApp()).get('/coordinates/50.447/5.962');

    expect(res.status).toBe(200);
    expect(weatherService.getWeatherByCoordinates).toHaveBeenCalledWith(
      '50.447',
      '5.962',
      'metric'
    );
    expect(res.body.view).toBe('weather');
  });

  it('renders error page for coordinate errors', async () => {
    vi.spyOn(weatherService, 'getWeatherByCoordinates').mockRejectedValueOnce(
      Object.assign(new Error('coord boom'), { status: 500 })
    );

    const res = await request(makeApp()).get('/coordinates/0/0');

    expect(res.status).toBe(500);
    expect(res.body.view).toBe('error');
    expect(res.body.locals).toEqual({ message: 'coord boom', location: '0, 0' });
  });
});
