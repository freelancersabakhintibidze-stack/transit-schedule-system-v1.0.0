/**
 * ClockService: a reactive device clock.
 *
 * Components use it for the header clock and as the default reference
 * time of the next departure engine. The interval is cleaned up through
 * DestroyRef, so the service never leaks a timer.
 */

import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';

const WEEKDAY_LABELS: readonly string[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTH_LABELS: readonly string[] = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

@Injectable({ providedIn: 'root' })
export class ClockService {
  private readonly nowSignal = signal<Date>(new Date());

  /** Current device time as a signal, refreshed every 15 seconds. */
  readonly now = this.nowSignal.asReadonly();

  /** HH:mm string of the current time. */
  readonly time = computed(() => {
    const now = this.nowSignal();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });

  /** Compact uppercase date label, e.g. "TUE 20 OCT 2026". */
  readonly dateLabel = computed(() => {
    const now = this.nowSignal();
    return `${WEEKDAY_LABELS[now.getDay()]} ${now.getDate()} ${MONTH_LABELS[now.getMonth()]} ${now.getFullYear()}`;
  });

  constructor() {
    const intervalId = setInterval(() => this.nowSignal.set(new Date()), 15_000);
    inject(DestroyRef).onDestroy(() => clearInterval(intervalId));
  }
}
