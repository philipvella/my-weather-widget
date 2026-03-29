const CONDITION_STYLES = {
  Thunderstorm: { bg: 'from-gray-800 via-purple-900 to-gray-900', text: 'text-white' },
  Drizzle: { bg: 'from-blue-400 to-slate-600', text: 'text-white' },
  Rain: { bg: 'from-blue-500 to-slate-700', text: 'text-white' },
  Snow: { bg: 'from-blue-100 to-slate-300', text: 'text-slate-800' },
  Clear: { bg: 'from-yellow-300 via-amber-200 to-sky-400', text: 'text-slate-800' },
  Clouds: { bg: 'from-slate-400 to-slate-600', text: 'text-white' },
  // Atmosphere group: Mist, Smoke, Haze, Dust, Fog, Sand, Ash, Squall, Tornado
  Atmosphere: { bg: 'from-slate-300 to-slate-500', text: 'text-slate-800' },
};

const ATMOSPHERE = ['Mist', 'Smoke', 'Haze', 'Dust', 'Fog', 'Sand', 'Ash', 'Squall', 'Tornado'];

function getConditionStyles(main) {
  if (ATMOSPHERE.includes(main)) return CONDITION_STYLES.Atmosphere;
  return CONDITION_STYLES[main] || { bg: 'from-sky-400 to-blue-600', text: 'text-white' };
}

function getUnitSymbol(units) {
  return units === 'imperial' ? '°F' : '°C';
}

function getWindUnit(units) {
  return units === 'imperial' ? 'mph' : 'm/s';
}

function parseIsoDate(dateQuery) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateQuery)) return null;

  const parsed = new Date(`${dateQuery}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return null;

  // Guard impossible dates like 2026-02-31 that JS auto-rolls.
  if (parsed.toISOString().slice(0, 10) !== dateQuery) return null;

  return parsed;
}

function parseDateQuery(dateQuery) {
  if (!dateQuery) return { dateQuery: null, isValid: true, isPast: false };
  const parsed = parseIsoDate(dateQuery);
  if (!parsed) return { dateQuery, isValid: false, isPast: false };

  const todayUtc = new Date();
  todayUtc.setUTCHours(0, 0, 0, 0);

  return {
    dateQuery,
    isValid: true,
    isPast: parsed.getTime() < todayUtc.getTime(),
  };
}

function parseDateRangeQuery(fromQuery, toQuery) {
  if (!fromQuery && !toQuery) {
    return {
      hasRange: false,
      from: null,
      to: null,
      isValid: true,
      isPast: false,
      includesPast: false,
      rangeDays: 0,
    };
  }

  if (!fromQuery || !toQuery) {
    return {
      hasRange: true,
      from: fromQuery || null,
      to: toQuery || null,
      isValid: false,
      isPast: false,
      includesPast: false,
      rangeDays: 0,
    };
  }

  const fromDate = parseIsoDate(fromQuery);
  const toDate = parseIsoDate(toQuery);
  if (!fromDate || !toDate || fromDate.getTime() > toDate.getTime()) {
    return {
      hasRange: true,
      from: fromQuery,
      to: toQuery,
      isValid: false,
      isPast: false,
      includesPast: false,
      rangeDays: 0,
    };
  }

  const todayUtc = new Date();
  todayUtc.setUTCHours(0, 0, 0, 0);

  const rangeDays = Math.floor((toDate.getTime() - fromDate.getTime()) / 86400000) + 1;
  return {
    hasRange: true,
    from: fromQuery,
    to: toQuery,
    isValid: true,
    isPast: toDate.getTime() < todayUtc.getTime(),
    includesPast: fromDate.getTime() < todayUtc.getTime(),
    rangeDays,
  };
}

function formatDateLabel(dateQuery) {
  if (!dateQuery) return null;
  const parsed = new Date(`${dateQuery}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return dateQuery;
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsed);
}

module.exports = {
  getConditionStyles,
  getUnitSymbol,
  getWindUnit,
  parseDateQuery,
  parseDateRangeQuery,
  formatDateLabel,
};
