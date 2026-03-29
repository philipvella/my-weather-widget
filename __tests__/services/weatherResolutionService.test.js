import { describe, it, expect, vi } from 'vitest';
import {
  createWeatherResolutionService,
  DEFAULT_MESSAGES,
} from '../../src/services/weatherResolutionService';

describe('weatherResolutionService', () => {
  function makeService(
    parseResult,
    forecastResult = null,
    parseRangeResult = null,
    rangeResult = []
  ) {
    const weatherService = {
      getWeatherByCity: vi.fn().mockResolvedValue({ source: 'current-city' }),
      getForecastByCityAndDate: vi.fn().mockResolvedValue(forecastResult),
      getWeatherByCoordinates: vi.fn().mockResolvedValue({ source: 'current-coord' }),
      getForecastByCoordinatesAndDate: vi.fn().mockResolvedValue(forecastResult),
      getForecastRangeByCity: vi.fn().mockResolvedValue(rangeResult),
      getForecastRangeByCoordinates: vi.fn().mockResolvedValue(rangeResult),
    };

    const parseDateQuery = vi.fn().mockReturnValue(parseResult);
    const parseDateRangeQuery = vi.fn().mockReturnValue(
      parseRangeResult || {
        hasRange: false,
        from: null,
        to: null,
        isValid: true,
        isPast: false,
        includesPast: false,
      }
    );
    const service = createWeatherResolutionService({
      weatherService,
      parseDateQuery,
      parseDateRangeQuery,
    });

    return { service, weatherService };
  }

  it('returns current weather when date is not provided', async () => {
    const { service, weatherService } = makeService({
      dateQuery: null,
      isValid: true,
      isPast: false,
    });

    const result = await service.resolveByCity('paris', 'metric', null);

    expect(result).toEqual({
      data: { source: 'current-city' },
      selectedDate: null,
      infoMessage: null,
    });
    expect(weatherService.getWeatherByCity).toHaveBeenCalledWith('paris', 'metric');
    expect(weatherService.getForecastByCityAndDate).not.toHaveBeenCalled();
  });

  it('falls back with invalid date message when date is invalid', async () => {
    const parsed = { dateQuery: '2026-99-99', isValid: false, isPast: false };
    const { service, weatherService } = makeService(parsed);

    const result = await service.resolveByCity('paris', 'metric', parsed.dateQuery);

    expect(result.selectedDate).toBe(parsed.dateQuery);
    expect(result.infoMessage).toBe(DEFAULT_MESSAGES.invalidDate);
    expect(weatherService.getWeatherByCity).toHaveBeenCalledTimes(1);
    expect(weatherService.getForecastByCityAndDate).not.toHaveBeenCalled();
  });

  it('falls back with past date message when date is in the past', async () => {
    const parsed = { dateQuery: '2020-01-01', isValid: true, isPast: true };
    const { service, weatherService } = makeService(parsed);

    const result = await service.resolveByCoordinates('50.4', '5.9', 'metric', parsed.dateQuery);

    expect(result.selectedDate).toBe(parsed.dateQuery);
    expect(result.infoMessage).toBe(DEFAULT_MESSAGES.pastDate);
    expect(weatherService.getWeatherByCoordinates).toHaveBeenCalledTimes(1);
    expect(weatherService.getForecastByCoordinatesAndDate).not.toHaveBeenCalled();
  });

  it('returns forecast when future date has data', async () => {
    const parsed = { dateQuery: '2030-01-01', isValid: true, isPast: false };
    const forecastData = { source: 'forecast' };
    const { service, weatherService } = makeService(parsed, forecastData);

    const result = await service.resolveByCity('london', 'imperial', parsed.dateQuery);

    expect(result).toEqual({
      data: forecastData,
      selectedDate: parsed.dateQuery,
      infoMessage: null,
    });
    expect(weatherService.getForecastByCityAndDate).toHaveBeenCalledWith(
      'london',
      parsed.dateQuery,
      'imperial'
    );
    expect(weatherService.getWeatherByCity).not.toHaveBeenCalled();
  });

  it('falls back with unavailable message when forecast has no data', async () => {
    const parsed = { dateQuery: '2030-01-01', isValid: true, isPast: false };
    const { service, weatherService } = makeService(parsed, null);

    const result = await service.resolveByCity('rome', 'metric', parsed.dateQuery);

    expect(result.infoMessage).toBe(DEFAULT_MESSAGES.unavailableForecast);
    expect(result.selectedDate).toBe(parsed.dateQuery);
    expect(weatherService.getForecastByCityAndDate).toHaveBeenCalledTimes(1);
    expect(weatherService.getWeatherByCity).toHaveBeenCalledTimes(1);
  });

  it('returns range forecast when from/to has data', async () => {
    const rangeParse = {
      hasRange: true,
      from: '2099-01-01',
      to: '2099-01-03',
      isValid: true,
      isPast: false,
      includesPast: false,
    };
    const rangeItems = [{ source: 'range-day-1' }, { source: 'range-day-2' }];
    const { service, weatherService } = makeService(
      { dateQuery: null, isValid: true, isPast: false },
      null,
      rangeParse,
      rangeItems
    );

    const result = await service.resolveRangeByCity('london', 'metric', '2099-01-01', '2099-01-03');

    expect(result.data).toEqual(rangeItems[0]);
    expect(result.rangeItems).toEqual(rangeItems);
    expect(result.selectedRange).toEqual({ from: '2099-01-01', to: '2099-01-03' });
    expect(weatherService.getForecastRangeByCity).toHaveBeenCalledWith(
      'london',
      '2099-01-01',
      '2099-01-03',
      'metric'
    );
  });

  it('falls back with invalid range message', async () => {
    const rangeParse = {
      hasRange: true,
      from: '2099-01-03',
      to: '2099-01-01',
      isValid: false,
      isPast: false,
      includesPast: false,
    };
    const { service, weatherService } = makeService(
      { dateQuery: null, isValid: true, isPast: false },
      null,
      rangeParse,
      []
    );

    const result = await service.resolveRangeByCoordinates(
      '50.4',
      '5.9',
      'metric',
      '2099-01-03',
      '2099-01-01'
    );

    expect(result.infoMessage).toBe(DEFAULT_MESSAGES.invalidRange);
    expect(weatherService.getWeatherByCoordinates).toHaveBeenCalledTimes(1);
    expect(weatherService.getForecastRangeByCoordinates).not.toHaveBeenCalled();
  });
});
