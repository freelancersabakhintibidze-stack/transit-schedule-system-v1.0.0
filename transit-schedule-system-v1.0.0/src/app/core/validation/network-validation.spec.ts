import { buildCuratedNetwork, buildSyntheticNetwork } from '../data/transit-dataset';
import { TransitNetwork } from '../models/transit.models';
import { sanitizeNetwork, validateNetwork } from './network-validation';

describe('network validation and sanitization', () => {
  it('validates the curated dataset without problems', () => {
    const report = validateNetwork(buildCuratedNetwork());
    expect(report.valid).toBeTrue();
    expect(report.problems).toEqual([]);
  });

  it('validates the synthetic dataset without problems', () => {
    const report = validateNetwork(buildSyntheticNetwork(120));
    expect(report.valid).toBeTrue();
    expect(report.problems).toEqual([]);
  });

  it('detects malformed times, orphan route stops, sequence gaps, and unknown termini', () => {
    const network: TransitNetwork = {
      stops: [
        { id: 1, name: 'A', address: 'a' },
        { id: 2, name: 'B', address: 'b' },
        { id: 3, name: 'C', address: 'c' }
      ],
      routes: [{ id: 1, number: 'X1', transportType: 'BUS', startStopId: 1, endStopId: 3, active: true }],
      routeStops: [
        { routeId: 1, stopId: 1, sequence: 1 },
        { routeId: 1, stopId: 2, sequence: 3 }
      ],
      departures: [{ id: 1, routeId: 1, dayType: 'WEEKDAY', departureTime: '7:00' }]
    };
    const report = validateNetwork(network);
    expect(report.valid).toBeFalse();
    const joined = report.problems.join(' ');
    expect(joined).toContain('time');
    expect(joined).toContain('sequence');
    expect(joined).toContain('terminus');
  });

  it('drops corrupt records instead of crashing', () => {
    const base = buildCuratedNetwork();
    const corrupted: TransitNetwork = {
      stops: [{ id: 1, name: 'Central Station', address: 'Station Square 1' }, ...base.stops],
      routes: [...base.routes, { id: 1, number: '1-DUP', transportType: 'BUS', startStopId: 1, endStopId: 2, active: true }],
      routeStops: [...base.routeStops, { routeId: 9999, stopId: 1, sequence: 1 }],
      departures: [
        ...base.departures,
        { id: 1, routeId: 1, dayType: 'WEEKDAY', departureTime: '99:99' },
        { id: 999999, routeId: 424242, dayType: 'WEEKDAY', departureTime: '08:00' }
      ]
    };
    const { network, report } = sanitizeNetwork(corrupted);
    expect(network.stops.filter(stop => stop.id === 1).length).toBe(1);
    expect(network.routes.filter(route => route.id === 1).length).toBe(1);
    expect(network.routeStops.some(routeStop => routeStop.routeId === 9999)).toBeFalse();
    expect(network.departures.some(departure => departure.departureTime === '99:99')).toBeFalse();
    expect(network.departures.some(departure => departure.routeId === 424242)).toBeFalse();
    expect(report.problems.length).toBeGreaterThan(0);
    expect(report.valid).toBeFalse();
  });

  it('returns frozen, immutable collections', () => {
    const { network } = sanitizeNetwork(buildCuratedNetwork());
    expect(Object.isFrozen(network)).toBeTrue();
    expect(Object.isFrozen(network.routes)).toBeTrue();
    expect(Object.isFrozen(network.routes[0])).toBeTrue();
    expect(Object.isFrozen(network.stops)).toBeTrue();
    expect(Object.isFrozen(network.routeStops)).toBeTrue();
    expect(Object.isFrozen(network.departures)).toBeTrue();
  });

  it('preserves every healthy record of the curated dataset', () => {
    const raw = buildCuratedNetwork();
    const { network } = sanitizeNetwork(raw);
    expect(network.routes.length).toBe(raw.routes.length);
    expect(network.stops.length).toBe(raw.stops.length);
    expect(network.routeStops.length).toBe(raw.routeStops.length);
    expect(network.departures.length).toBe(raw.departures.length);
  });
});
