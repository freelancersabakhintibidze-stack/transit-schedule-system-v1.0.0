import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { ClockService } from './core/services/clock.service';
import { ErrorBannerComponent } from './features/system/error-banner.component';

@Component({
  selector: 'pt-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ErrorBannerComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {
  readonly clock = inject(ClockService);
}
