const {
  getConditionStyles,
  getUnitSymbol,
  getWindUnit,
  formatDateLabel,
} = require('../utils/helpers');

function extractPrecipitation(data) {
  const rainAmount =
    typeof data.rain?.['1h'] === 'number'
      ? data.rain['1h']
      : typeof data.rain?.['3h'] === 'number'
        ? data.rain['3h']
        : 0;
  const snowAmount =
    typeof data.snow?.['1h'] === 'number'
      ? data.snow['1h']
      : typeof data.snow?.['3h'] === 'number'
        ? data.snow['3h']
        : 0;

  const precipitationAmountMm = Math.round((rainAmount + snowAmount) * 10) / 10;
  const precipitationChance = typeof data.pop === 'number' ? Math.round(data.pop * 100) : null;

  return { precipitationAmountMm, precipitationChance };
}

function parseIsoDate(dateValue) {
  if (typeof dateValue !== 'string') return null;
  const parsed = new Date(`${dateValue}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function addUtcDays(dateValue, days) {
  const parsed = parseIsoDate(dateValue);
  if (!parsed) return null;
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

function buildRangeItems(rangeItems, units, selectedRange) {
  if (!Array.isArray(rangeItems)) return [];

  const fromDate = parseIsoDate(selectedRange?.from);
  const toDate = parseIsoDate(selectedRange?.to);
  const spanDays =
    fromDate && toDate ? Math.floor((toDate.getTime() - fromDate.getTime()) / 86400000) + 1 : null;

  return rangeItems.map((entry) => ({
    date: typeof entry.dt_txt === 'string' ? entry.dt_txt.slice(0, 10) : null,
    dateLabel: typeof entry.dt_txt === 'string' ? formatDateLabel(entry.dt_txt.slice(0, 10)) : null,
    temperature: Math.round(entry.main.temp),
    unitSymbol: getUnitSymbol(units),
    icon: entry.weather?.[0]?.icon || null,
    description: entry.weather?.[0]?.description || 'forecast',
    focusRange:
      spanDays && typeof entry.dt_txt === 'string'
        ? {
            from: entry.dt_txt.slice(0, 10),
            to: addUtcDays(entry.dt_txt.slice(0, 10), spanDays - 1),
          }
        : null,
  }));
}

function buildWeatherViewModel(data, units, extras = {}) {
  const styles = getConditionStyles(data.weather[0].main);
  const { precipitationAmountMm, precipitationChance } = extractPrecipitation(data);
  const selectedRange = extras.selectedRange || null;
  const selectedRangeLabel =
    selectedRange?.from && selectedRange?.to
      ? `${formatDateLabel(selectedRange.from)} - ${formatDateLabel(selectedRange.to)}`
      : null;
  const rangeItems = buildRangeItems(extras.rangeItems, units, selectedRange);

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
    selectedRange,
    selectedRangeLabel,
    rangeItems,
    basePath: extras.basePath || null,
    infoMessage: extras.infoMessage || null,
    forecastMode: Boolean(extras.selectedDate || selectedRangeLabel),
    githubRepoUrl: extras.githubRepoUrl || null,
  };
}

module.exports = { buildWeatherViewModel };
