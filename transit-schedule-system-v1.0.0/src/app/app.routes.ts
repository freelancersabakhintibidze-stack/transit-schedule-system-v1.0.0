import { Routes } from '@angular/router';

import { RouteDetailsComponent } from './features/route-details/route-details.component';
import { RouteListComponent } from './features/route-list/route-list.component';
import { StopDetailsComponent } from './features/stops/stop-details.component';
import { StopIndexComponent } from './features/stops/stop-index.component';
import { AboutComponent } from './features/info/about.component';
import { LegalPageComponent } from './features/info/legal-page.component';
import { NotFoundComponent } from './features/not-found/not-found.component';

export const routes: Routes = [
  { path: '', component: RouteListComponent, title: 'Timetables | Meridian Transit' },
  { path: 'routes/:routeId', component: RouteDetailsComponent, title: 'Route | Meridian Transit' },
  { path: 'stops', component: StopIndexComponent, title: 'Stops | Meridian Transit' },
  { path: 'stops/:stopId', component: StopDetailsComponent, title: 'Stop | Meridian Transit' },
  { path: 'about', component: AboutComponent, title: 'About | Meridian Transit' },
  { path: 'legal/terms', component: LegalPageComponent, data: { legalKey: 'terms' }, title: 'Terms of Use | Meridian Transit' },
  { path: 'legal/privacy', component: LegalPageComponent, data: { legalKey: 'privacy' }, title: 'Privacy Policy | Meridian Transit' },
  { path: '**', component: NotFoundComponent, title: 'Not Found | Meridian Transit' }
];
