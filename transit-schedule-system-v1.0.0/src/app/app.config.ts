import { ApplicationConfig, ErrorHandler, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';

import { SIMULATED_LATENCY_MS } from './core/repository/transit-repository';
import { GlobalErrorHandler } from './core/services/global-error-handler';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' })
    ),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    { provide: SIMULATED_LATENCY_MS, useValue: 450 }
  ]
};
