const express = require('express');
const router = express.Router();
const weatherService = require('../services/weatherService');
const { parseDateQuery, parseDateRangeQuery } = require('../utils/helpers');
const { createWeatherResolutionService } = require('../services/weatherResolutionService');
const { buildWeatherViewModel } = require('../presenters/weatherViewModelBuilder');

const weatherResolutionService = createWeatherResolutionService({
  weatherService,
  parseDateQuery,
  parseDateRangeQuery,
});

// GET /coordinates/:lat/:lon  — must be defined BEFORE /city/:city
router.get('/coordinates/:lat/:lon', async (req, res) => {
  const { lat, lon } = req.params;
  const units = req.query.units === 'imperial' ? 'imperial' : 'metric';
  const dateQuery = typeof req.query.date === 'string' ? req.query.date : null;
  const fromQuery = typeof req.query.from === 'string' ? req.query.from : null;
  const toQuery = typeof req.query.to === 'string' ? req.query.to : null;
  const hasRangeQuery = Boolean(fromQuery || toQuery);
  const basePath = `/coordinates/${lat}/${lon}`;

  try {
    const result = hasRangeQuery
      ? await weatherResolutionService.resolveRangeByCoordinates(
          lat,
          lon,
          units,
          fromQuery,
          toQuery
        )
      : await weatherResolutionService.resolveByCoordinates(lat, lon, units, dateQuery);
    res.render(
      'weather',
      buildWeatherViewModel(result.data, units, {
        selectedDate: result.selectedDate,
        selectedRange: result.selectedRange,
        rangeItems: result.rangeItems,
        basePath,
        infoMessage: result.infoMessage,
        githubRepoUrl: process.env.GITHUB_REPO_URL || null,
      })
    );
  } catch (err) {
    console.error('[route] coordinate error:', err.message);
    res.status(err.status || 500).render('error', {
      message: err.message || `Unable to fetch weather data for coordinates ${lat},${lon},${units}`,
      location: `${lat}, ${lon}`,
    });
  }
});

// GET /city/:city
router.get('/city/:city', async (req, res) => {
  const { city } = req.params;
  const units = req.query.units === 'imperial' ? 'imperial' : 'metric';
  const dateQuery = typeof req.query.date === 'string' ? req.query.date : null;
  const fromQuery = typeof req.query.from === 'string' ? req.query.from : null;
  const toQuery = typeof req.query.to === 'string' ? req.query.to : null;
  const hasRangeQuery = Boolean(fromQuery || toQuery);
  const basePath = `/city/${encodeURIComponent(city)}`;

  try {
    const result = hasRangeQuery
      ? await weatherResolutionService.resolveRangeByCity(city, units, fromQuery, toQuery)
      : await weatherResolutionService.resolveByCity(city, units, dateQuery);
    res.render(
      'weather',
      buildWeatherViewModel(result.data, units, {
        selectedDate: result.selectedDate,
        selectedRange: result.selectedRange,
        rangeItems: result.rangeItems,
        basePath,
        infoMessage: result.infoMessage,
        githubRepoUrl: process.env.GITHUB_REPO_URL || null,
      })
    );
  } catch (err) {
    console.error('[route] city error:', err.message);
    res.status(err.status || 500).render('error', {
      message: err.message || `Unable to fetch weather data for "${city}" with units "${units}"`,
      location: city,
    });
  }
});

module.exports = router;
