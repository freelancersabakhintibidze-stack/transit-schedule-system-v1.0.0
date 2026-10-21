/**
 * SystemAlertService: a tiny signal store for global system notices.
 *
 * The global error handler raises a non blocking banner here instead of
 * letting unexpected failures break the application shell. Users can
 * dismiss the notice and keep browsing.
 */

import { Injectable, signal } from '@angular/core';

export interface SystemAlert {
  readonly message: string;
}

@Injectable({ providedIn: 'root' })
export class SystemAlertService {
  private readonly alertSignal = signal<SystemAlert | null>(null);

  /** Current system alert, or null when everything is nominal. */
  readonly alert = this.alertSignal.asReadonly();

  raise(message: string): void {
    this.alertSignal.set({ message });
  }

  clear(): void {
    this.alertSignal.set(null);
  }
}
