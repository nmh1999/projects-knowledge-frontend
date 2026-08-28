import { TestBed } from '@angular/core/testing';
import { ProjectOverviewComponent } from './project-overview.component';
import { LanguageService } from '../../../core/services/language.service';
import { Project } from '../../../core/models/project.model';

describe('Dynamic project overview', () => {
  for (const language of ['en', 'ar'] as const) {
    it(`filters integrations locally and resets only when the project changes in ${language}`, async () => {
      await TestBed.configureTestingModule({ imports: [ProjectOverviewComponent] }).compileComponents();
      const fixture = TestBed.createComponent(ProjectOverviewComponent);
      const labels = TestBed.inject(LanguageService);
      labels.current.set(language);
      const project: Project = { id: 'search', name: 'Search', repositories: [], overview: {
        frontend: [], backend: [], databases: [], domains: [], integrations: ['Orbit Billing', 'Atlas Maps', 'بوابة الرسائل'], messaging: [], scheduledJobs: []
      } };
      fixture.componentRef.setInput('project', project);
      fixture.detectChanges();
      const host = fixture.nativeElement as HTMLElement;
      const input = host.querySelector<HTMLInputElement>('input[type="search"]')!;
      const search = (query: string) => {
        input.value = query;
        input.dispatchEvent(new Event('input'));
        fixture.detectChanges();
      };
      const selected = spyOn(fixture.componentInstance.integrationSelected, 'emit');
      expect(host.querySelectorAll('.integration-link').length).toBe(3);
      expect(input.getAttribute('aria-label')).toBe(labels.t('searchIntegrations'));
      search('  ORBIT  ');
      expect(host.querySelectorAll('.integration-link').length).toBe(1);
      expect(host.querySelector('.integration-count')?.textContent?.trim()).toBe('1 / 3');
      expect(selected).not.toHaveBeenCalled();
      host.querySelector<HTMLButtonElement>('.integration-link')!.click();
      expect(selected).toHaveBeenCalledOnceWith('Orbit Billing');
      search('الرسائل');
      expect(host.querySelector('.integration-name')?.textContent).toBe('بوابة الرسائل');
      search('missing');
      expect(host.querySelector('.integration-grid')).toBeNull();
      expect(host.querySelector('.integration-empty')?.textContent).toBe(labels.t('noMatchingIntegrations'));
      expect(host.textContent).not.toContain(labels.t('noIntegrationsFound'));
      host.querySelector<HTMLButtonElement>('.integration-search button')!.click();
      fixture.detectChanges();
      expect(input.value).toBe('');
      expect(host.querySelectorAll('.integration-link').length).toBe(3);
      search('Atlas');
      fixture.componentRef.setInput('project', { ...project, overviewUpdatedAt: '2026-08-27T10:00:00Z' });
      fixture.detectChanges();
      expect(input.value).toBe('Atlas');
      fixture.componentRef.setInput('project', { ...project, id: 'another-project' });
      fixture.detectChanges();
      expect(input.value).toBe('');
      expect(host.querySelectorAll('.integration-link').length).toBe(3);
    });

    it(`wraps integrations into equally sized cards without overflowing in ${language}`, async () => {
      await TestBed.configureTestingModule({ imports: [ProjectOverviewComponent] }).compileComponents();
      const fixture = TestBed.createComponent(ProjectOverviewComponent);
      TestBed.inject(LanguageService).current.set(language);
      fixture.componentRef.setInput('project', { id: 'cards', name: 'Cards', repositories: [], overview: {
        frontend: [], backend: [], databases: [], domains: [], integrations: ['Orbit', 'An integration with a much longer service name', 'X'.repeat(120), 'بوابة الرسائل'], messaging: [], scheduledJobs: []
      } });
      fixture.detectChanges();
      const host = fixture.nativeElement as HTMLElement;
      host.dir = language === 'ar' ? 'rtl' : 'ltr';
      const grid = host.querySelector<HTMLElement>('.integration-grid')!;
      for (const width of [960, 260]) {
        grid.style.width = `${width}px`;
        const cards = Array.from(grid.querySelectorAll<HTMLElement>('.integration-link'));
        const bounds = cards.map(card => card.getBoundingClientRect());
        expect(bounds[0].height).toBeGreaterThanOrEqual(72);
        for (const rect of bounds) {
          expect(Math.abs(rect.height - bounds[0].height)).toBeLessThan(1);
          expect(Math.abs(rect.width - bounds[0].width)).toBeLessThan(1);
        }
        expect(cards.every(card => card.scrollHeight <= card.clientHeight + 1)).toBeTrue();
        expect(cards.every(card => card.scrollWidth <= card.clientWidth + 1)).toBeTrue();
        expect(grid.scrollWidth).toBeLessThanOrEqual(grid.clientWidth + 1);
        if (width === 960) expect(bounds[1].top).toBe(bounds[0].top);
        else expect(bounds[1].top).toBeGreaterThan(bounds[0].bottom);
      }
    });

    it(`shows the server update time and disables refresh while updating in ${language}`, async () => {
      await TestBed.configureTestingModule({ imports: [ProjectOverviewComponent] }).compileComponents();
      const fixture = TestBed.createComponent(ProjectOverviewComponent);
      const labels = TestBed.inject(LanguageService);
      labels.current.set(language);
      const snapshot: Project = { id: 'date', name: 'Date', repositories: [], overviewUpdatedAt: '2026-01-01T10:30:00Z', overview: {
        frontend: [], backend: [], databases: [], domains: [], integrations: [], messaging: [], scheduledJobs: []
      } };
      fixture.componentRef.setInput('project', snapshot);
      fixture.detectChanges();
      const host = fixture.nativeElement as HTMLElement;
      const expected = new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : 'en-GB', {
        calendar: 'gregory', dateStyle: 'medium', timeStyle: 'short'
      }).format(new Date(snapshot.overviewUpdatedAt!));
      expect(host.querySelector('time')?.textContent).toBe(expected);
      expect(host.querySelector('time')?.getAttribute('datetime')).toBe('2026-01-01T10:30:00.000Z');
      const emit = spyOn(fixture.componentInstance.refreshRequested, 'emit');
      const button = host.querySelector<HTMLButtonElement>('.refresh-overview')!;
      button.click();
      expect(emit).toHaveBeenCalledTimes(1);
      fixture.componentRef.setInput('refreshing', true);
      fixture.detectChanges();
      expect(button.disabled).toBeTrue();
      expect(button.textContent).toContain(labels.t('refreshingOverview'));
      button.click();
      expect(emit).toHaveBeenCalledTimes(1);
      for (const value of [null, 'invalid-date']) {
        fixture.componentRef.setInput('project', { ...snapshot, overviewUpdatedAt: value });
        fixture.detectChanges();
        expect(host.querySelector('time')).toBeNull();
        expect(host.textContent).toContain(labels.t('overviewDateUnavailable'));
      }
    });

    it(`keeps technology cards equally sized without clipping content in ${language}`, async () => {
      await TestBed.configureTestingModule({ imports: [ProjectOverviewComponent] }).compileComponents();
      const fixture = TestBed.createComponent(ProjectOverviewComponent);
      TestBed.inject(LanguageService).current.set(language);
      const backend = Array.from({ length: 11 }, (_, index) => `Technology with a long name ${index + 1}`);
      fixture.componentRef.setInput('project', { id: 'sizing', name: 'Sizing', repositories: [], overview: {
        frontend: ['Angular', 'TypeScript'], backend, databases: ['PostgreSQL'], domains: [], integrations: [], messaging: [], scheduledJobs: []
      } });
      fixture.detectChanges();
      const host = fixture.nativeElement as HTMLElement;
      host.dir = language === 'ar' ? 'rtl' : 'ltr';
      const grid = host.querySelector<HTMLElement>('.tech-grid')!;
      // Exercise a three-column desktop row even when the test runner viewport is narrow.
      grid.style.width = '960px';
      grid.style.gridTemplateColumns = 'repeat(3, minmax(0, 1fr))';
      const cards = Array.from(grid.querySelectorAll<HTMLElement>('.tech-card'));
      const bounds = cards.map(card => card.getBoundingClientRect());
      expect(bounds[0].height).toBeGreaterThan(100);
      for (const rect of bounds) {
        expect(Math.abs(rect.height - bounds[0].height)).toBeLessThan(1);
        expect(Math.abs(rect.width - bounds[0].width)).toBeLessThan(1);
      }
      expect(cards.every(card => card.scrollHeight <= card.clientHeight + 1)).toBeTrue();
      expect(cards[1].querySelectorAll('.tech-chip').length).toBe(backend.length);
    });

    it(`shows code-based integrations, cache duration and integration selection in ${language}`, async () => {
      await TestBed.configureTestingModule({ imports: [ProjectOverviewComponent] }).compileComponents();
      const fixture = TestBed.createComponent(ProjectOverviewComponent);
      const labels = TestBed.inject(LanguageService);
      labels.current.set(language);
      const project: Project = { id: 'dynamic', name: 'Runtime project', repositories: [], overview: {
        frontend: [], backend: [], databases: [], domains: ['Inventory'], integrations: ['Orbit'], messaging: [], scheduledJobs: []
      } };
      fixture.componentRef.setInput('project', project);
      fixture.detectChanges();
      const host = fixture.nativeElement as HTMLElement;
      expect(host.textContent).toContain(labels.t('detectedModules'));
      expect(host.textContent).toContain(labels.t('repositoryIntegrations'));
      expect(host.textContent).toContain(labels.t('overviewLastUpdated'));
      expect(host.textContent).toContain(labels.t('integrationDiscoveryNote'));
      const selected = spyOn(fixture.componentInstance.integrationSelected, 'emit');
      host.querySelector<HTMLButtonElement>('.integration-link')!.click();
      expect(selected).toHaveBeenCalledWith('Orbit');
      fixture.componentRef.setInput('project', { ...project, overview: { ...project.overview, domains: [], integrations: [] } });
      fixture.detectChanges();
      expect(host.querySelector('.integration-link')).toBeNull();
      expect(host.querySelector('.domain-block')).toBeNull();
      expect(host.textContent).toContain(labels.t('noIntegrationsFound'));
    });

    it(`renders each technology as a complete non-interactive chip in ${language}`, async () => {
      await TestBed.configureTestingModule({ imports: [ProjectOverviewComponent] }).compileComponents();
      const fixture = TestBed.createComponent(ProjectOverviewComponent);
      const labels = TestBed.inject(LanguageService);
      labels.current.set(language);
      const technologies = ['Apache POI', 'Java 21', 'Spring Boot 4', 'Spring Data JPA / Hibernate', 'Spring Security and JWT'];
      fixture.componentRef.setInput('project', { id: 'stack', name: 'Stack', repositories: [], overview: {
        frontend: ['Angular'], backend: technologies, databases: ['PostgreSQL'], domains: [], integrations: [], messaging: [], scheduledJobs: []
      } });
      fixture.detectChanges();
      const host = fixture.nativeElement as HTMLElement;
      const backend = host.querySelector<HTMLElement>('[data-category="backend"]')!;
      expect(host.querySelectorAll('.tech-card').length).toBe(3);
      expect(backend.querySelector('h3')?.textContent).toBe(labels.t('backend'));
      expect(Array.from(backend.querySelectorAll('.tech-chip'), chip => chip.textContent)).toEqual(technologies);
      expect(backend.querySelectorAll('bdi[dir="auto"]').length).toBe(technologies.length);
      expect(backend.querySelector('.tech-count')?.getAttribute('aria-label')).toBe(`5 ${labels.t('technologies')}`);
      expect(backend.querySelector('button')).toBeNull();
      fixture.componentRef.setInput('project', { id: 'empty', name: 'Empty', repositories: [], overview: {
        frontend: [], backend: [], databases: [], domains: [], integrations: [], messaging: [], scheduledJobs: []
      } });
      fixture.detectChanges();
      expect(host.querySelectorAll('.tech-card').length).toBe(0);
    });
  }
});
