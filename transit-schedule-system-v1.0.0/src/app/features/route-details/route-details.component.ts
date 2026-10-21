import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { numberAttribute } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { ClockService } from '../../core/services/clock.service';
import { RouteService } from '../../core/services/route.service';
import { ScheduleService } from '../../core/services/schedule.service';
import {
  DAY_TYPES,
  DAY_TYPE_LABELS,
  DayType,
  Departure,
  TRANSPORT_TYPE_LABELS,
  TransportType
} from '../../core/models/transit.models';
import { dayTypeAttribute, timeAttribute } from '../../core/models/transit-coercion';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { IconComponent } from '../../shared/icons/icon.component';

/**
 * Screen B: route detail view with the stop sequence timeline, the
 * grouped departure matrix, and the next departure engine.
 *
 * The reference time defaults to the live device clock (recomputing as
 * the clock advances) and becomes fixed as soon as the user picks a
 * time or arrives with a `time` query parameter.
 */
@Component({
  selector: 'pt-route-details',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconComponent, EmptyStateComponent],
  templateUrl: './route-details.component.html'
})
export class RouteDetailsComponent {
  private readonly routeService = inject(RouteService);
  readonly scheduleService = inject(ScheduleService);
  private readonly clock = inject(ClockService);
  private readonly router = inject(Router);
  private readonly titleService = inject(Title);

  /** Route id from the URL segment. */
  readonly routeId = input.required<number, unknown>({ transform: numberAttribute });
  /** Optional day type carried over from another screen. */
  readonly day = input<DayType | undefined>(undefined, { transform: dayTypeAttribute });
  /** Optional reference time carried over from another screen. */
  readonly time = input<string | undefined>(undefined, { transform: timeAttribute });

  private readonly todayDayType = this.scheduleService.dayTypeForDate(new Date());
  private readonly localDay = signal<DayType | null>(null);
  private readonly localTime = signal<string | null>(null);

  readonly dayOptions: readonly DayType[] = DAY_TYPES;

  readonly dayType = computed<DayType>(() => this.day() ?? this.localDay() ?? this.todayDayType);

  readonly selectedTime = computed<string>(() => this.time() ?? this.localTime() ?? this.clock.time());

  readonly loading = this.routeService.loading;

  readonly route = computed(() => this.routeService.getRouteById(this.routeId()));

  readonly routeView = computed(() => {
    const route = this.route();
    if (!route) {
      return null;
    }
    const origin = this.routeService.getStopById(route.startStopId);
    const destination = this.routeService.getStopById(route.endStopId);
    if (!origin || !destination) {
      return null;
    }
    return { route, origin, destination };
  });

  readonly stops = computed<readonly { id: number; name: string; address: string }[]>(() => {
    const route = this.route();
    return route ? this.routeService.getStopsForRoute(route.id) : [];
  });

  readonly departures = computed<readonly Departure[]>(() => {
    const route = this.route();
    return route ? this.scheduleService.sortedDepartures(route.id, this.dayType()) : [];
  });

  readonly nextResult = computed(() => {
    const route = this.route();
    return route ? this.scheduleService.findNextDeparture(route.id, this.dayType(), this.selectedTime()) : null;
  });

  readonly following = computed<readonly Departure[]>(() => {
    const route = this.route();
    return route ? this.scheduleService.findNextDepartures(route.id, this.dayType(), this.selectedTime(), 3) : [];
  });

  readonly nextIndex = computed<number | null>(() => {
    const next = this.nextResult();
    return next !== null && next.status === 'found' ? next.index : null;
  });

  readonly selectedMinutes = computed<number | null>(() => this.scheduleService.toMinutes(this.selectedTime()));

  constructor() {
    effect(() => {
      const view = this.routeView();
      this.titleService.setTitle(
        view ? `Route ${view.route.number} | Meridian Transit` : 'Route | Meridian Transit'
      );
    });
  }

  setDayType(day: DayType): void {
    this.localDay.set(day);
  }

  onTimeInput(value: string): void {
    this.localTime.set(value);
  }

  useCurrentTime(): void {
    this.localTime.set(this.clock.time());
  }

  goHome(): void {
    void this.router.navigate(['/']);
  }

  timeMinutes(departure: Departure): number | null {
    return this.scheduleService.toMinutes(departure.departureTime);
  }

  /** True when the departure is before the selected reference time. */
  isPast(departure: Departure): boolean {
    const selected = this.selectedMinutes();
    if (selected === null) {
      return false;
    }
    const minutes = this.timeMinutes(departure);
    return minutes !== null && minutes < selected;
  }

  dayLabel(day: DayType): string {
    return DAY_TYPE_LABELS[day];
  }

  typeLabel(type: TransportType): string {
    return TRANSPORT_TYPE_LABELS[type];
  }

  thenList(): string {
    return this.following()
      .slice(1)
      .map(departure => departure.departureTime)
      .join(' · ');
  }
}
