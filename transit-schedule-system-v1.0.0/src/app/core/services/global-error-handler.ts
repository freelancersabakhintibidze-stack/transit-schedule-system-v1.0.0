/**
 * Global error boundary.
 *
 * Any unhandled error is logged once and surfaced as a dismissible
 * system banner. The application never dies: schedule data already on
 * screen keeps working, and navigation remains available.
 */

import { ErrorHandler, Injectable, inject } from '@angular/core';

import { SystemAlertService } from './system-alert.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly alerts = inject(SystemAlertService);

  handleError(error: unknown): void {
    console.error('[TransitSystem] Unhandled application error:', error);
    if (this.alerts.alert() === null) {
      this.alerts.raise(
        'A system fault occurred and some information may be unavailable. You can continue browsing or reload the page.'
      );
    }
  }
}
