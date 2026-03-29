import { describe, expect, it } from 'vitest';
import {
  getConditionStyles,
  getUnitSymbol,
  getWindUnit,
  parseDateQuery,
  formatDateLabel,
} from '../../src/utils/helpers';

describe('helpers', () => {
  it('maps condition styles including atmosphere and fallback', () => {
    expect(getConditionStyles('Rain')).toEqual({
      bg: 'from-blue-500 to-slate-700',
      text: 'text-white',
    });
    expect(getConditionStyles('Fog')).toEqual({
      bg: 'from-slate-300 to-slate-500',
      text: 'text-slate-800',
    });
    expect(getConditionStyles('Unknown')).toEqual({
      bg: 'from-sky-400 to-blue-600',
      text: 'text-white',
    });
  });

  it('returns correct unit symbols', () => {
    expect(getUnitSymbol('metric')).toBe('°C');
    expect(getUnitSymbol('imperial')).toBe('°F');
    expect(getWindUnit('metric')).toBe('m/s');
    expect(getWindUnit('imperial')).toBe('mph');
  });

  it('parses and validates date query', () => {
    const empty = parseDateQuery(null);
    expect(empty).toEqual({ dateQuery: null, isValid: true, isPast: false });

    const invalidFormat = parseDateQuery('2026/01/01');
    expect(invalidFormat.isValid).toBe(false);

    const impossibleDate = parseDateQuery('2026-02-31');
    expect(impossibleDate.isValid).toBe(false);

    const futureDate = parseDateQuery('2099-01-01');
    expect(futureDate.isValid).toBe(true);
    expect(futureDate.isPast).toBe(false);
  });

  it('formats date labels', () => {
    expect(formatDateLabel('2026-04-02')).toContain('2026');
    expect(formatDateLabel(null)).toBe(null);
  });
});
