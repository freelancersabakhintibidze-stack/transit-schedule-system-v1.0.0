/**
 * Static mock dataset for the Meridian transit network.
 *
 * Stops and routes are hand authored. Departures are expanded
 * deterministically from per-route headway plans (first departure, last
 * departure, and step in minutes) so the dataset stays compact, readable,
 * and reproducible. Every entity is deep frozen before it leaves this
 * module: the rest of the application can never mutate the dataset.
 *
 * A second builder, `buildSyntheticNetwork`, generates an arbitrary number
 * of routes (500+) for scale testing of search and filtering.
 */

import { DayType, Departure, Route, RouteStop, Stop, TransportType, TransitNetwork } from '../models/transit.models';

/** HH:mm string from hours and minutes, both already validated. */
function hhmm(hours: number, minutes: number): string {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/** Parses HH:mm into minutes from midnight; returns null when invalid. */
function toMinutes(time: string): number | null {
  if (!/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
    return null;
  }
  return Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
}

/** Recursively freezes an object graph. */
function freezeDeep<T>(value: T): Readonly<T> {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const key of Object.keys(value as Record<string, unknown>)) {
      freezeDeep((value as Record<string, unknown>)[key]);
    }
  }
  return Object.freeze(value);
}

interface StopSeed {
  readonly name: string;
  readonly address: string;
}

const STOP_SEEDS: readonly StopSeed[] = [
  { name: 'Central Station', address: 'Station Square 1' },
  { name: 'Central Library', address: 'Knowledge Walk 12' },
  { name: 'Opera House', address: 'Aria Avenue 4' },
  { name: 'Market Street', address: 'Market Street 88' },
  { name: 'Old Town Hall', address: 'Heritage Square 2' },
  { name: 'Riverside Park', address: 'Riverside Walk 21' },
  { name: 'Ferry Pier', address: 'Pier Road 3' },
  { name: 'Harbor Quarter', address: 'Dockside Lane 17' },
  { name: 'Wharf Street', address: 'Wharf Street 45' },
  { name: 'North Hospital', address: 'Care Avenue 100' },
  { name: 'Stadium', address: 'Arena Boulevard 1' },
  { name: 'Sports Complex', address: 'Athletes Way 9' },
  { name: 'University Campus', address: 'Campus Ring 8' },
  { name: 'Tech Park', address: 'Innovation Drive 40' },
  { name: 'Research Institute', address: 'Discovery Lane 6' },
  { name: 'Airport Terminal', address: 'Terminal Access 300' },
  { name: 'Cargo Center', address: 'Freight Yard 22' },
  { name: 'Eastgate', address: 'Gate Way East 15' },
  { name: 'Westgate', address: 'Gate Way West 15' },
  { name: 'Industrial Zone East', address: 'Foundry Road 77' },
  { name: 'Quarry Road', address: 'Quarry Road 31' },
  { name: 'Millbrook', address: 'Mill Lane 5' },
  { name: 'Cedar Crossing', address: 'Cedar Avenue 19' },
  { name: 'Hillview', address: 'Summit Terrace 27' },
  { name: 'Lakeshore', address: 'Lake Promenade 1' },
  { name: 'Botanical Garden', address: 'Gardener Street 24' },
  { name: 'Museum District', address: 'Gallery Row 11' },
  { name: 'Convention Center', address: 'Exhibition Way 2' },
  { name: 'South Mall', address: 'Merchant Parade 60' },
  { name: 'Vine Street', address: 'Vine Street 33' },
  { name: 'Rose Gardens', address: 'Blossom Lane 8' },
  { name: 'Kingsbridge', address: 'Bridge Street 1' },
  { name: "Tanner's Row", address: "Tanner's Row 14" },
  { name: 'Goldsmith Street', address: 'Goldsmith Street 29' },
  { name: 'Fire Station 3', address: 'Rescue Road 3' },
  { name: 'Observatory Hill', address: 'Star Route 10' }
];

interface RouteSeed {
  readonly number: string;
  readonly transportType: TransportType;
  /** Stop names in travel order; first is origin, last is destination. */
  readonly stops: readonly string[];
  readonly active?: boolean;
}

const ROUTE_SEEDS: readonly RouteSeed[] = [
  { number: '1', transportType: 'BUS', stops: ['Central Station', 'Central Library', 'Museum District', 'Convention Center', 'University Campus', 'Research Institute', 'Tech Park', 'Airport Terminal'] },
  { number: '3', transportType: 'BUS', stops: ['Harbor Quarter', 'Wharf Street', 'Kingsbridge', 'Riverside Park', 'Vine Street', 'Rose Gardens', 'Hillview'] },
  { number: '4', transportType: 'BUS', stops: ['Central Station', 'Market Street', "Tanner's Row", 'Goldsmith Street', 'Old Town Hall', 'Botanical Garden', 'Lakeshore'] },
  { number: '7', transportType: 'BUS', stops: ['Stadium', 'Sports Complex', 'Industrial Zone East', 'Eastgate', 'Convention Center', 'Museum District', 'South Mall'] },
  { number: '9', transportType: 'BUS', stops: ['Central Station', 'Opera House', 'Old Town Hall', 'Fire Station 3', 'Cedar Crossing', 'Millbrook', 'Quarry Road', 'Observatory Hill'] },
  { number: '12', transportType: 'BUS', stops: ['Airport Terminal', 'Tech Park', 'University Campus', 'Convention Center', 'Museum District', 'Central Library', 'Central Station', 'Kingsbridge', 'Wharf Street', 'Harbor Quarter'] },
  { number: '15', transportType: 'BUS', stops: ['North Hospital', 'Goldsmith Street', 'Market Street', 'Opera House', 'Central Library', 'Central Station'] },
  { number: '18', transportType: 'BUS', stops: ['Westgate', 'Botanical Garden', 'Lakeshore', 'Riverside Park', 'Kingsbridge', 'Industrial Zone East', 'Eastgate'] },
  { number: '22', transportType: 'BUS', stops: ['Central Station', 'Central Library', 'Museum District', 'Convention Center', 'University Campus', 'Tech Park'] },
  { number: '27', transportType: 'BUS', stops: ['Ferry Pier', 'Wharf Street', 'Kingsbridge', 'Riverside Park', 'Vine Street', 'Rose Gardens'] },
  { number: '31', transportType: 'BUS', stops: ['Quarry Road', 'Millbrook', 'Cedar Crossing', 'Riverside Park', 'Kingsbridge', 'Wharf Street', 'Harbor Quarter'], active: false },
  { number: 'M2', transportType: 'MINIBUS', stops: ['Central Station', 'Market Street', 'Opera House', 'Old Town Hall', 'Central Library', 'University Campus'] },
  { number: 'M5', transportType: 'MINIBUS', stops: ['Lakeshore', 'Botanical Garden', 'Old Town Hall', 'Goldsmith Street', "Tanner's Row", 'Market Street', 'Museum District'] },
  { number: 'M8', transportType: 'MINIBUS', stops: ['Stadium', 'Sports Complex', 'Fire Station 3', 'North Hospital'] },
  { number: 'M11', transportType: 'MINIBUS', stops: ['Airport Terminal', 'Research Institute', 'Tech Park', 'Convention Center'] }
];

/** Headway plan for one route on one day type. */
interface HeadwayPlan {
  readonly first: string;
  readonly last: string;
  readonly stepMinutes: number;
}

/**
 * Published timetables per route number and day type. The final departure
 * is always anchored exactly at `last`, which mirrors printed timetables
 * where the last trip can sit slightly off the regular headway.
 */
const DEPARTURE_PLANS: Record<string, Record<DayType, HeadwayPlan>> = {
  '1': { WEEKDAY: { first: '05:30', last: '23:48', stepMinutes: 12 }, SATURDAY: { first: '06:00', last: '23:36', stepMinutes: 18 }, SUNDAY_HOLIDAY: { first: '06:30', last: '22:30', stepMinutes: 30 } },
  '3': { WEEKDAY: { first: '05:40', last: '23:10', stepMinutes: 14 }, SATURDAY: { first: '06:20', last: '22:40', stepMinutes: 20 }, SUNDAY_HOLIDAY: { first: '07:00', last: '21:20', stepMinutes: 35 } },
  '4': { WEEKDAY: { first: '05:20', last: '23:30', stepMinutes: 10 }, SATURDAY: { first: '06:00', last: '23:00', stepMinutes: 15 }, SUNDAY_HOLIDAY: { first: '06:40', last: '22:20', stepMinutes: 25 } },
  '7': { WEEKDAY: { first: '05:45', last: '22:45', stepMinutes: 15 }, SATURDAY: { first: '06:45', last: '22:15', stepMinutes: 25 }, SUNDAY_HOLIDAY: { first: '07:30', last: '21:00', stepMinutes: 40 } },
  '9': { WEEKDAY: { first: '05:30', last: '22:50', stepMinutes: 16 }, SATURDAY: { first: '06:30', last: '22:10', stepMinutes: 24 }, SUNDAY_HOLIDAY: { first: '07:10', last: '21:00', stepMinutes: 36 } },
  '12': { WEEKDAY: { first: '05:10', last: '23:20', stepMinutes: 12 }, SATURDAY: { first: '05:50', last: '22:40', stepMinutes: 20 }, SUNDAY_HOLIDAY: { first: '06:30', last: '21:40', stepMinutes: 30 } },
  '15': { WEEKDAY: { first: '05:55', last: '23:05', stepMinutes: 10 }, SATURDAY: { first: '06:40', last: '22:20', stepMinutes: 16 }, SUNDAY_HOLIDAY: { first: '07:20', last: '21:20', stepMinutes: 28 } },
  '18': { WEEKDAY: { first: '05:25', last: '23:25', stepMinutes: 14 }, SATURDAY: { first: '06:05', last: '22:45', stepMinutes: 22 }, SUNDAY_HOLIDAY: { first: '06:55', last: '21:35', stepMinutes: 34 } },
  '22': { WEEKDAY: { first: '06:00', last: '22:30', stepMinutes: 8 }, SATURDAY: { first: '06:40', last: '21:50', stepMinutes: 14 }, SUNDAY_HOLIDAY: { first: '07:40', last: '20:40', stepMinutes: 22 } },
  '27': { WEEKDAY: { first: '05:35', last: '22:55', stepMinutes: 13 }, SATURDAY: { first: '06:15', last: '22:05', stepMinutes: 21 }, SUNDAY_HOLIDAY: { first: '07:05', last: '21:05', stepMinutes: 33 } },
  '31': { WEEKDAY: { first: '06:10', last: '21:30', stepMinutes: 20 }, SATURDAY: { first: '07:10', last: '20:30', stepMinutes: 30 }, SUNDAY_HOLIDAY: { first: '08:10', last: '19:30', stepMinutes: 45 } },
  'M2': { WEEKDAY: { first: '06:00', last: '22:40', stepMinutes: 9 }, SATURDAY: { first: '06:50', last: '21:50', stepMinutes: 15 }, SUNDAY_HOLIDAY: { first: '07:50', last: '20:50', stepMinutes: 25 } },
  'M5': { WEEKDAY: { first: '05:50', last: '22:30', stepMinutes: 12 }, SATURDAY: { first: '06:40', last: '21:40', stepMinutes: 20 }, SUNDAY_HOLIDAY: { first: '07:40', last: '20:30', stepMinutes: 30 } },
  'M8': { WEEKDAY: { first: '06:05', last: '22:25', stepMinutes: 11 }, SATURDAY: { first: '06:55', last: '21:35', stepMinutes: 17 }, SUNDAY_HOLIDAY: { first: '07:55', last: '20:35', stepMinutes: 29 } },
  'M11': { WEEKDAY: { first: '05:50', last: '22:10', stepMinutes: 15 }, SATURDAY: { first: '06:50', last: '21:10', stepMinutes: 25 }, SUNDAY_HOLIDAY: { first: '07:50', last: '20:10', stepMinutes: 40 } }
};

/** Expands a headway plan into an ascending list of HH:mm strings. */
function expandPlan(plan: HeadwayPlan): string[] {
  const firstMinute = toMinutes(plan.first);
  const lastMinute = toMinutes(plan.last);
  if (firstMinute === null || lastMinute === null || plan.stepMinutes <= 0 || firstMinute > lastMinute) {
    return [];
  }
  const times: string[] = [];
  let cursor = firstMinute;
  while (cursor < lastMinute) {
    times.push(hhmm(Math.floor(cursor / 60), cursor % 60));
    cursor += plan.stepMinutes;
  }
  times.push(plan.last);
  return times;
}

/** Builds the curated Meridian network. Throws on authoring mistakes. */
export function buildCuratedNetwork(): TransitNetwork {
  const stops: Stop[] = STOP_SEEDS.map((seed, index) => ({ id: index + 1, name: seed.name, address: seed.address }));
  const stopIdByName = new Map<string, number>(stops.map(stop => [stop.name, stop.id]));

  const stopId = (name: string): number => {
    const id = stopIdByName.get(name);
    if (id === undefined) {
      throw new Error(`Dataset authoring error: unknown stop name "${name}"`);
    }
    return id;
  };

  const routes: Route[] = [];
  const routeStops: RouteStop[] = [];

  ROUTE_SEEDS.forEach((seed, routeIndex) => {
    const routeId = routeIndex + 1;
    routes.push({
      id: routeId,
      number: seed.number,
      transportType: seed.transportType,
      startStopId: stopId(seed.stops[0]),
      endStopId: stopId(seed.stops[seed.stops.length - 1]),
      active: seed.active ?? true
    });
    seed.stops.forEach((name, sequenceIndex) => {
      routeStops.push({ routeId, stopId: stopId(name), sequence: sequenceIndex + 1 });
    });
  });

  const departures: Departure[] = [];
  let departureId = 0;
  ROUTE_SEEDS.forEach((seed, routeIndex) => {
    const routeId = routeIndex + 1;
    const plans = DEPARTURE_PLANS[seed.number];
    if (!plans) {
      throw new Error(`Dataset authoring error: missing departure plan for route "${seed.number}"`);
    }
    for (const dayType of Object.keys(plans) as DayType[]) {
      for (const time of expandPlan(plans[dayType])) {
        departures.push({ id: ++departureId, routeId, dayType, departureTime: time });
      }
    }
  });

  return freezeDeep({
    routes,
    stops,
    routeStops,
    departures
  }) as TransitNetwork;
}

/**
 * Deterministic synthetic network used for scale verification. `routeCount`
 * routes share a pool of 120 stops and carry full three-day-type timetables,
 * which exercises search, indexing, and next-departure lookups at 500+ scale.
 */
export function buildSyntheticNetwork(routeCount: number): TransitNetwork {
  const POOL_SIZE = 120;
  const STOPS_PER_ROUTE = 8;

  const stops: Stop[] = Array.from({ length: POOL_SIZE }, (_, index) => ({
    id: index + 1,
    name: `Synthetic Stop ${index + 1}`,
    address: `Synthetic Address ${index + 1}`
  }));

  const routes: Route[] = [];
  const routeStops: RouteStop[] = [];

  for (let i = 0; i < routeCount; i++) {
    const routeId = i + 1;
    const startOffset = (i * 7) % POOL_SIZE;
    const sequenceStopIds: number[] = [];
    for (let j = 0; j < STOPS_PER_ROUTE; j++) {
      sequenceStopIds.push(((startOffset + j * 3) % POOL_SIZE) + 1);
    }
    routes.push({
      id: routeId,
      number: `S${routeId}`,
      transportType: i % 4 === 3 ? 'MINIBUS' : 'BUS',
      startStopId: sequenceStopIds[0],
      endStopId: sequenceStopIds[sequenceStopIds.length - 1],
      active: true
    });
    sequenceStopIds.forEach((stopId, index) => {
      routeStops.push({ routeId, stopId, sequence: index + 1 });
    });
  }

  const plans: Record<DayType, HeadwayPlan> = {
    WEEKDAY: { first: '06:00', last: '22:00', stepMinutes: 15 },
    SATURDAY: { first: '07:00', last: '21:00', stepMinutes: 20 },
    SUNDAY_HOLIDAY: { first: '08:00', last: '20:00', stepMinutes: 30 }
  };

  const departures: Departure[] = [];
  let departureId = 0;
  for (let routeId = 1; routeId <= routeCount; routeId++) {
    for (const dayType of Object.keys(plans) as DayType[]) {
      for (const time of expandPlan(plans[dayType])) {
        departures.push({ id: ++departureId, routeId, dayType, departureTime: time });
      }
    }
  }

  return freezeDeep({ routes, stops, routeStops, departures }) as TransitNetwork;
}
