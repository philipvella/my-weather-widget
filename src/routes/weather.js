const express = require('express');
const router  = express.Router();
const weatherService = require('../services/weatherService');
const { getConditionStyles, getUnitSymbol, getWindUnit } = require('../utils/helpers');

function buildViewData(data, units) {
  const styles = getConditionStyles(data.weather[0].main);
  return {
    city:          data.name,
    country:       data.sys.country,
    temperature:   Math.round(data.main.temp),
    feelsLike:     Math.round(data.main.feels_like),
    description:   data.weather[0].description,
    icon:          data.weather[0].icon,
    humidity:      data.main.humidity,
    windSpeed:     Math.round(data.wind.speed),
    units,
    unitSymbol:    getUnitSymbol(units),
    windUnit:      getWindUnit(units),
    bgGradient:    styles.bg,
    textColor:     styles.text,
  };
}

// GET /weather/coordinate/:lat/:lon  — must be defined BEFORE /:city
router.get('/coordinate/:lat/:lon', async (req, res) => {
  const { lat, lon } = req.params;
  const units = req.query.units === 'imperial' ? 'imperial' : 'metric';

  try {
    const data = await weatherService.getWeatherByCoordinates(lat, lon, units);
    res.render('weather', buildViewData(data, units));
  } catch (err) {
    console.error('[route] coordinate error:', err.message);
    res.status(err.status || 500).render('error', {
      message: err.message || `Unable to fetch weather data for coordinates ${lat},${lon},${units}`,
      location: `${lat}, ${lon}`,
    });
  }
});

// GET /weather/:city
router.get('/:city', async (req, res) => {
  const { city } = req.params;
  const units = req.query.units === 'imperial' ? 'imperial' : 'metric';

  try {
    const data = await weatherService.getWeatherByCity(city, units);
    res.render('weather', buildViewData(data, units));
  } catch (err) {
    console.error('[route] city error:', err.message);
    res.status(err.status || 500).render('error', {
      message: err.message || `Unable to fetch weather data for "${city}" with units "${units}"`,
      location: city,
    });
  }
});

module.exports = router;

