import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import { LEGAL_DOCUMENTS, LegalDocument, LegalKey } from './legal-content';

function isLegalKey(value: unknown): value is LegalKey {
  return value === 'terms' || value === 'privacy';
}

/**
 * Shared renderer for the Terms of Use and Privacy Policy pages. The
 * route data key selects the document; the component fails safe to the
 * terms document when the key is unknown. The document is a signal so
 * navigating between the two legal routes updates the page in place.
 */
@Component({
  selector: 'pt-legal-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './legal-page.component.html'
})
export class LegalPageComponent {
  private readonly titleService = inject(Title);

  readonly document = toSignal(
    inject(ActivatedRoute).data.pipe(
      map(data => (isLegalKey(data['legalKey']) ? LEGAL_DOCUMENTS[data['legalKey']] : LEGAL_DOCUMENTS['terms']))
    ),
    { initialValue: LEGAL_DOCUMENTS['terms'] }
  );

  constructor() {
    effect(() => this.titleService.setTitle(`${this.document().title} | Meridian Transit`));
  }
}
