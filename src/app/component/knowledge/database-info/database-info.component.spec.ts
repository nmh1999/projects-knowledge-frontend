import {TestBed} from '@angular/core/testing';
import {DatabaseInfoComponent} from '@component/knowledge/database-info/database-info.component';

describe('Database schema details', () => {
  it('renders old Advanced items without inventing columns or relationships', async () => {
    await TestBed.configureTestingModule({imports: [DatabaseInfoComponent]}).compileComponents();
    const fixture = TestBed.createComponent(DatabaseInfoComponent);
    fixture.componentRef.setInput('items', [
      {table: '', entity: 'Order', repository: 'OrderStore', purpose: 'Stores orders.'},
      {table: '', entity: '', repository: '', purpose: ''}
    ]);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelectorAll('article').length).toBe(2);
    expect(host.querySelector('strong')?.textContent).toBe('Order');
    expect(host.textContent).toContain('OrderStore');
    expect(host.textContent).toContain('Stores orders.');
    expect(host.textContent).toContain(fixture.componentInstance.language.t('databaseUnknownTable'));
    expect(host.querySelector('.table-columns')).toBeNull();
    expect(host.querySelector('.table-relationships')).toBeNull();
  });

  it('keeps long mixed-direction identifiers and untrusted content readable in both themes and languages', async () => {
    await TestBed.configureTestingModule({imports: [DatabaseInfoComponent]}).compileComponents();
    const fixture = TestBed.createComponent(DatabaseInfoComponent);
    const host = fixture.nativeElement as HTMLElement;
    const oldTheme = document.documentElement.getAttribute('data-theme');
    const text = '<img src=x onerror=alert(1)>';
    fixture.componentRef.setInput('items', [
      {
        table: 'schema.' + 'LongTable'.repeat(18),
        entity: 'Order',
        repository: 'OrderStore',
        purpose: 'تخزين الطلبات',
        columns: ['id: bigint, PK', text],
        relationships: ['DDL: orders.customer_id → customers.id (many-to-one)']
      }
    ]);
    try {
      for (const theme of ['light', 'dark']) {
        document.documentElement.setAttribute('data-theme', theme);
        for (const locale of ['en', 'ar'] as const) {
          fixture.componentInstance.language.current.set(locale);
          host.dir = locale === 'ar' ? 'rtl' : 'ltr';
          fixture.detectChanges();
          for (const width of [960, 320]) {
            host.style.width = `${width}px`;
            expect(host.scrollWidth).toBeLessThanOrEqual(host.clientWidth + 1);
          }
          expect(host.querySelector('.table-columns h4')?.textContent).toBe(
            fixture.componentInstance.language.t('databaseColumns')
          );
          expect(host.querySelector('.table-relationships h4')?.textContent).toBe(
            fixture.componentInstance.language.t('databaseRelationships')
          );
          expect(host.querySelectorAll('.table-columns li').length).toBe(2);
          expect(host.textContent).toContain(text);
          expect(host.querySelector('img')).toBeNull();
          expect(host.querySelector('strong bdi')?.getAttribute('dir')).toBe('auto');
        }
      }
    } finally {
      if (oldTheme === null) document.documentElement.removeAttribute('data-theme');
      else document.documentElement.setAttribute('data-theme', oldTheme);
    }
  });
});
