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

function listDatesInRange(fromDate, toDate) {
  const start = parseIsoDate(fromDate);
  const end = parseIsoDate(toDate);
  if (!start || !end || start.getTime() > end.getTime()) return [];

  const dates = [];
  const cursor = new Date(start);
  while (cursor.getTime() <= end.getTime()) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

function getChipClass(isActive, isPlaceholder) {
  if (isActive) {
    return 'rounded-md border bg-white/25 border-white/70 ring-1 ring-white/60 font-semibold px-2 py-2 text-center min-w-20 w-32 h-24 flex flex-col items-center justify-start no-underline text-inherit pointer-events-none';
  }

  if (isPlaceholder) {
    return 'rounded-md border bg-black/10 border-white/20 opacity-90 px-2 py-2 text-center w-32 h-24 flex flex-col items-center justify-start no-underline text-inherit pointer-events-none';
  }

  return 'rounded-md border bg-black/15 border-white/20 px-2 py-2 text-center w-32 h-24 flex flex-col items-center justify-start no-underline text-inherit hover:bg-black/25 cursor-pointer transition-colors';
}

function getEntryDate(entry) {
  if (typeof entry?.dt_txt !== 'string') return null;
  return entry.dt_txt.slice(0, 10);
}

function buildRangeItem({ date, entry, units, selectedRange, spanDays, isPlaceholder }) {
  const isActive = date !== null && date === selectedRange?.from;
  const focusFrom = !isPlaceholder && spanDays && date ? date : null;
  const focusTo = !isPlaceholder && spanDays && date ? addUtcDays(date, spanDays - 1) : null;

  return {
    date,
    dateLabel: date ? formatDateLabel(date) : null,
    isActive,
    chipClass: getChipClass(isActive, isPlaceholder),
    temperature: isPlaceholder ? null : Math.round(entry.main.temp),
    unitSymbol: getUnitSymbol(units),
    icon: isPlaceholder ? null : entry.weather?.[0]?.icon || null,
    description: isPlaceholder
      ? 'Too early to predict'
      : entry.weather?.[0]?.description || 'forecast',
    isPlaceholder,
    focusRange: focusFrom && focusTo ? { from: focusFrom, to: focusTo } : null,
    focusQuery: focusFrom && focusTo ? `from=${focusFrom}&to=${focusTo}` : null,
  };
}

function buildRangeItems(rangeItems, units, selectedRange, showRangePlaceholders) {
  const fromDate = parseIsoDate(selectedRange?.from);
  const toDate = parseIsoDate(selectedRange?.to);
  const spanDays =
    fromDate && toDate ? Math.floor((toDate.getTime() - fromDate.getTime()) / 86400000) + 1 : null;

  const hasRangeData = Array.isArray(rangeItems) && rangeItems.length > 0;
  const requestedDates =
    selectedRange?.from && selectedRange?.to
      ? listDatesInRange(selectedRange.from, selectedRange.to)
      : [];

  if (requestedDates.length > 0 && (hasRangeData || showRangePlaceholders)) {
    const entriesByDate = new Map(
      (rangeItems || [])
        .map((entry) => [getEntryDate(entry), entry])
        .filter(([date]) => Boolean(date))
    );

    return requestedDates.map((date) => {
      const entry = entriesByDate.get(date);
      const isPlaceholder = !entry;
      return buildRangeItem({ date, entry, units, selectedRange, spanDays, isPlaceholder });
    });
  }

  if (!hasRangeData) return [];

  return rangeItems
    .map((entry) => {
      const date = getEntryDate(entry);
      if (!date) return null;
      return buildRangeItem({
        date,
        entry,
        units,
        selectedRange,
        spanDays,
        isPlaceholder: false,
      });
    })
    .filter(Boolean);
}

function buildWeatherViewModel(data, units, extras = {}) {
  const styles = getConditionStyles(data.weather[0].main);
  const { precipitationAmountMm, precipitationChance } = extractPrecipitation(data);
  const selectedRange = extras.selectedRange || null;
  const selectedRangeLabel =
    selectedRange?.from && selectedRange?.to
      ? `${formatDateLabel(selectedRange.from)} - ${formatDateLabel(selectedRange.to)}`
      : null;
  const rangeItems = buildRangeItems(
    extras.rangeItems,
    units,
    selectedRange,
    Boolean(extras.showRangePlaceholders)
  );

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
