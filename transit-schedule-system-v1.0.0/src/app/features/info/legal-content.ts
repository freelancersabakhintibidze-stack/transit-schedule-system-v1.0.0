/**
 * Legal content for the Terms of Use and Privacy Policy pages.
 *
 * The text describes this demonstration system exactly as it is: a
 * static mock dataset, no data collection, no tracking. Nothing here
 * invents a company, jurisdiction, or contact that does not exist.
 */

export type LegalKey = 'terms' | 'privacy';

export interface LegalSection {
  readonly heading: string;
  readonly paragraphs: readonly string[];
  readonly bullets?: readonly string[];
}

export interface LegalDocument {
  readonly title: string;
  readonly updated: string;
  readonly intro: string;
  readonly sections: readonly LegalSection[];
}

export const LEGAL_DOCUMENTS: Record<LegalKey, LegalDocument> = {
  terms: {
    title: 'Terms of Use',
    updated: 'Version 1.0.0',
    intro:
      'These terms govern your use of the Meridian Transit schedule information system. By using the application you accept them.',
    sections: [
      {
        heading: 'Nature of the system',
        paragraphs: [
          'This is a demonstration application built on a static mock dataset. The Meridian network, its routes, stops, addresses, and every departure time are fictional sample data created for engineering and design evaluation. Nothing shown here represents a real operator, agency, or timetable.',
          'The application is provided as working software for review. It publishes planned timetables only. It does not track vehicles, does not predict arrivals, and makes no claim that any service operates at the times listed.'
        ]
      },
      {
        heading: 'No warranty',
        paragraphs: [
          'The application is provided "as is" without warranty of any kind, express or implied. The authors make no claim about accuracy, availability, or fitness for any particular purpose, and accept no liability for decisions made on the basis of the information displayed.',
          'Do not use this system for real journey planning. For real-world travel always consult the official operator or transport authority of the network you intend to use.'
        ]
      },
      {
        heading: 'Licence of the code',
        paragraphs: [
          'The source code of this application is released under the MIT licence, reproduced in the LICENCE file that ships with the repository. You may study, modify, and reuse the code under that licence.'
        ]
      },
      {
        heading: 'Acceptable use',
        paragraphs: [
          'The application performs all computation in your browser and exposes no administrative interface. You agree not to attempt to alter the dataset presented to other users or to misrepresent the application as an official product of any transport operator.'
        ]
      }
    ]
  },
  privacy: {
    title: 'Privacy Policy',
    updated: 'Version 1.0.0',
    intro:
      'This application is designed to need no personal data. This policy states precisely what happens, and does not happen, to information when you use it.',
    sections: [
      {
        heading: 'Data we do not collect',
        paragraphs: ['The application collects, stores, and transmits no personal information. Specifically:'],
        bullets: [
          'No accounts, sign-in, or contact details are requested.',
          'No analytics, telemetry, or error reporting service is integrated.',
          'No advertising identifiers or third party trackers are embedded.',
          'No cookies or browser storage keys are written by the application.'
        ]
      },
      {
        heading: 'What stays on your device',
        paragraphs: [
          'Your search terms, selected day type, and reference time exist only in the memory of your browser session and disappear when you close or reload the page. Nothing you enter is sent anywhere.'
        ]
      },
      {
        heading: 'Third party requests',
        paragraphs: [
          'The application makes one category of external request: typefaces (Archivo, IBM Plex Sans, and IBM Plex Mono) are loaded from Google Fonts. During that request, Google receives your IP address and standard request metadata under its own policies. No schedule data, search term, or application state is included in those requests.',
          'If you require a fully offline deployment, the font links in src/index.html can be replaced with self-hosted font files, and the application will function identically without any external request.'
        ]
      },
      {
        heading: 'Changes',
        paragraphs: [
          'If a future release introduces telemetry, accounts, or any other data processing, this policy will be updated and versioned before that release ships.'
        ]
      }
    ]
  }
};
