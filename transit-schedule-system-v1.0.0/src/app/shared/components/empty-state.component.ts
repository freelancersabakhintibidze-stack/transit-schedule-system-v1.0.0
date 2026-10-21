/**
 * Empty state panel used by list screens, detail screens, and the
 * not-found route. Straight typographic treatment: code, title, body
 * slot, and an optional single action.
 */

import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'pt-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="empty-state">
      <p class="empty-state__code">{{ code() }}</p>
      <h2 class="empty-state__title">{{ title() }}</h2>
      <div class="empty-state__body"><ng-content /></div>
      @if (actionLabel(); as label) {
        <button type="button" class="btn btn--solid" (click)="action.emit()">{{ label }}</button>
      }
    </section>
  `
})
export class EmptyStateComponent {
  /** Short uppercase marker, e.g. "No results" or "404". */
  readonly code = input.required<string>();
  /** Panel headline. */
  readonly title = input.required<string>();
  /** Optional action button label; no button when null. */
  readonly actionLabel = input<string | null>(null);
  /** Emits when the action button is pressed. */
  readonly action = output<void>();
}
