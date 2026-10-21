import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { SystemAlertService } from '../../core/services/system-alert.service';
import { IconComponent } from '../../shared/icons/icon.component';

/**
 * Non blocking system fault banner. Rendered by the application shell;
 * the global error handler raises the message, users can dismiss it.
 */
@Component({
  selector: 'pt-error-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    @if (alerts.alert(); as alert) {
      <div class="system-alert" role="alert">
        <pt-icon name="alert" [size]="16" />
        <p>{{ alert.message }}</p>
        <button type="button" aria-label="Dismiss notice" (click)="alerts.clear()">
          <pt-icon name="close" [size]="14" />
        </button>
      </div>
    }
  `
})
export class ErrorBannerComponent {
  readonly alerts = inject(SystemAlertService);
}
