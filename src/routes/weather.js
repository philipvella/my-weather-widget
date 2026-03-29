const express = require('express');
const router = express.Router();
const weatherService = require('../services/weatherService');
const { parseDateQuery } = require('../utils/helpers');
const { createWeatherResolutionService } = require('../services/weatherResolutionService');
const { buildWeatherViewModel } = require('../presenters/weatherViewModelBuilder');

const weatherResolutionService = createWeatherResolutionService({
  weatherService,
  parseDateQuery,
});

// GET /coordinates/:lat/:lon  — must be defined BEFORE /city/:city
router.get('/coordinates/:lat/:lon', async (req, res) => {
  const { lat, lon } = req.params;
  const units = req.query.units === 'imperial' ? 'imperial' : 'metric';
  const dateQuery = typeof req.query.date === 'string' ? req.query.date : null;

  try {
    const result = await weatherResolutionService.resolveByCoordinates(lat, lon, units, dateQuery);
    res.render(
      'weather',
      buildWeatherViewModel(result.data, units, {
        selectedDate: result.selectedDate,
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

  try {
    const result = await weatherResolutionService.resolveByCity(city, units, dateQuery);
    res.render(
      'weather',
      buildWeatherViewModel(result.data, units, {
        selectedDate: result.selectedDate,
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
