import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DAY_TYPES, DAY_TYPE_LABELS, DayType, RouteSummary, TRANSPORT_TYPE_LABELS, TRANSPORT_TYPES, TransportFilter, TransportType } from '../../core/models/transit.models';
import { RouteService } from '../../core/services/route.service';
import { ScheduleService } from '../../core/services/schedule.service';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { IconComponent } from '../../shared/icons/icon.component';

interface FilterOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

@Component({
  selector: 'pt-route-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconComponent, EmptyStateComponent],
  templateUrl: './route-list.component.html'
})
export class RouteListComponent {
  private readonly routeService = inject(RouteService);
  private readonly scheduleService = inject(ScheduleService);

  /** Day type of "today", resolved once per page view. */
  private readonly todayDayType = this.scheduleService.dayTypeForDate(new Date());

  readonly networkLoading = this.routeService.loading;
  readonly skeletonRows: readonly number[] = [0, 1, 2, 3, 4, 5, 6];

  readonly searchTerm = signal('');
  readonly transportFilter = signal<TransportFilter>('ALL');
  readonly dayType = signal<DayType>(this.todayDayType);

  readonly transportOptions: readonly FilterOption<TransportFilter>[] = [
    { value: 'ALL', label: 'All' },
    { value: 'BUS', label: 'Bus' },
    { value: 'MINIBUS', label: 'Minibus' }
  ];

  readonly dayOptions: readonly FilterOption<DayType>[] = DAY_TYPES.map(day => ({
    value: day,
    label: DAY_TYPE_LABELS[day]
  }));

  /** Summaries for every active route on the selected day type. */
  readonly summaries = computed<readonly RouteSummary[] | null>(() => {
    if (this.networkLoading()) {
      return null;
    }
    return this.routeService.getRouteSummaries(this.dayType());
  });

  /** Summaries narrowed by the current search term and transport filter. */
  readonly filteredSummaries = computed<readonly RouteSummary[] | null>(() => {
    const all = this.summaries();
    if (!all) {
      return null;
    }
    const filter = this.transportFilter();
    const term = this.searchTerm();
    return all.filter(
      summary =>
        (filter === 'ALL' || summary.route.transportType === filter) &&
        this.routeService.matchesSearch(summary.route, term)
    );
  });

  /** Stops whose name matches the search, offered as direct links. */
  readonly stopSuggestions = computed<readonly { id: number; name: string }[]>(() => {
    const term = this.searchTerm().trim();
    if (term.length < 2) {
      return [];
    }
    return this.routeService.findStopsByName(term, 3);
  });

  onSearchInput(value: string): void {
    this.searchTerm.set(value);
  }

  setTransport(value: TransportFilter): void {
    this.transportFilter.set(value);
  }

  setDayType(value: DayType): void {
    this.dayType.set(value);
  }

  resetFilters(): void {
    this.searchTerm.set('');
    this.transportFilter.set('ALL');
    this.dayType.set(this.todayDayType);
  }

  dayLabel(day: DayType): string {
    return DAY_TYPE_LABELS[day];
  }

  typeLabel(type: TransportType): string {
    return TRANSPORT_TYPE_LABELS[type];
  }

  transportIcon(type: TransportType): 'bus' | 'minibus' {
    return type === 'MINIBUS' ? 'minibus' : 'bus';
  }
}
