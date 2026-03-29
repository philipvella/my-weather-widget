import { describe, expect, it } from 'vitest';
import { buildWeatherViewModel } from '../../src/presenters/weatherViewModelBuilder';

describe('buildWeatherViewModel', () => {
  const sampleData = {
    name: 'London',
    sys: { country: 'GB' },
    main: { temp: 12.4, feels_like: 10.9, humidity: 77 },
    weather: [{ main: 'Rain', description: 'light rain', icon: '10d' }],
    wind: { speed: 5.2 },
    rain: { '1h': 1.4 },
    snow: { '1h': 0.2 },
    pop: 0.61,
  };

  it('builds expected view model for metric units', () => {
    const vm = buildWeatherViewModel(sampleData, 'metric', {
      selectedDate: '2030-04-01',
      infoMessage: 'Unavailable, showing live.',
      githubRepoUrl: 'https://github.com/example/repo',
    });

    expect(vm.city).toBe('London');
    expect(vm.country).toBe('GB');
    expect(vm.temperature).toBe(12);
    expect(vm.feelsLike).toBe(11);
    expect(vm.unitSymbol).toBe('°C');
    expect(vm.windUnit).toBe('m/s');
    expect(vm.precipitationAmountMm).toBe(1.6);
    expect(vm.precipitationChance).toBe(61);
    expect(vm.forecastMode).toBe(true);
    expect(vm.infoMessage).toBe('Unavailable, showing live.');
    expect(vm.githubRepoUrl).toBe('https://github.com/example/repo');
    expect(vm.selectedDateLabel).toBeTruthy();
  });

  it('handles missing precipitation values', () => {
    const vm = buildWeatherViewModel(
      {
        ...sampleData,
        rain: undefined,
        snow: undefined,
        pop: undefined,
      },
      'imperial'
    );

    expect(vm.precipitationAmountMm).toBe(0);
    expect(vm.precipitationChance).toBe(null);
    expect(vm.unitSymbol).toBe('°F');
    expect(vm.windUnit).toBe('mph');
  });

  it('builds range metadata and mapped range items', () => {
    const vm = buildWeatherViewModel(sampleData, 'metric', {
      selectedRange: { from: '2030-04-01', to: '2030-04-03' },
      rangeItems: [
        {
          ...sampleData,
          dt_txt: '2030-04-01 12:00:00',
        },
        {
          ...sampleData,
          dt_txt: '2030-04-02 12:00:00',
          main: { ...sampleData.main, temp: 18.2 },
        },
        {
          ...sampleData,
          dt_txt: '2030-04-03 12:00:00',
          main: { ...sampleData.main, temp: 19.1 },
        },
      ],
    });

    expect(vm.forecastMode).toBe(true);
    expect(vm.selectedRangeLabel).toContain('2030');
    expect(vm.rangeItems).toHaveLength(3);
    expect(vm.rangeItems[0]).toMatchObject({
      date: '2030-04-01',
      temperature: 12,
      unitSymbol: '°C',
      focusRange: {
        from: '2030-04-01',
        to: '2030-04-03',
      },
    });

    expect(vm.rangeItems[1].focusRange).toEqual({
      from: '2030-04-02',
      to: '2030-04-04',
    });

    expect(vm.rangeItems[2].focusRange).toEqual({
      from: '2030-04-03',
      to: '2030-04-05',
    });
  });
});
