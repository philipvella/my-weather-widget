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

function parseDateQuery(dateQuery) {
  if (!dateQuery) return { dateQuery: null, isValid: true, isPast: false };

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateQuery)) {
    return { dateQuery, isValid: false, isPast: false };
  }

  const parsed = new Date(`${dateQuery}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return { dateQuery, isValid: false, isPast: false };
  }

  // Guard impossible dates like 2026-02-31 that JS auto-rolls.
  if (parsed.toISOString().slice(0, 10) !== dateQuery) {
    return { dateQuery, isValid: false, isPast: false };
  }

  const todayUtc = new Date();
  todayUtc.setUTCHours(0, 0, 0, 0);

  return {
    dateQuery,
    isValid: true,
    isPast: parsed.getTime() < todayUtc.getTime(),
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
  formatDateLabel,
};
