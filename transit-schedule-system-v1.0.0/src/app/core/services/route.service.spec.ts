import { TestBed } from '@angular/core/testing';

import { buildSyntheticNetwork } from '../data/transit-dataset';
import { DATASET_SOURCE, SIMULATED_LATENCY_MS } from '../repository/transit-repository';
import { RouteService } from './route.service';
import { ScheduleService } from './schedule.service';

describe('RouteService (curated dataset)', () => {
  let service: RouteService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: SIMULATED_LATENCY_MS, useValue: 0 }]
    });
    service = TestBed.inject(RouteService);
  });

  it('exposes the network synchronously when latency is zero', () => {
    expect(service.loading()).toBeFalse();
    expect(service.routes().length).toBe(15);
    expect(service.stops().length).toBe(36);
  });

  it('excludes inactive routes from search results and summaries', () => {
    const summaries = service.getRouteSummaries('WEEKDAY');
    expect(summaries.find(summary => summary.route.number === '31')).toBeUndefined();
    expect(service.searchRoutes('31', 'ALL')).toEqual([]);
  });

  it('sorts route summaries naturally: numeric routes first, then minibuses', () => {
    const numbers = service.getRouteSummaries('WEEKDAY').map(summary => summary.route.number);
    expect(numbers).toEqual(['1', '3', '4', '7', '9', '12', '15', '18', '22', '27', 'M2', 'M5', 'M8', 'M11']);
  });

  it('matches route numbers case insensitively', () => {
    expect(service.searchRoutes('m2', 'ALL').map(route => route.number)).toEqual(['M2']);
    expect(service.searchRoutes('M2', 'ALL').length).toBe(1);
  });

  it('matches origin and destination termini case insensitively', () => {
    const hits = service.searchRoutes('central station', 'ALL').map(route => route.number);
    expect(hits).toEqual(['1', '4', '9', '15', '22', 'M2']);
  });

  it('applies the transport type filter', () => {
    const buses = service.searchRoutes('', 'BUS');
    const minibuses = service.searchRoutes('', 'MINIBUS');
    expect(buses.length).toBe(10);
    expect(minibuses.length).toBe(4);
    expect(minibuses.every(route => route.transportType === 'MINIBUS')).toBeTrue();
  });

  it('returns ordered stops for a route', () => {
    const stops = service.getStopsForRoute(1);
    expect(stops.length).toBe(8);
    expect(stops[0].name).toBe('Central Station');
    expect(stops[stops.length - 1].name).toBe('Airport Terminal');
  });

  it('maps stops back to the active routes serving them', () => {
    const serving = service.getRoutesForStop(1).map(route => route.number);
    expect(serving).toEqual(['1', '4', '9', '12', '15', '22', 'M2']);
  });

  it('counts serving routes without loading full lists', () => {
    expect(service.getRouteCountForStop(1)).toBe(7);
    expect(service.getRouteCountForStop(9999)).toBe(0);
  });

  it('finds stops by fuzzy, case insensitive name', () => {
    expect(service.findStopsByName('lakeshore', 5).map(stop => stop.name)).toEqual(['Lakeshore']);
    expect(service.findStopsByName('LAKES', 5).length).toBe(1);
  });

  it('computes summaries with departure windows for the selected day type', () => {
    const weekday = service.getRouteSummary(1, 'WEEKDAY');
    expect(weekday).toBeDefined();
    expect(weekday?.firstDeparture).toBe('05:30');
    expect(weekday?.lastDeparture).toBe('23:48');
    expect(weekday?.stopCount).toBe(8);
    expect(weekday?.departureCount).toBe(93);

    const sunday = service.getRouteSummary(1, 'SUNDAY_HOLIDAY');
    expect(sunday?.firstDeparture).toBe('06:30');
    expect(sunday?.departureCount).toBe(33);
  });

  it('returns undefined and empty collections for unknown records', () => {
    expect(service.getRouteById(9999)).toBeUndefined();
    expect(service.getStopById(9999)).toBeUndefined();
    expect(service.getStopsForRoute(9999)).toEqual([]);
    expect(service.getRouteSummary(9999, 'WEEKDAY')).toBeUndefined();
    expect(service.getRoutesForStop(9999)).toEqual([]);
  });
});

describe('RouteService (synthetic 500 route network)', () => {
  let service: RouteService;
  let schedule: ScheduleService;

  beforeEach(() => {
    const network = buildSyntheticNetwork(500);
    TestBed.configureTestingModule({
      providers: [
        { provide: SIMULATED_LATENCY_MS, useValue: 0 },
        { provide: DATASET_SOURCE, useValue: () => network }
      ]
    });
    service = TestBed.inject(RouteService);
    schedule = TestBed.inject(ScheduleService);
  });

  it('loads and indexes 500 routes with 8 stop sequences each', () => {
    expect(service.routes().length).toBe(500);
    expect(service.getStopsForRoute(250).length).toBe(8);
  });

  it('filters correctly across the full scale', () => {
    expect(service.searchRoutes('S250', 'ALL').map(route => route.number)).toEqual(['S250']);
    expect(service.searchRoutes('s', 'ALL').length).toBe(500);
    expect(service.searchRoutes('', 'MINIBUS').length).toBe(125);
    expect(service.searchRoutes('', 'BUS').length).toBe(375);
  });

  it('computes next departures on the synthetic network', () => {
    const result = schedule.findNextDeparture(250, 'WEEKDAY', '12:07');
    expect(result.status).toBe('found');
    expect(result.time).toBe('12:15');
  });
});
