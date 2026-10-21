/**
 * RouteService: querying, filtering, and cross entity indexing.
 *
 * On first access after the dataset load, the service builds immutable
 * lookup indexes (route id to ordered stops, stop id to serving routes),
 * which keeps every query O(1) to O(n) over the visible result set.
 * Search is case insensitive and matches route numbers plus origin and
 * destination termini, as specified. Inactive routes are excluded from
 * search results and summaries but remain reachable by direct id.
 */

import { Injectable, Signal, computed, inject } from '@angular/core';

import {
  DayType,
  Departure,
  Route,
  RouteStop,
  RouteSummary,
  Stop,
  TransportFilter,
  TransportType,
  TransitNetwork
} from '../models/transit.models';
import { ScheduleService } from './schedule.service';
import { TransitRepository } from '../repository/transit-repository';

interface NetworkIndex {
  readonly routesById: Map<number, Route>;
  readonly stopsById: Map<number, Stop>;
  readonly stopsByRoute: Map<number, RouteStop[]>;
  readonly routesByStop: Map<number, RouteStop[]>;
}

@Injectable({ providedIn: 'root' })
export class RouteService {
  private readonly repository = inject(TransitRepository);
  private readonly scheduleService = inject(ScheduleService);

  /** Signals based network view; null while the dataset is loading. */
  readonly network: Signal<TransitNetwork | null> = this.repository.network;

  /** True until the dataset has arrived. */
  readonly loading = computed(() => this.network() === null);

  private index: NetworkIndex | null = null;

  /** All routes, including inactive ones. */
  routes(): readonly Route[] {
    return this.network()?.routes ?? [];
  }

  /** All stops in the network. */
  stops(): readonly Stop[] {
    return this.network()?.stops ?? [];
  }

  getRouteById(id: number): Route | undefined {
    return this.ensureIndex()?.routesById.get(id);
  }

  getStopById(id: number): Stop | undefined {
    return this.ensureIndex()?.stopsById.get(id);
  }

  /** Stops of a route in strict sequence order. */
  getStopsForRoute(routeId: number): readonly Stop[] {
    const index = this.ensureIndex();
    if (!index) {
      return [];
    }
    const routeStops = index.stopsByRoute.get(routeId) ?? [];
    return routeStops
      .map(routeStop => index.stopsById.get(routeStop.stopId))
      .filter((stop): stop is Stop => stop !== undefined);
  }

  /** Number of stops on a route (0 when unknown). */
  getRouteStopCount(routeId: number): number {
    return this.ensureIndex()?.stopsByRoute.get(routeId)?.length ?? 0;
  }

  /** Active routes serving a stop, sorted naturally by route number. */
  getRoutesForStop(stopId: number): readonly Route[] {
    const index = this.ensureIndex();
    if (!index) {
      return [];
    }
    const routeStops = index.routesByStop.get(stopId) ?? [];
    return routeStops
      .map(routeStop => index.routesById.get(routeStop.routeId))
      .filter((route): route is Route => route !== undefined && route.active)
      .sort((a, b) => naturalCompareRouteNumbers(a, b));
  }

  /** Number of active routes serving a stop (0 when unknown). */
  getRouteCountForStop(stopId: number): number {
    return this.getRoutesForStop(stopId).length;
  }

  /**
   * Case insensitive search over active routes. A route matches when its
   * number, origin, or destination contains the term as a substring.
   */
  searchRoutes(term: string, transport: TransportFilter): readonly Route[] {
    const query = term.trim().toLowerCase();
    return this.routes().filter(
      route => route.active && this.matchesTransport(route.transportType, transport) && this.matchesSearch(route, query)
    );
  }

  /** Shared matcher used by search and by the filtered summary list. */
  matchesSearch(route: Route, rawTerm: string): boolean {
    const query = rawTerm.trim().toLowerCase();
    if (query === '') {
      return true;
    }
    const index = this.ensureIndex();
    if (!index) {
      return false;
    }
    if (route.number.toLowerCase().includes(query)) {
      return true;
    }
    const origin = index.stopsById.get(route.startStopId);
    const destination = index.stopsById.get(route.endStopId);
    return (
      (origin !== undefined && origin.name.toLowerCase().includes(query)) ||
      (destination !== undefined && destination.name.toLowerCase().includes(query))
    );
  }

  /** Finds stops whose name contains the term, up to `limit` results. */
  findStopsByName(term: string, limit = 3): readonly Stop[] {
    const query = term.trim().toLowerCase();
    if (query.length === 0) {
      return [];
    }
    return this.stops()
      .filter(stop => stop.name.toLowerCase().includes(query))
      .slice(0, limit);
  }

  /**
   * Summaries for every active route on a day type, naturally sorted.
   * Routes whose termini cannot be resolved (corrupt data) are skipped
   * with a console warning instead of surfacing broken rows.
   */
  getRouteSummaries(dayType: DayType): readonly RouteSummary[] {
    const summaries: RouteSummary[] = [];
    for (const route of this.routes()) {
      if (!route.active) {
        continue;
      }
      const summary = this.buildSummary(route, dayType);
      if (summary) {
        summaries.push(summary);
      }
    }
    return summaries.sort((a, b) => naturalCompareRouteNumbers(a.route, b.route));
  }

  /** Summary for one route and day type, or undefined when unavailable. */
  getRouteSummary(routeId: number, dayType: DayType): RouteSummary | undefined {
    const route = this.getRouteById(routeId);
    if (!route || !route.active) {
      return undefined;
    }
    return this.buildSummary(route, dayType);
  }

  private buildSummary(route: Route, dayType: DayType): RouteSummary | undefined {
    const index = this.ensureIndex();
    if (!index) {
      return undefined;
    }
    const origin = index.stopsById.get(route.startStopId);
    const destination = index.stopsById.get(route.endStopId);
    if (!origin || !destination) {
      console.warn(`[RouteService] Route ${route.id} has unresolved termini; excluded from summaries.`);
      return undefined;
    }
    const window = this.scheduleService.departureWindow(route.id, dayType);
    return {
      route,
      origin,
      destination,
      firstDeparture: window.first,
      lastDeparture: window.last,
      departureCount: window.count,
      stopCount: this.getRouteStopCount(route.id)
    };
  }

  private matchesTransport(type: TransportType, filter: TransportFilter): boolean {
    return filter === 'ALL' || filter === type;
  }

  /** Builds lookup indexes once per loaded network snapshot. */
  private ensureIndex(): NetworkIndex | null {
    const network = this.network();
    if (!network) {
      return null;
    }
    if (this.index) {
      return this.index;
    }

    const routesById = new Map<number, Route>();
    for (const route of network.routes) {
      routesById.set(route.id, route);
    }

    const stopsById = new Map<number, Stop>();
    for (const stop of network.stops) {
      stopsById.set(stop.id, stop);
    }

    const stopsByRoute = new Map<number, RouteStop[]>();
    const routesByStop = new Map<number, RouteStop[]>();
    for (const routeStop of network.routeStops) {
      const forRoute = stopsByRoute.get(routeStop.routeId) ?? [];
      forRoute.push(routeStop);
      stopsByRoute.set(routeStop.routeId, forRoute);

      const forStop = routesByStop.get(routeStop.stopId) ?? [];
      forStop.push(routeStop);
      routesByStop.set(routeStop.stopId, forStop);
    }
    for (const list of stopsByRoute.values()) {
      list.sort((a, b) => a.sequence - b.sequence);
    }
    for (const list of routesByStop.values()) {
      list.sort((a, b) => {
        const routeA = routesById.get(a.routeId);
        const routeB = routesById.get(b.routeId);
        if (!routeA || !routeB) {
          return 0;
        }
        return naturalCompareRouteNumbers(routeA, routeB);
      });
    }

    this.index = { routesById, stopsById, stopsByRoute, routesByStop };
    return this.index;
  }
}

/** Numeric aware comparison: 3 before 12, minibuses after numeric routes. */
export function naturalCompareRouteNumbers(a: Route, b: Route): number {
  return a.number.localeCompare(b.number, undefined, { numeric: true, sensitivity: 'base' });
}

/** Convenience re-export to keep import lists short in components. */
export type { Departure };
