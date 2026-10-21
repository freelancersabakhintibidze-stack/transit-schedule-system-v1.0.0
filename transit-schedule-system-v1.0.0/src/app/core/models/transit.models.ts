/**
 * Domain models for the public transit schedule system.
 *
 * The entities below are normalized: routes, stops, route stops, and
 * departures are stored and managed independently. Route numbers are
 * display labels only and must never be used as primary identifiers,
 * which keeps the schema stable for future migrations.
 */

/** Mode of transport operated on a route. */
export type TransportType = 'BUS' | 'MINIBUS';

/** Day types a timetable can apply to. */
export type DayType = 'WEEKDAY' | 'SATURDAY' | 'SUNDAY_HOLIDAY';

/** Transport filter value used by list screens ('ALL' disables filtering). */
export type TransportFilter = 'ALL' | TransportType;

/** A physical stop in the network. */
export interface Stop {
  readonly id: number;
  readonly name: string;
  readonly address: string;
}

/**
 * Join entity placing a stop on a route. `sequence` strictly dictates
 * the stop ordering per route and is expected to be contiguous from 1.
 */
export interface RouteStop {
  readonly routeId: number;
  readonly stopId: number;
  readonly sequence: number;
}

/** A scheduled route between two termini. */
export interface Route {
  readonly id: number;
  readonly number: string;
  readonly transportType: TransportType;
  readonly startStopId: number;
  readonly endStopId: number;
  readonly active: boolean;
}

/**
 * A single planned departure. `departureTime` is an HH:mm string in
 * 24-hour format; comparisons are always performed on minutes from
 * midnight, never on raw strings.
 */
export interface Departure {
  readonly id: number;
  readonly routeId: number;
  readonly dayType: DayType;
  readonly departureTime: string;
}

/** The complete, immutable dataset exposed by the repository. */
export interface TransitNetwork {
  readonly routes: readonly Route[];
  readonly stops: readonly Stop[];
  readonly routeStops: readonly RouteStop[];
  readonly departures: readonly Departure[];
}

/** Precomputed view model for route list rows. */
export interface RouteSummary {
  readonly route: Route;
  readonly origin: Stop;
  readonly destination: Stop;
  readonly firstDeparture: string | null;
  readonly lastDeparture: string | null;
  readonly departureCount: number;
  readonly stopCount: number;
}

/** View model for the stop departures board: one row per serving route. */
export interface StopRouteDeparture {
  readonly route: Route;
  readonly towards: Stop | null;
  readonly upcoming: readonly Departure[];
}

/** Canonical day type order used by selectors across the app. */
export const DAY_TYPES: readonly DayType[] = ['WEEKDAY', 'SATURDAY', 'SUNDAY_HOLIDAY'];

/** Canonical transport type order. */
export const TRANSPORT_TYPES: readonly TransportType[] = ['BUS', 'MINIBUS'];

/** Human readable labels for day types. */
export const DAY_TYPE_LABELS: Record<DayType, string> = {
  WEEKDAY: 'Weekday',
  SATURDAY: 'Saturday',
  SUNDAY_HOLIDAY: 'Sunday & holidays'
};

/** Human readable labels for transport types. */
export const TRANSPORT_TYPE_LABELS: Record<TransportType, string> = {
  BUS: 'Bus',
  MINIBUS: 'Minibus'
};

/** Narrowing guard for day types coming from URLs or free input. */
export function isDayType(value: unknown): value is DayType {
  return value === 'WEEKDAY' || value === 'SATURDAY' || value === 'SUNDAY_HOLIDAY';
}

/** Narrowing guard for transport types coming from URLs or free input. */
export function isTransportType(value: unknown): value is TransportType {
  return value === 'BUS' || value === 'MINIBUS';
}
