/**
 * ScheduleService: time utilities and the next departure engine.
 *
 * All comparisons operate on minutes from midnight, never on raw HH:mm
 * strings. The next departure lookup performs a binary search over the
 * sorted departure list of the requested route and day type, so it stays
 * O(log n) even on very large timetables.
 *
 * The service is defensive by design: unknown routes, empty day types,
 * and malformed time strings produce typed result states instead of
 * exceptions, satisfying the resilience requirements of the spec.
 */

import { Injectable, inject } from '@angular/core';

import { DayType, Departure } from '../models/transit.models';
import { DepartureTimePattern } from '../models/transit-coercion';
import { TransitRepository } from '../repository/transit-repository';

/** Outcome states of the next departure calculation. */
export type NextDepartureStatus = 'found' | 'after-last' | 'invalid-time' | 'no-service';

export interface NextDepartureResult {
  readonly status: NextDepartureStatus;
  /** HH:mm of the upcoming departure, when one exists. */
  readonly time: string | null;
  /** Minutes between the reference time and the departure. */
  readonly minutesUntil: number | null;
  /** Index of the departure inside the sorted day timetable. */
  readonly index: number | null;
}

export interface DepartureWindow {
  readonly first: string | null;
  readonly last: string | null;
  readonly count: number;
}

interface TimedDeparture {
  readonly departure: Departure;
  readonly minutes: number;
}

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private readonly repository = inject(TransitRepository);
  private readonly cache = new Map<string, readonly Departure[]>();

  /** Converts an HH:mm string into minutes from midnight, or null. */
  toMinutes(time: string): number | null {
    if (typeof time !== 'string' || !DepartureTimePattern.test(time)) {
      return null;
    }
    const hours = Number(time.slice(0, 2));
    const minutes = Number(time.slice(3, 5));
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
      return null;
    }
    return hours * 60 + minutes;
  }

  /** Converts minutes from midnight back into HH:mm, or null out of range. */
  fromMinutes(totalMinutes: number): string | null {
    if (!Number.isInteger(totalMinutes) || totalMinutes < 0 || totalMinutes > 1439) {
      return null;
    }
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  /** Maps a calendar date onto the schedule day type it belongs to. */
  dayTypeForDate(date: Date): DayType {
    const day = date.getDay();
    if (day === 0) {
      return 'SUNDAY_HOLIDAY';
    }
    if (day === 6) {
      return 'SATURDAY';
    }
    return 'WEEKDAY';
  }

  /**
   * Sorted, integrity checked departures for one route and day type.
   * Returns an empty array for unknown routes and before the dataset
   * has loaded; results are cached because the network is immutable.
   */
  sortedDepartures(routeId: number, dayType: DayType): readonly Departure[] {
    const network = this.repository.snapshot;
    if (!network) {
      return [];
    }
    const key = `${routeId}:${dayType}`;
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }
    const timed: TimedDeparture[] = [];
    for (const departure of network.departures) {
      if (departure.routeId !== routeId || departure.dayType !== dayType) {
        continue;
      }
      const minutes = this.toMinutes(departure.departureTime);
      if (minutes !== null) {
        timed.push({ departure, minutes });
      }
    }
    timed.sort((a, b) => a.minutes - b.minutes);
    const result: readonly Departure[] = Object.freeze(timed.map(entry => entry.departure));
    this.cache.set(key, result);
    return result;
  }

  /**
   * Finds the first departure at or after the reference time using a
   * binary search over the sorted timetable.
   */
  findNextDeparture(routeId: number, dayType: DayType, selectedTime: string): NextDepartureResult {
    const target = this.toMinutes(selectedTime);
    if (target === null) {
      return { status: 'invalid-time', time: null, minutesUntil: null, index: null };
    }
    const departures = this.sortedDepartures(routeId, dayType);
    if (departures.length === 0) {
      return { status: 'no-service', time: null, minutesUntil: null, index: null };
    }

    let low = 0;
    let high = departures.length - 1;
    let found = -1;
    while (low <= high) {
      const mid = (low + high) >> 1;
      const midMinutes = this.toMinutes(departures[mid].departureTime) as number;
      if (midMinutes >= target) {
        found = mid;
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }

    if (found === -1) {
      return { status: 'after-last', time: null, minutesUntil: null, index: null };
    }
    const match = departures[found];
    const matchMinutes = this.toMinutes(match.departureTime) as number;
    return {
      status: 'found',
      time: match.departureTime,
      minutesUntil: matchMinutes - target,
      index: found
    };
  }

  /** Returns up to `count` upcoming departures in ascending order. */
  findNextDepartures(routeId: number, dayType: DayType, selectedTime: string, count: number): readonly Departure[] {
    const target = this.toMinutes(selectedTime);
    if (target === null || count <= 0) {
      return [];
    }
    const departures = this.sortedDepartures(routeId, dayType);
    const upcoming: Departure[] = [];
    for (const departure of departures) {
      const minutes = this.toMinutes(departure.departureTime);
      if (minutes !== null && minutes >= target) {
        upcoming.push(departure);
        if (upcoming.length >= count) {
          break;
        }
      }
    }
    return upcoming;
  }

  /** First departure, last departure, and count for a route and day type. */
  departureWindow(routeId: number, dayType: DayType): DepartureWindow {
    const departures = this.sortedDepartures(routeId, dayType);
    if (departures.length === 0) {
      return { first: null, last: null, count: 0 };
    }
    return {
      first: departures[0].departureTime,
      last: departures[departures.length - 1].departureTime,
      count: departures.length
    };
  }
}
