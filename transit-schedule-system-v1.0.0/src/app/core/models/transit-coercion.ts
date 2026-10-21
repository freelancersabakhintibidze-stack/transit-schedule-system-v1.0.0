/**
 * Coercion helpers shared by components that receive route parameters or
 * query parameters through `withComponentInputBinding`. They never throw:
 * anything unparseable becomes `undefined` or `NaN`, which downstream
 * code already treats as "record not found" or "invalid reference time".
 */

import { isDayType, DayType } from './transit.models';

/** Strict HH:mm (24-hour) shape used across the system. */
export const DepartureTimePattern = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

/** Transforms a URL segment or query value into a numeric entity id (NaN when invalid). */
export function numericIdAttribute(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

/** Transforms a query parameter into a DayType, or undefined when invalid. */
export function dayTypeAttribute(value: unknown): DayType | undefined {
  return isDayType(value) ? value : undefined;
}

/** Transforms a query parameter into an HH:mm reference time, or undefined. */
export function timeAttribute(value: unknown): string | undefined {
  return typeof value === 'string' && DepartureTimePattern.test(value) ? value : undefined;
}
