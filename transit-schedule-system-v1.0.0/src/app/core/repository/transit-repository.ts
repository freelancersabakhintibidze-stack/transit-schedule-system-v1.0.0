/**
 * Repository: the single source of truth for the transit network.
 *
 * The repository wraps the static dataset behind an observable that emits
 * after a simulated network latency, exactly where a real HTTP call to a
 * schedule API would sit. Services convert that stream into signals, so
 * components stay synchronous and reactive after the initial load.
 *
 * The dataset source and the latency are injectable: tests provide zero
 * latency and can swap in the synthetic 500-route network, and the value
 * can be tuned in `app.config.ts` without touching business code.
 */

import { Injectable, InjectionToken, Signal, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, map, of, shareReplay, timer } from 'rxjs';

import { buildCuratedNetwork } from '../data/transit-dataset';
import { TransitNetwork } from '../models/transit.models';
import { sanitizeNetwork } from '../validation/network-validation';

/** Simulated backend latency in milliseconds (0 disables it). */
export const SIMULATED_LATENCY_MS = new InjectionToken<number>('SIMULATED_LATENCY_MS', {
  factory: () => 450
});

/** Produces the raw dataset. Swap to `buildSyntheticNetwork` for scale runs. */
export const DATASET_SOURCE = new InjectionToken<() => TransitNetwork>('DATASET_SOURCE', {
  factory: () => buildCuratedNetwork
});

@Injectable({ providedIn: 'root' })
export class TransitRepository {
  private readonly source = inject(DATASET_SOURCE);
  private readonly latencyMs = inject(SIMULATED_LATENCY_MS);
  private readonly networkSignal: Signal<TransitNetwork | null>;

  constructor() {
    // A zero latency configuration emits synchronously, which makes the
    // system deterministic in tests and lets deployments disable the
    // loading state entirely. Positive values emulate a real backend.
    const stream: Observable<TransitNetwork> = (this.latencyMs > 0 ? timer(this.latencyMs) : of(0)).pipe(
      map(() => {
        const { network, report } = sanitizeNetwork(this.source());
        if (report.problems.length > 0) {
          console.warn(
            `[TransitRepository] Dataset integrity issues repaired by sanitization (${report.problems.length}):`,
            report.problems
          );
        }
        return network;
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    );
    this.networkSignal = toSignal(stream, { initialValue: null });
  }

  /** Signals based view of the network; null until the dataset has loaded. */
  get network(): Signal<TransitNetwork | null> {
    return this.networkSignal;
  }

  /** Synchronous snapshot accessor; null until the dataset has loaded. */
  get snapshot(): TransitNetwork | null {
    return this.networkSignal();
  }
}
