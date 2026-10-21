import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { numberAttribute } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { DAY_TYPES, DAY_TYPE_LABELS, DayType, Departure, StopRouteDeparture, TransportType } from '../../core/models/transit.models';
import { dayTypeAttribute, timeAttribute } from '../../core/models/transit-coercion';
import { ClockService } from '../../core/services/clock.service';
import { RouteService } from '../../core/services/route.service';
import { ScheduleService } from '../../core/services/schedule.service';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { IconComponent } from '../../shared/icons/icon.component';

/**
 * Screen C: stop detail view. Aggregates every active route serving the
 * stop and computes the next two departures per route against the
 * selected day type and reference time. Day and time carry over from
 * the route screen through `day` and `time` query parameters.
 */
@Component({
  selector: 'pt-stop-details',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconComponent, EmptyStateComponent],
  templateUrl: './stop-details.component.html'
})
export class StopDetailsComponent {
  private readonly routeService = inject(RouteService);
  private readonly scheduleService = inject(ScheduleService);
  private readonly clock = inject(ClockService);
  private readonly router = inject(Router);
  private readonly titleService = inject(Title);

  /** Stop id from the URL segment. */
  readonly stopId = input.required<number, unknown>({ transform: numberAttribute });
  readonly day = input<DayType | undefined>(undefined, { transform: dayTypeAttribute });
  readonly time = input<string | undefined>(undefined, { transform: timeAttribute });

  private readonly todayDayType = this.scheduleService.dayTypeForDate(new Date());
  private readonly localDay = signal<DayType | null>(null);
  private readonly localTime = signal<string | null>(null);

  readonly dayOptions: readonly DayType[] = DAY_TYPES;

  readonly dayType = computed<DayType>(() => this.day() ?? this.localDay() ?? this.todayDayType);

  readonly selectedTime = computed<string>(() => this.time() ?? this.localTime() ?? this.clock.time());

  readonly loading = this.routeService.loading;

  readonly stop = computed(() => this.routeService.getStopById(this.stopId()));

  readonly board = computed<readonly StopRouteDeparture[]>(() => {
    const stop = this.stop();
    if (!stop) {
      return [];
    }
    const day = this.dayType();
    const time = this.selectedTime();
    return this.routeService.getRoutesForStop(stop.id).map(route => ({
      route,
      towards: this.routeService.getStopById(route.endStopId) ?? null,
      upcoming: this.scheduleService.findNextDepartures(route.id, day, time, 2)
    }));
  });

  constructor() {
    effect(() => {
      const stop = this.stop();
      this.titleService.setTitle(stop ? `${stop.name} | Meridian Transit` : 'Stop | Meridian Transit');
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

  goStops(): void {
    void this.router.navigate(['/stops']);
  }

  firstUpcoming(entry: StopRouteDeparture): Departure | null {
    return entry.upcoming.length > 0 ? entry.upcoming[0] : null;
  }

  secondUpcoming(entry: StopRouteDeparture): Departure | null {
    return entry.upcoming.length > 1 ? entry.upcoming[1] : null;
  }

  dayLabel(day: DayType): string {
    return DAY_TYPE_LABELS[day];
  }

  typeLabel(type: TransportType): string {
    return type === 'MINIBUS' ? 'Minibus' : 'Bus';
  }
}
