/**
 * Dataset integrity validation and sanitization.
 *
 * `validateNetwork` inspects a dataset and reports every problem it finds.
 * `sanitizeNetwork` goes one step further and repairs the dataset by
 * dropping corrupt records (duplicate ids, orphaned joins, malformed
 * times) so the application can keep running on the healthy subset.
 * This is the resilience net that guarantees missing ids or corrupted
 * time strings never crash the application lifecycle.
 */

import { TransitNetwork } from '../models/transit.models';

const TIME_PATTERN = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

export interface ValidationReport {
  /** True when no problems were found. */
  readonly valid: boolean;
  /** Human readable list of every problem detected. */
  readonly problems: readonly string[];
}

export interface SanitizeResult {
  /** Repaired, deep frozen network containing only healthy records. */
  readonly network: TransitNetwork;
  /** What was wrong and what was dropped. */
  readonly report: ValidationReport;
}

/** Reports every integrity problem in a network without modifying it. */
export function validateNetwork(network: TransitNetwork): ValidationReport {
  const problems: string[] = [];

  const seenStopIds = new Set<number>();
  for (const stop of network.stops) {
    if (seenStopIds.has(stop.id)) {
      problems.push(`Duplicate stop id ${stop.id}.`);
    }
    seenStopIds.add(stop.id);
  }

  const seenRouteIds = new Set<number>();
  for (const route of network.routes) {
    if (seenRouteIds.has(route.id)) {
      problems.push(`Duplicate route id ${route.id}.`);
    }
    seenRouteIds.add(route.id);
  }

  const seenDepartureIds = new Set<number>();
  for (const departure of network.departures) {
    if (seenDepartureIds.has(departure.id)) {
      problems.push(`Duplicate departure id ${departure.id}.`);
    }
    seenDepartureIds.add(departure.id);
  }

  const seenPairs = new Set<string>();
  for (const routeStop of network.routeStops) {
    const pair = `${routeStop.routeId}:${routeStop.stopId}`;
    if (seenPairs.has(pair)) {
      problems.push(`Duplicate route stop pair ${pair}.`);
    }
    seenPairs.add(pair);

    if (!seenRouteIds.has(routeStop.routeId)) {
      problems.push(`Route stop references unknown route ${routeStop.routeId}.`);
    }
    if (!seenStopIds.has(routeStop.stopId)) {
      problems.push(`Route stop references unknown stop ${routeStop.stopId}.`);
    }
  }

  for (const departure of network.departures) {
    if (!seenRouteIds.has(departure.routeId)) {
      problems.push(`Departure ${departure.id} references unknown route ${departure.routeId}.`);
    }
    if (!TIME_PATTERN.test(departure.departureTime)) {
      problems.push(`Departure ${departure.id} has malformed departure time "${departure.departureTime}".`);
    }
  }

  for (const route of network.routes) {
    const sequences = network.routeStops
      .filter(rs => rs.routeId === route.id)
      .map(rs => rs.sequence)
      .sort((a, b) => a - b);
    const expected = sequences.map((_, index) => index + 1);
    const contiguous = sequences.every((value, index) => value === expected[index]);
    if (!contiguous) {
      problems.push(`Route ${route.id} has non contiguous stop sequences.`);
    }
    if (!sequences.length || !sequences.includes(1) || route.startStopId === undefined) {
      problems.push(`Route ${route.id} has no stop sequence.`);
    }
    const routeStopIds = new Set(
      network.routeStops.filter(rs => rs.routeId === route.id).map(rs => rs.stopId)
    );
    if (!routeStopIds.has(route.startStopId) || !routeStopIds.has(route.endStopId)) {
      problems.push(`Route ${route.id} terminus is not part of its stop sequence.`);
    }
  }

  return { valid: problems.length === 0, problems };
}

/** Deep freezes a network graph. */
function freezeNetwork(network: TransitNetwork): TransitNetwork {
  Object.freeze(network.routes);
  network.routes.forEach(route => Object.freeze(route));
  Object.freeze(network.stops);
  network.stops.forEach(stop => Object.freeze(stop));
  Object.freeze(network.routeStops);
  network.routeStops.forEach(routeStop => Object.freeze(routeStop));
  Object.freeze(network.departures);
  network.departures.forEach(departure => Object.freeze(departure));
  return Object.freeze(network);
}

/**
 * Repairs a network by dropping corrupt records, then freezing the
 * result. Healthy data always survives: duplicates keep their first
 * occurrence, orphaned joins and malformed times are removed.
 */
export function sanitizeNetwork(raw: TransitNetwork): SanitizeResult {
  const problems: string[] = [];

  const stops = new Map<number, TransitNetwork['stops'][number]>();
  for (const stop of raw.stops) {
    if (stops.has(stop.id)) {
      problems.push(`Dropped duplicate stop id ${stop.id}.`);
      continue;
    }
    stops.set(stop.id, stop);
  }

  const routes = new Map<number, TransitNetwork['routes'][number]>();
  for (const route of raw.routes) {
    if (routes.has(route.id)) {
      problems.push(`Dropped duplicate route id ${route.id}.`);
      continue;
    }
    routes.set(route.id, route);
  }

  const routeStops: TransitNetwork['routeStops'][number][] = [];
  const seenPairs = new Set<string>();
  for (const routeStop of raw.routeStops) {
    const pair = `${routeStop.routeId}:${routeStop.stopId}`;
    if (seenPairs.has(pair)) {
      problems.push(`Dropped duplicate route stop pair ${pair}.`);
      continue;
    }
    if (!routes.has(routeStop.routeId)) {
      problems.push(`Dropped route stop referencing unknown route ${routeStop.routeId}.`);
      continue;
    }
    if (!stops.has(routeStop.stopId)) {
      problems.push(`Dropped route stop referencing unknown stop ${routeStop.stopId}.`);
      continue;
    }
    seenPairs.add(pair);
    routeStops.push(routeStop);
  }

  const departures: TransitNetwork['departures'][number][] = [];
  const seenDepartureIds = new Set<number>();
  for (const departure of raw.departures) {
    if (seenDepartureIds.has(departure.id)) {
      problems.push(`Dropped duplicate departure id ${departure.id}.`);
      continue;
    }
    if (!routes.has(departure.routeId)) {
      problems.push(`Dropped departure ${departure.id} referencing unknown route ${departure.routeId}.`);
      continue;
    }
    if (!TIME_PATTERN.test(departure.departureTime)) {
      problems.push(`Dropped departure ${departure.id} with malformed time "${departure.departureTime}".`);
      continue;
    }
    seenDepartureIds.add(departure.id);
    departures.push(departure);
  }

  const network = freezeNetwork({ routes: [...routes.values()], stops: [...stops.values()], routeStops, departures });
  return { network, report: { valid: problems.length === 0, problems } };
}
