/**
 * Minimal geometric icon set, drawn specifically for this system.
 *
 * The icons are inline SVG paths on a 24 unit grid with square caps,
 * matching the Swiss editorial design language. No icon font and no
 * third party icon library is used; every glyph is intentional,
 * stroke based, and inherits `currentColor`.
 */

import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type IconName =
  | 'bus'
  | 'minibus'
  | 'clock'
  | 'search'
  | 'arrow-right'
  | 'arrow-up-right'
  | 'pin'
  | 'alert'
  | 'calendar'
  | 'close'
  | 'reset';

@Component({
  selector: 'pt-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="square"
      aria-hidden="true"
      focusable="false"
    >
      @switch (name()) {
        @case ('bus') {
          <rect x="4" y="3" width="16" height="14" />
          <path d="M4 9h16" />
          <path d="M12 9v4" />
          <circle cx="7.5" cy="20" r="1.5" />
          <circle cx="16.5" cy="20" r="1.5" />
        }
        @case ('minibus') {
          <path d="M3.5 6H14l4.5 4h2v6h-17z" />
          <path d="M3.5 10H14" />
          <circle cx="7" cy="19.5" r="1.5" />
          <circle cx="16" cy="19.5" r="1.5" />
        }
        @case ('clock') {
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7v5l3.5 2" />
        }
        @case ('search') {
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="M15.5 15.5 21 21" />
        }
        @case ('arrow-right') {
          <path d="M3.5 12h16" />
          <path d="m13 5.5 6.5 6.5-6.5 6.5" />
        }
        @case ('arrow-up-right') {
          <path d="M6 18 18 6" />
          <path d="M9.5 6H18v8.5" />
        }
        @case ('pin') {
          <path d="M12 21c-4-3.8-6.5-7-6.5-10a6.5 6.5 0 0 1 13 0c0 3-2.5 6.2-6.5 10z" />
          <circle cx="12" cy="10.7" r="2.2" />
        }
        @case ('alert') {
          <path d="M12 3.5 21.5 20h-19z" />
          <path d="M12 9.5V14" />
          <path d="M12 16.8v.4" />
        }
        @case ('calendar') {
          <rect x="3.5" y="5" width="17" height="15.5" />
          <path d="M3.5 10h17" />
          <path d="M8 3v4" />
          <path d="M16 3v4" />
        }
        @case ('close') {
          <path d="m6 6 12 12" />
          <path d="M18 6 6 18" />
        }
        @case ('reset') {
          <path d="M8.5 4.5 4 9l4.5 4.5" />
          <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H10" />
        }
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex-shrink: 0;
      line-height: 0;
    }
  `
})
export class IconComponent {
  readonly name = input.required<IconName>();
  readonly size = input<number>(16);
}
