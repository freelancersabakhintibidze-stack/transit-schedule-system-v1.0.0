import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { EmptyStateComponent } from '../../shared/components/empty-state.component';

@Component({
  selector: 'pt-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyStateComponent],
  template: `
    <section class="page">
      <pt-empty-state code="404" title="Page not found" actionLabel="Back to timetables" (action)="goHome()">
        <p>The page you requested does not exist in this system. Routes and stops live under their own addresses.</p>
      </pt-empty-state>
    </section>
  `
})
export class NotFoundComponent {
  private readonly router = inject(Router);

  goHome(): void {
    void this.router.navigate(['/']);
  }
}
