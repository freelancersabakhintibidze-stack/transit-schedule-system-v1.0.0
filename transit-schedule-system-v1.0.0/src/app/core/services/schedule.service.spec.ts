import { TestBed } from '@angular/core/testing';

import { DayType } from '../models/transit.models';
import { SIMULATED_LATENCY_MS } from '../repository/transit-repository';
import { ScheduleService } from './schedule.service';

describe('ScheduleService', () => {
  let service: ScheduleService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: SIMULATED_LATENCY_MS, useValue: 0 }]
    });
    service = TestBed.inject(ScheduleService);
  });

  describe('toMinutes', () => {
    it('converts valid HH:mm strings into minutes from midnight', () => {
      expect(service.toMinutes('00:00')).toBe(0);
      expect(service.toMinutes('08:05')).toBe(485);
      expect(service.toMinutes('23:59')).toBe(1439);
    });

    it('rejects malformed, out of range, and padded times without throwing', () => {
      expect(service.toMinutes('24:00')).toBeNull();
      expect(service.toMinutes('12:60')).toBeNull();
      expect(service.toMinutes('7:05')).toBeNull();
      expect(service.toMinutes('08:5')).toBeNull();
      expect(service.toMinutes('ab:cd')).toBeNull();
      expect(service.toMinutes('')).toBeNull();
      expect(service.toMinutes(' 08:05')).toBeNull();
      expect(service.toMinutes('08:05 ')).toBeNull();
      expect(service.toMinutes('99:99')).toBeNull();
    });
  });

  describe('fromMinutes', () => {
    it('converts minutes from midnight back into HH:mm', () => {
      expect(service.fromMinutes(0)).toBe('00:00');
      expect(service.fromMinutes(485)).toBe('08:05');
      expect(service.fromMinutes(1439)).toBe('23:59');
    });

    it('rejects non integers and out of range values', () => {
      expect(service.fromMinutes(-1)).toBeNull();
      expect(service.fromMinutes(1440)).toBeNull();
      expect(service.fromMinutes(60.5)).toBeNull();
    });

    it('round trips valid minutes', () => {
      for (const minutes of [0, 1, 59, 60, 137, 719, 720, 1439]) {
        const time = service.fromMinutes(minutes);
        expect(time).not.toBeNull();
        expect(service.toMinutes(time as string)).toBe(minutes);
      }
    });
  });

  describe('dayTypeForDate', () => {
    it('maps calendar days onto schedule day types', () => {
      expect(service.dayTypeForDate(new Date(2026, 9, 18))).toBe('SUNDAY_HOLIDAY');
      expect(service.dayTypeForDate(new Date(2026, 9, 17))).toBe('SATURDAY');
      expect(service.dayTypeForDate(new Date(2026, 9, 20))).toBe('WEEKDAY');
    });
  });

  describe('findNextDeparture on route 1 weekday (05:30 to 23:48 every 12 min)', () => {
    const routeId = 1;
    const day: DayType = 'WEEKDAY';

    it('returns the exact departure when the reference time matches a scheduled time', () => {
      const result = service.findNextDeparture(routeId, day, '05:42');
      expect(result.status).toBe('found');
      expect(result.time).toBe('05:42');
      expect(result.minutesUntil).toBe(0);
    });

    it('returns the next departure for a time between two departures', () => {
      const result = service.findNextDeparture(routeId, day, '05:35');
      expect(result.status).toBe('found');
      expect(result.time).toBe('05:42');
      expect(result.minutesUntil).toBe(7);
    });

    it('returns the first departure when the reference time precedes service start', () => {
      const result = service.findNextDeparture(routeId, day, '00:15');
      expect(result.status).toBe('found');
      expect(result.time).toBe('05:30');
      expect(result.minutesUntil).toBe(315);
    });

    it('returns the final departure when the reference time equals it', () => {
      const result = service.findNextDeparture(routeId, day, '23:48');
      expect(result.status).toBe('found');
      expect(result.time).toBe('23:48');
    });

    it('reports end of service after the final departure', () => {
      const result = service.findNextDeparture(routeId, day, '23:49');
      expect(result.status).toBe('after-last');
      expect(result.time).toBeNull();
      expect(result.minutesUntil).toBeNull();
    });

    it('flags invalid reference times without throwing', () => {
      const result = service.findNextDeparture(routeId, day, '99:99');
      expect(result.status).toBe('invalid-time');
    });

    it('reports no service for unknown routes', () => {
      const result = service.findNextDeparture(9999, day, '08:00');
      expect(result.status).toBe('no-service');
    });
  });

  describe('findNextDepartures', () => {
    it('returns up to the requested number of upcoming departures in order', () => {
      const list = service.findNextDepartures(1, 'WEEKDAY', '05:35', 3);
      expect(list.map(departure => departure.departureTime)).toEqual(['05:42', '05:54', '06:06']);
    });

    it('returns fewer entries near the end of service', () => {
      const list = service.findNextDepartures(1, 'WEEKDAY', '23:45', 5);
      expect(list.map(departure => departure.departureTime)).toEqual(['23:48']);
    });

    it('returns an empty list for invalid times or zero count', () => {
      expect(service.findNextDepartures(1, 'WEEKDAY', 'aa:aa', 2)).toEqual([]);
      expect(service.findNextDepartures(1, 'WEEKDAY', '08:00', 0)).toEqual([]);
    });
  });

  describe('departureWindow', () => {
    it('reports first, last, and count for the curated plan', () => {
      const window = service.departureWindow(1, 'WEEKDAY');
      expect(window.first).toBe('05:30');
      expect(window.last).toBe('23:48');
      expect(window.count).toBe(93);
    });

    it('reports an empty window for unknown routes', () => {
      expect(service.departureWindow(9999, 'WEEKDAY')).toEqual({ first: null, last: null, count: 0 });
    });
  });
});
