const express = require('express');
const router  = express.Router();
const weatherService = require('../services/weatherService');
const {
  getConditionStyles,
  getUnitSymbol,
  getWindUnit,
  parseDateQuery,
  formatDateLabel,
} = require('../utils/helpers');

function buildViewData(data, units, extras = {}) {
  const styles = getConditionStyles(data.weather[0].main);
  const rainAmount = typeof data.rain?.['1h'] === 'number'
    ? data.rain['1h']
    : (typeof data.rain?.['3h'] === 'number' ? data.rain['3h'] : 0);
  const snowAmount = typeof data.snow?.['1h'] === 'number'
    ? data.snow['1h']
    : (typeof data.snow?.['3h'] === 'number' ? data.snow['3h'] : 0);
  const precipitationAmountMm = Math.round((rainAmount + snowAmount) * 10) / 10;
  const precipitationChance = typeof data.pop === 'number'
    ? Math.round(data.pop * 100)
    : null;

  return {
    city:          data.name,
    country:       data.sys.country,
    temperature:   Math.round(data.main.temp),
    feelsLike:     Math.round(data.main.feels_like),
    description:   data.weather[0].description,
    icon:          data.weather[0].icon,
    humidity:      data.main.humidity,
    windSpeed:     Math.round(data.wind.speed),
    precipitationChance,
    precipitationAmountMm,
    units,
    unitSymbol:    getUnitSymbol(units),
    windUnit:      getWindUnit(units),
    bgGradient:    styles.bg,
    textColor:     styles.text,
    selectedDate:  extras.selectedDate || null,
    selectedDateLabel: extras.selectedDate ? formatDateLabel(extras.selectedDate) : null,
    infoMessage:   extras.infoMessage || null,
    forecastMode:  Boolean(extras.selectedDate),
  };
}

async function resolveWeatherByCity(city, units, dateQuery) {
  const parsedDate = parseDateQuery(dateQuery);

  if (!parsedDate.dateQuery) {
    const data = await weatherService.getWeatherByCity(city, units);
    return { data, selectedDate: null, infoMessage: null };
  }

  if (!parsedDate.isValid) {
    const data = await weatherService.getWeatherByCity(city, units);
    return {
      data,
      selectedDate: parsedDate.dateQuery,
      infoMessage: 'That date format is invalid. Use YYYY-MM-DD. Showing live weather instead.',
    };
  }

  if (parsedDate.isPast) {
    const data = await weatherService.getWeatherByCity(city, units);
    return {
      data,
      selectedDate: parsedDate.dateQuery,
      infoMessage: 'That date has already passed. Showing live weather instead.',
    };
  }

  const forecastData = await weatherService.getForecastByCityAndDate(city, parsedDate.dateQuery, units);
  if (forecastData) {
    return { data: forecastData, selectedDate: parsedDate.dateQuery, infoMessage: null };
  }

  const data = await weatherService.getWeatherByCity(city, units);
  return {
    data,
    selectedDate: parsedDate.dateQuery,
    infoMessage: 'No forecast is available for that date yet. Showing live weather instead.',
  };
}

async function resolveWeatherByCoordinates(lat, lon, units, dateQuery) {
  const parsedDate = parseDateQuery(dateQuery);

  if (!parsedDate.dateQuery) {
    const data = await weatherService.getWeatherByCoordinates(lat, lon, units);
    return { data, selectedDate: null, infoMessage: null };
  }

  if (!parsedDate.isValid) {
    const data = await weatherService.getWeatherByCoordinates(lat, lon, units);
    return {
      data,
      selectedDate: parsedDate.dateQuery,
      infoMessage: 'That date format is invalid. Use YYYY-MM-DD. Showing live weather instead.',
    };
  }

  if (parsedDate.isPast) {
    const data = await weatherService.getWeatherByCoordinates(lat, lon, units);
    return {
      data,
      selectedDate: parsedDate.dateQuery,
      infoMessage: 'That date has already passed. Showing live weather instead.',
    };
  }

  const forecastData = await weatherService.getForecastByCoordinatesAndDate(lat, lon, parsedDate.dateQuery, units);
  if (forecastData) {
    return { data: forecastData, selectedDate: parsedDate.dateQuery, infoMessage: null };
  }

  const data = await weatherService.getWeatherByCoordinates(lat, lon, units);
  return {
    data,
    selectedDate: parsedDate.dateQuery,
    infoMessage: 'No forecast is available for that date yet. Showing live weather instead.',
  };
}

// GET /coordinates/:lat/:lon  — must be defined BEFORE /:city
router.get('/coordinates/:lat/:lon', async (req, res) => {
  const { lat, lon } = req.params;
  const units = req.query.units === 'imperial' ? 'imperial' : 'metric';
  const dateQuery = typeof req.query.date === 'string' ? req.query.date : null;

  try {
    const result = await resolveWeatherByCoordinates(lat, lon, units, dateQuery);
    res.render('weather', buildViewData(result.data, units, {
      selectedDate: result.selectedDate,
      infoMessage: result.infoMessage,
    }));
  } catch (err) {
    console.error('[route] coordinate error:', err.message);
    res.status(err.status || 500).render('error', {
      message: err.message || `Unable to fetch weather data for coordinates ${lat},${lon},${units}`,
      location: `${lat}, ${lon}`,
    });
  }
});

// GET /:city
router.get('/:city', async (req, res) => {
  const { city } = req.params;
  const units = req.query.units === 'imperial' ? 'imperial' : 'metric';
  const dateQuery = typeof req.query.date === 'string' ? req.query.date : null;

  try {
    const result = await resolveWeatherByCity(city, units, dateQuery);
    res.render('weather', buildViewData(result.data, units, {
      selectedDate: result.selectedDate,
      infoMessage: result.infoMessage,
    }));
  } catch (err) {
    console.error('[route] city error:', err.message);
    res.status(err.status || 500).render('error', {
      message: err.message || `Unable to fetch weather data for "${city}" with units "${units}"`,
      location: city,
    });
  }
});

module.exports = router;

