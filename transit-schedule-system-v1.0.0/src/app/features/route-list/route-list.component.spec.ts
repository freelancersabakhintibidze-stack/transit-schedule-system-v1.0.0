import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { SIMULATED_LATENCY_MS } from '../../core/repository/transit-repository';
import { RouteListComponent } from './route-list.component';

describe('RouteListComponent', () => {
  let fixture: ComponentFixture<RouteListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: SIMULATED_LATENCY_MS, useValue: 0 }]
    });
    fixture = TestBed.createComponent(RouteListComponent);
  });

  function rows(el: HTMLElement): NodeListOf<Element> {
    return el.querySelectorAll('.route-row');
  }

  it('renders all active route rows after the synchronous load', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(rows(el).length).toBe(14);
    expect(el.querySelector('.route-list__meta')?.textContent).toContain('14 of 14 routes');
  });

  it('shows the empty state for unmatched searches and restores rows on reset', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    const input = el.querySelector<HTMLInputElement>('#route-search');
    expect(input).not.toBeNull();
    input!.value = 'zzz-no-match';
    input!.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const emptyState = el.querySelector('pt-empty-state');
    expect(emptyState).withContext('empty state should render for unmatched search').not.toBeNull();
    expect(el.querySelector('.empty-state__title')?.textContent).toContain('No routes match your search');

    const resetButton = el.querySelector<HTMLButtonElement>('.empty-state button');
    expect(resetButton).not.toBeNull();
    resetButton!.click();
    fixture.detectChanges();

    expect(rows(el).length).toBe(14);
  });

  it('narrows the list when the minibus transport filter is active', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    const buttons = Array.from(el.querySelectorAll<HTMLButtonElement>('.segmented button'));
    const minibusButton = buttons.find(button => button.textContent?.trim() === 'Minibus');
    expect(minibusButton).toBeDefined();
    minibusButton!.click();
    fixture.detectChanges();

    expect(rows(el).length).toBe(4);
  });

  it('offers stop suggestions when the search matches a stop name', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    const input = el.querySelector<HTMLInputElement>('#route-search');
    input!.value = 'lakeshore';
    input!.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const suggestions = el.querySelectorAll('.stop-suggestions a');
    expect(suggestions.length).toBe(1);
    expect(suggestions[0].textContent).toContain('Lakeshore');
  });
});
