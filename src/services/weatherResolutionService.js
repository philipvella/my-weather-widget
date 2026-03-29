const DEFAULT_MESSAGES = {
  invalidDate: 'That date format is invalid. Use YYYY-MM-DD. Showing live weather instead.',
  pastDate: 'That date has already passed. Showing live weather instead.',
  unavailableForecast: 'Unavailable, showing live.',
};

function createWeatherResolutionService({
  weatherService,
  parseDateQuery,
  messages = DEFAULT_MESSAGES,
}) {
  async function resolveWithOptionalDate({ dateQuery, fetchCurrent, fetchForecast }) {
    const parsedDate = parseDateQuery(dateQuery);

    if (!parsedDate.dateQuery) {
      const data = await fetchCurrent();
      return { data, selectedDate: null, infoMessage: null };
    }

    if (!parsedDate.isValid) {
      const data = await fetchCurrent();
      return {
        data,
        selectedDate: parsedDate.dateQuery,
        infoMessage: messages.invalidDate,
      };
    }

    if (parsedDate.isPast) {
      const data = await fetchCurrent();
      return {
        data,
        selectedDate: parsedDate.dateQuery,
        infoMessage: messages.pastDate,
      };
    }

    const forecastData = await fetchForecast(parsedDate.dateQuery);
    if (forecastData) {
      return { data: forecastData, selectedDate: parsedDate.dateQuery, infoMessage: null };
    }

    const data = await fetchCurrent();
    return {
      data,
      selectedDate: parsedDate.dateQuery,
      infoMessage: messages.unavailableForecast,
    };
  }

  async function resolveByCity(city, units, dateQuery) {
    return resolveWithOptionalDate({
      dateQuery,
      fetchCurrent: () => weatherService.getWeatherByCity(city, units),
      fetchForecast: (normalizedDate) =>
        weatherService.getForecastByCityAndDate(city, normalizedDate, units),
    });
  }

  async function resolveByCoordinates(lat, lon, units, dateQuery) {
    return resolveWithOptionalDate({
      dateQuery,
      fetchCurrent: () => weatherService.getWeatherByCoordinates(lat, lon, units),
      fetchForecast: (normalizedDate) =>
        weatherService.getForecastByCoordinatesAndDate(lat, lon, normalizedDate, units),
    });
  }

  return { resolveByCity, resolveByCoordinates };
}

module.exports = { createWeatherResolutionService, DEFAULT_MESSAGES };
