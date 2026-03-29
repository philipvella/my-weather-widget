const DEFAULT_MESSAGES = {
  invalidDate: 'That date format is invalid. Use YYYY-MM-DD. Showing live weather instead.',
  pastDate: 'That date has already passed. Showing live weather instead.',
  invalidRange:
    'Date range is invalid. Use from/to in YYYY-MM-DD format and ensure from is before to. Showing live weather instead.',
  pastRange: 'That date range includes past dates. Showing live weather instead.',
  unavailableForecast: 'Unavailable, showing live.',
};

function createWeatherResolutionService({
  weatherService,
  parseDateQuery,
  parseDateRangeQuery,
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

  async function resolveWithOptionalRange({ fromQuery, toQuery, fetchCurrent, fetchRange }) {
    const parsedRange = parseDateRangeQuery(fromQuery, toQuery);

    if (!parsedRange.hasRange) {
      const data = await fetchCurrent();
      return {
        data,
        selectedDate: null,
        selectedRange: null,
        rangeItems: null,
        showRangePlaceholders: false,
        infoMessage: null,
      };
    }

    if (!parsedRange.isValid) {
      const data = await fetchCurrent();
      return {
        data,
        selectedDate: null,
        selectedRange: { from: parsedRange.from, to: parsedRange.to },
        rangeItems: null,
        showRangePlaceholders: false,
        infoMessage: messages.invalidRange,
      };
    }

    if (parsedRange.isPast || parsedRange.includesPast) {
      const data = await fetchCurrent();
      return {
        data,
        selectedDate: null,
        selectedRange: { from: parsedRange.from, to: parsedRange.to },
        rangeItems: null,
        showRangePlaceholders: false,
        infoMessage: messages.pastRange,
      };
    }

    const rangeItems = await fetchRange(parsedRange.from, parsedRange.to);
    if (Array.isArray(rangeItems) && rangeItems.length > 0) {
      return {
        data: rangeItems[0],
        selectedDate: null,
        selectedRange: { from: parsedRange.from, to: parsedRange.to },
        rangeItems,
        showRangePlaceholders: false,
        infoMessage: null,
      };
    }

    const data = await fetchCurrent();
    return {
      data,
      selectedDate: null,
      selectedRange: { from: parsedRange.from, to: parsedRange.to },
      rangeItems: null,
      showRangePlaceholders: true,
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

  async function resolveRangeByCity(city, units, fromQuery, toQuery) {
    return resolveWithOptionalRange({
      fromQuery,
      toQuery,
      fetchCurrent: () => weatherService.getWeatherByCity(city, units),
      fetchRange: (fromDate, toDate) =>
        weatherService.getForecastRangeByCity(city, fromDate, toDate, units),
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

  async function resolveRangeByCoordinates(lat, lon, units, fromQuery, toQuery) {
    return resolveWithOptionalRange({
      fromQuery,
      toQuery,
      fetchCurrent: () => weatherService.getWeatherByCoordinates(lat, lon, units),
      fetchRange: (fromDate, toDate) =>
        weatherService.getForecastRangeByCoordinates(lat, lon, fromDate, toDate, units),
    });
  }

  return { resolveByCity, resolveByCoordinates, resolveRangeByCity, resolveRangeByCoordinates };
}

module.exports = { createWeatherResolutionService, DEFAULT_MESSAGES };
