import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { RouteService } from '../../core/services/route.service';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { IconComponent } from '../../shared/icons/icon.component';

/**
 * Stop directory: every stop in the network, searchable, with the count
 * of active routes serving it. Acts as the entry point for stop-centric
 * querying (Screen C).
 */
@Component({
  selector: 'pt-stop-index',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconComponent, EmptyStateComponent],
  templateUrl: './stop-index.component.html'
})
export class StopIndexComponent {
  private readonly routeService = inject(RouteService);

  readonly loading = this.routeService.loading;
  readonly searchTerm = signal('');

  /** Total number of stops in the network, used by the result counter. */
  readonly stopsSize = computed(() => this.routeService.stops().length);

  readonly stops = computed(() => {
    if (this.loading()) {
      return null;
    }
    const query = this.searchTerm().trim().toLowerCase();
    return this.routeService
      .stops()
      .filter(stop => query === '' || stop.name.toLowerCase().includes(query) || stop.address.toLowerCase().includes(query))
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
      .map(stop => ({ stop, routeCount: this.routeService.getRouteCountForStop(stop.id) }));
  });

  onSearchInput(value: string): void {
    this.searchTerm.set(value);
  }
}
