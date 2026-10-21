import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * About: an editorial page documenting what the system is, how planned
 * timetables differ from live tracking, how the data is organized, and
 * the deliberate engineering and design constraints of this release.
 */
@Component({
  selector: 'pt-about',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './about.component.html'
})
export class AboutComponent {}
