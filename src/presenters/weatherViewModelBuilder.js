const {
  getConditionStyles,
  getUnitSymbol,
  getWindUnit,
  formatDateLabel,
} = require('../utils/helpers');

function extractPrecipitation(data) {
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

  return { precipitationAmountMm, precipitationChance };
}

function buildWeatherViewModel(data, units, extras = {}) {
  const styles = getConditionStyles(data.weather[0].main);
  const { precipitationAmountMm, precipitationChance } = extractPrecipitation(data);

  return {
    city: data.name,
    country: data.sys.country,
    temperature: Math.round(data.main.temp),
    feelsLike: Math.round(data.main.feels_like),
    description: data.weather[0].description,
    icon: data.weather[0].icon,
    humidity: data.main.humidity,
    windSpeed: Math.round(data.wind.speed),
    precipitationChance,
    precipitationAmountMm,
    units,
    unitSymbol: getUnitSymbol(units),
    windUnit: getWindUnit(units),
    bgGradient: styles.bg,
    textColor: styles.text,
    selectedDate: extras.selectedDate || null,
    selectedDateLabel: extras.selectedDate ? formatDateLabel(extras.selectedDate) : null,
    infoMessage: extras.infoMessage || null,
    forecastMode: Boolean(extras.selectedDate),
    githubRepoUrl: extras.githubRepoUrl || null,
  };
}

module.exports = { buildWeatherViewModel };

