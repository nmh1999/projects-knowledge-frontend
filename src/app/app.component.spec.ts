import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {AppComponent} from './app.component';
import {appConfig} from './app.config';
import {LanguageService} from '@shared/service/language.service';
import {DtoKnowledgeAnswer} from '@shared/schema/response/knowledge/DtoKnowledgeAnswer';
import {QuestionHistoryService} from '@shared/service/question-history.service';

describe('AppComponent', () => {
  beforeEach(async () => {
    spyOn(Storage.prototype, 'getItem').and.returnValue(null);
    spyOn(Storage.prototype, 'setItem');
    spyOn(Storage.prototype, 'removeItem');
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
  });
  const snapshot = {
    id: 'sample',
    name: 'Sample',
    repositories: [],
    overview: {
      frontend: [],
      backend: [],
      databases: [],
      domains: [],
      integrations: [],
      messaging: [],
      scheduledJobs: []
    }
  };
  const response: DtoKnowledgeAnswer = {
    inScope: true,
    project: 'Sample',
    question: 'How does it work?',
    summary: 'Sample summary',
    businessFlow: [],
    technicalFlow: [],
    apis: [],
    database: [],
    integrations: [],
    scheduledJobs: [],
    technicalDetails: [],
    sources: [],
    confidence: 'high',
    keyFindings: [],
    roles: [],
    risks: [],
    followUpQuestions: [],
    enoughEvidence: true
  };

  it('records only submitted questions and restores a draft with its format without another HTTP request', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const http = TestBed.inject(HttpTestingController);
    const history = TestBed.inject(QuestionHistoryService);
    fixture.detectChanges();
    http.expectOne('/api/projects').flush([snapshot]);
    app.ask('No project');
    expect(history.forProject('')).toEqual([]);
    app.selectProject('sample');
    http.expectOne('/api/projects/sample').flush(snapshot);
    fixture.detectChanges();
    app.ask('  Saved question  ', 'workflow');
    const first = http.expectOne('/api/questions');
    expect(first.request.body.question).toBe('Saved question');
    app.ask('Ignored while loading');
    first.flush({message: 'Failed'}, {status: 500, statusText: 'Error'});
    expect(history.forProject('sample')).toEqual([{question: 'Saved question', mode: 'workflow'}]);
    app.searchMode.set('basic');
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.question-history').open = true;
    fixture.nativeElement.querySelector('.history-question').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('textarea').value).toBe('Saved question');
    expect(app.searchMode()).toBe('workflow');
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('textarea'));
    http.expectNone('/api/questions');
    app.ask('   ');
    http.expectNone('/api/questions');
    app.ask('Saved question', 'workflow');
    http.expectOne('/api/questions').flush(response);
    expect(history.forProject('sample').length).toBe(1);
    app.openIntegration('Example');
    http.expectOne('/api/integrations/details').flush(response);
    expect(history.forProject('sample').length).toBe(1);
    http.verify();
  });

  it('switches history with the project, preserves it across selection resets and clears only that project', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const http = TestBed.inject(HttpTestingController);
    const history = TestBed.inject(QuestionHistoryService);
    const second = {...snapshot, id: 'second', name: 'Second'};
    history.remember('sample', 'First question', 'basic');
    history.remember('second', 'Second question', 'advanced');
    fixture.detectChanges();
    http.expectOne('/api/projects').flush([snapshot, second]);
    app.selectProject('sample');
    http.expectOne('/api/projects/sample').flush(snapshot);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.history-text').textContent).toBe('First question');
    fixture.nativeElement.querySelector('.history-question').click();
    fixture.detectChanges();
    app.selectProject('second');
    http.expectOne('/api/projects/second').flush(second);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('textarea').value).toBe('');
    expect(fixture.nativeElement.querySelector('.history-text').textContent).toBe('Second question');
    fixture.nativeElement.querySelector('.clear-history').click();
    fixture.detectChanges();
    expect(history.forProject('second')).toEqual([]);
    expect(history.forProject('sample').length).toBe(1);
    app.loadProjects();
    http.expectOne('/api/projects').flush([snapshot, second]);
    expect(app.selectedId()).toBe('');
    expect(history.forProject('sample').length).toBe(1);
    http.verify();
  });

  it('shows a loading state without prematurely reporting an empty project list', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const http = TestBed.inject(HttpTestingController);
    const labels = TestBed.inject(LanguageService);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(labels.t('loadingProjects'));
    expect(fixture.nativeElement.textContent).not.toContain(labels.t('noCodexProjects'));
    fixture.componentInstance.loadProjects();
    http.expectOne('/api/projects').flush([snapshot]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.project-prompt h2').textContent).toBe(labels.t('chooseProject'));
    expect(fixture.nativeElement.querySelector('.project-prompt p').textContent).toBe(labels.t('chooseProjectHint'));
    expect(fixture.nativeElement.querySelector('.project-prompt > span').textContent).toBe('▦');
    expect(fixture.nativeElement.querySelector('.project-prompt h1, .welcome-steps, .welcome-footer')).toBeNull();
    expect(fixture.componentInstance.selectedId()).toBe('');
    http.verify();
  });

  it('returns from an answer to the retained overview without another request', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const http = TestBed.inject(HttpTestingController);
    const app = fixture.componentInstance;
    fixture.detectChanges();
    http.expectOne('/api/projects').flush([snapshot]);
    app.selectProject('sample');
    http.expectOne('/api/projects/sample').flush(snapshot);
    app.ask(response.question);
    http.expectOne('/api/questions').flush(response);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.result-context p').textContent).toBe(response.question);
    fixture.nativeElement.querySelector('.back-overview').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-answer')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-project-overview')).not.toBeNull();
    expect(app.selectedProject()).toEqual(snapshot);
    http.expectNone((request) => request.url.startsWith('/api/'));
    http.verify();
  });

  it('refreshes from the sidebar without losing the selected project or answer and prevents duplicate refreshes', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne('/api/projects').flush([snapshot]);
    app.selectProject('sample');
    http.expectOne('/api/projects/sample').flush(snapshot);
    app.answer.set(response);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.refresh-projects').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.refresh-projects').disabled).toBeTrue();
    expect(fixture.nativeElement.querySelector('app-answer')).not.toBeNull();
    app.loadProjects(true);
    const refresh = http.expectOne('/api/projects/refresh');
    expect(refresh.request.method).toBe('POST');
    refresh.flush([snapshot, {...snapshot, id: 'new', name: 'New project'}]);
    expect(app.selectedProject()).toEqual(snapshot);
    expect(app.selectedId()).toBe('sample');
    expect(app.answer()).toBe(response);
    expect(app.projects().length).toBe(2);
    http.expectNone('/api/projects/sample');
    http.verify();
  });

  it('keeps the last list and answer after a failed refresh and clears removed selections on retry', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne('/api/projects').flush([snapshot]);
    app.selectProject('sample');
    http.expectOne('/api/projects/sample').flush(snapshot);
    app.answer.set(response);
    app.loadProjects(true);
    http.expectOne('/api/projects/refresh').flush({message: 'Offline'}, {status: 503, statusText: 'Unavailable'});
    fixture.detectChanges();
    expect(app.projects()).toEqual([snapshot]);
    expect(app.answer()).toBe(response);
    expect(app.selectedId()).toBe('sample');
    expect(fixture.nativeElement.querySelector('.refresh-error').textContent).toContain('Offline');
    app.loadProjects(true);
    http.expectOne('/api/projects/refresh').flush([]);
    expect(app.selectedId()).toBe('');
    expect(app.answer()).toBeNull();
    expect(app.projectsRefreshError()).toBe('');
    http.verify();
  });

  it('refreshes an empty cached catalog without automatically selecting or analyzing a project', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne('/api/projects').flush([]);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.fatal button').click();
    http.expectOne('/api/projects/refresh').flush([snapshot]);
    expect(app.projects()).toEqual([snapshot]);
    expect(app.selectedId()).toBe('');
    http.verify();
  });

  it('does not refresh the catalog while an answer or overview is in flight', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne('/api/projects').flush([snapshot]);
    for (const busy of [app.loading, app.overviewLoading, app.overviewRefreshing]) {
      busy.set(true);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.refresh-projects').disabled).toBeTrue();
      app.loadProjects(true);
      http.expectNone('/api/projects/refresh');
      busy.set(false);
    }
    http.verify();
  });

  it('ignores an old answer and its loading completion after selecting another project', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const http = TestBed.inject(HttpTestingController);
    const app = fixture.componentInstance;
    fixture.detectChanges();
    const second = {...snapshot, id: 'second', name: 'Second'};
    http.expectOne('/api/projects').flush([snapshot, second]);
    app.selectProject('sample');
    http.expectOne('/api/projects/sample').flush(snapshot);
    app.ask('Old question');
    const old = http.expectOne('/api/questions');
    app.selectProject('second');
    http.expectOne('/api/projects/second').flush(second);
    expect(app.loading()).toBeFalse();
    app.ask('New question');
    const current = http.expectOne('/api/questions');
    old.flush(response);
    expect(app.answer()).toBeNull();
    expect(app.loading()).toBeTrue();
    current.flush({...response, project: 'Second', question: 'New question'});
    expect(app.answer()?.question).toBe('New question');
    expect(app.loading()).toBeFalse();
    http.verify();
  });
  for (const language of ['en', 'ar'] as const) {
    it(`waits for explicit project selection and never analyzes a default project in ${language}`, () => {
      const fixture = TestBed.createComponent(AppComponent);
      const app = fixture.componentInstance;
      const http = TestBed.inject(HttpTestingController);
      const labels = TestBed.inject(LanguageService);
      labels.current.set(language);
      const overview = {
        frontend: [],
        backend: [],
        databases: [],
        domains: [],
        integrations: [],
        messaging: [],
        scheduledJobs: []
      };
      const first = {id: 'first', name: 'First', repositories: [], overview};
      const second = {id: 'second', name: 'Second', repositories: [], overview};
      fixture.detectChanges();
      http.expectOne('/api/projects').flush([first, second]);
      fixture.detectChanges();
      expect(app.selectedId()).toBe('');
      expect(app.selectedProject()).toBeNull();
      expect(fixture.nativeElement.textContent).toContain(labels.t('chooseProject'));
      expect(fixture.nativeElement.querySelector('.project-item.active')).toBeNull();
      expect(fixture.nativeElement.querySelector('app-question-input')).toBeNull();
      expect(fixture.nativeElement.querySelector('app-project-overview')).toBeNull();
      app.ask('Which framework?');
      app.openIntegration('Example');
      app.refreshOverview();
      http.expectNone((request) => request.url !== '/api/projects');
      const buttons = fixture.nativeElement.querySelectorAll(
        'app-sidebar nav .project-item'
      ) as NodeListOf<HTMLButtonElement>;
      buttons[1].click();
      http.expectOne('/api/projects/second').flush(second);
      fixture.detectChanges();
      expect(app.selectedId()).toBe('second');
      expect(fixture.nativeElement.querySelector('app-question-input')).not.toBeNull();
      http.expectNone('/api/projects/first');
      app.loadProjects();
      http.expectOne('/api/projects').flush([first]);
      fixture.detectChanges();
      expect(app.selectedId()).toBe('');
      http.expectNone('/api/projects/first');
      fixture.nativeElement.querySelector('.project-item.all').click();
      http.expectOne('/api/projects/all').flush({...first, id: 'all', name: 'All Projects'});
      expect(app.selectedId()).toBe('all');
      http.verify();
    });
  }

  it('creates the Projects Knowledge shell', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Projects Knowledge');
  });
  it('defaults requests to Basic and retries with the original mode', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne('/api/projects').flush([]);
    app.projects.set([
      {
        id: 'project',
        name: 'Project',
        repositories: [],
        overview: {
          frontend: [],
          backend: [],
          databases: [],
          domains: [],
          integrations: [],
          messaging: [],
          scheduledJobs: []
        }
      }
    ]);
    app.selectedId.set('project');
    app.ask('Which framework?');
    const first = http.expectOne('/api/questions');
    expect(first.request.body.mode).toBe('basic');
    first.flush({message: 'Failed'}, {status: 500, statusText: 'Error'});
    app.searchMode.set('advanced');
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.error-banner button').click();
    const retry = http.expectOne('/api/questions');
    expect(retry.request.body.mode).toBe('basic');
    retry.flush(null);
    app.ask('Which framework?');
    const advanced = http.expectOne('/api/questions');
    expect(advanced.request.body.mode).toBe('advanced');
    advanced.flush(null);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('input[value="workflow"]').click();
    app.ask('Explain the review workflow');
    const workflow = http.expectOne('/api/questions');
    expect(workflow.request.body.mode).toBe('workflow');
    workflow.flush({message: 'Failed'}, {status: 500, statusText: 'Error'});
    app.searchMode.set('basic');
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.error-banner button').click();
    const workflowRetry = http.expectOne('/api/questions');
    expect(workflowRetry.request.body.mode).toBe('workflow');
    workflowRetry.flush(null);
    http.verify();
  });

  it('runs the shell with the actual application providers and no routing setup', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [...appConfig.providers, provideHttpClientTesting()]
    }).compileComponents();
    const fixture = TestBed.createComponent(AppComponent);
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne('/api/projects').flush([]);
    expect(fixture.nativeElement.textContent).toContain('Projects Knowledge');
    http.verify();
  });

  it('shows an empty Codex catalog and refreshes without retaining a removed selection', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const http = TestBed.inject(HttpTestingController);
    const labels = TestBed.inject(LanguageService);
    fixture.detectChanges();
    app.selectedId.set('removed-project');
    http.expectOne('/api/projects').flush([]);
    fixture.detectChanges();
    expect(app.selectedId()).toBe('');
    expect(fixture.nativeElement.textContent).toContain(labels.t('noCodexProjects'));
    expect(fixture.nativeElement.querySelector('app-question-input')).toBeNull();
    fixture.nativeElement.querySelector('.fatal button').click();
    http
      .expectOne('/api/projects/refresh')
      .flush({message: 'Codex unavailable'}, {status: 503, statusText: 'Unavailable'});
    fixture.detectChanges();
    expect(app.projects()).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain('Codex unavailable');
    http.verify();
  });

  it('keeps integration loading, failure, retry and successful response behavior', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne('/api/projects').flush([]);
    app.projects.set([
      {
        id: 'project',
        name: 'Project',
        repositories: [],
        overview: {
          frontend: [],
          backend: [],
          databases: [],
          domains: [],
          integrations: [],
          messaging: [],
          scheduledJobs: []
        }
      }
    ]);
    app.selectedId.set('project');
    app.openIntegration('Elm Billing');
    expect(app.loading()).toBeTrue();
    expect(app.lastQuestion()).toBe('');
    const first = http.expectOne('/api/integrations/details');
    expect(first.request.body.name).toBe('Elm Billing');
    app.openIntegration('MCI');
    http.expectNone('/api/integrations/details');
    first.flush({message: 'Integration failed'}, {status: 500, statusText: 'Error'});
    expect(app.loading()).toBeFalse();
    expect(app.error()).toBe('Integration failed');
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.error-banner button').click();
    const retry = http.expectOne('/api/integrations/details');
    expect(retry.request.body.name).toBe('Elm Billing');
    expect(app.loading()).toBeTrue();
    retry.flush(null);
    expect(app.loading()).toBeFalse();
    expect(app.error()).toBe('');
    http.verify();
  });

  it('loads overview integrations and retries an analysis failure instead of showing an empty page', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const http = TestBed.inject(HttpTestingController);
    const labels = TestBed.inject(LanguageService);
    const project = {
      id: 'project',
      name: 'Project',
      repositories: [],
      overview: {
        frontend: [],
        backend: [],
        databases: [],
        domains: [],
        integrations: [] as string[],
        messaging: [],
        scheduledJobs: []
      }
    };
    fixture.detectChanges();
    http.expectOne('/api/projects').flush([project]);
    app.selectProject(project.id);
    expect(app.overviewLoading()).toBeTrue();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(labels.t('loadingOverview'));
    http
      .expectOne('/api/projects/project')
      .flush({message: 'Overview unavailable'}, {status: 503, statusText: 'Unavailable'});
    fixture.detectChanges();
    expect(app.overviewLoading()).toBeFalse();
    expect(fixture.nativeElement.querySelector('app-project-overview')).toBeNull();
    fixture.nativeElement.querySelector('.overview-error button').click();
    http
      .expectOne('/api/projects/project')
      .flush({...project, overview: {...project.overview, integrations: ['Orbit']}});
    fixture.detectChanges();
    expect(app.overviewError()).toBe('');
    expect(fixture.nativeElement.textContent).toContain('Orbit');
    fixture.nativeElement.querySelector('.integration-link').click();
    const integration = http.expectOne('/api/integrations/details');
    expect(integration.request.body.name).toBe('Orbit');
    expect(integration.request.body.projectId).toBe('project');
    integration.flush(null);
    http.verify();
  });

  it('ignores late overview results and errors when switching projects, including all projects', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const http = TestBed.inject(HttpTestingController);
    const overview = {
      frontend: [],
      backend: [],
      databases: [],
      domains: [],
      integrations: [],
      messaging: [],
      scheduledJobs: []
    };
    const first = {id: 'first', name: 'First', repositories: [], overview};
    const second = {id: 'second', name: 'Second', repositories: [], overview};
    fixture.detectChanges();
    http.expectOne('/api/projects').flush([first, second]);
    app.selectProject(first.id);
    const old = http.expectOne('/api/projects/first');
    app.selectProject('second');
    http.expectOne('/api/projects/second').flush(second);
    old.flush(first);
    expect(app.selectedProject()?.id).toBe('second');
    app.selectProject('first');
    const failing = http.expectOne('/api/projects/first');
    app.selectProject('all');
    http.expectOne('/api/projects/all').flush({id: 'all', name: 'All Projects', repositories: [], overview});
    failing.flush({message: 'Old failure'}, {status: 500, statusText: 'Error'});
    expect(app.selectedProject()?.id).toBe('all');
    expect(app.overviewError()).toBe('');
    expect(app.overviewLoading()).toBeFalse();
    http.verify();
  });

  it('refreshes explicitly, blocks duplicate clicks and preserves the previous date on failure', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const http = TestBed.inject(HttpTestingController);
    const project = {
      id: 'project',
      name: 'Project',
      repositories: [],
      overviewUpdatedAt: '2026-01-01T10:00:00Z',
      overview: {
        frontend: [],
        backend: ['Java'],
        databases: [],
        domains: [],
        integrations: [],
        messaging: [],
        scheduledJobs: []
      }
    };
    fixture.detectChanges();
    http.expectOne('/api/projects').flush([project]);
    app.selectProject(project.id);
    http.expectOne('/api/projects/project').flush(project);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.refresh-overview').click();
    const first = http.expectOne('/api/projects/project/overview/refresh');
    expect(first.request.method).toBe('POST');
    expect(app.overviewRefreshing()).toBeTrue();
    expect(app.selectedProject()?.overviewUpdatedAt).toBe(project.overviewUpdatedAt);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.refresh-overview').disabled).toBeTrue();
    app.refreshOverview();
    http.expectNone('/api/projects/project/overview/refresh');
    first.flush({message: 'Temporary failure'}, {status: 503, statusText: 'Unavailable'});
    fixture.detectChanges();
    expect(app.overviewRefreshing()).toBeFalse();
    expect(app.selectedProject()?.overviewUpdatedAt).toBe(project.overviewUpdatedAt);
    expect(fixture.nativeElement.querySelector('app-project-overview')).not.toBeNull();
    fixture.nativeElement.querySelector('.overview-refresh-error button').click();
    const retry = http.expectOne('/api/projects/project/overview/refresh');
    retry.flush({...project, overviewUpdatedAt: '2026-01-01T11:00:00Z'});
    fixture.detectChanges();
    expect(app.overviewRefreshError()).toBe('');
    expect(app.overviewRefreshing()).toBeFalse();
    expect(app.selectedProject()?.overviewUpdatedAt).toBe('2026-01-01T11:00:00Z');
    expect(fixture.nativeElement.querySelector('time').getAttribute('datetime')).toBe('2026-01-01T11:00:00.000Z');
    http.verify();
  });

  it('never applies a previous project refresh to the newly selected project', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const http = TestBed.inject(HttpTestingController);
    const overview = {
      frontend: [],
      backend: [],
      databases: [],
      domains: [],
      integrations: [],
      messaging: [],
      scheduledJobs: []
    };
    const first = {id: 'first', name: 'First', repositories: [], overview, overviewUpdatedAt: '2026-01-01T10:00:00Z'};
    const second = {...first, id: 'second', name: 'Second'};
    fixture.detectChanges();
    http.expectOne('/api/projects').flush([first, second]);
    app.selectProject(first.id);
    http.expectOne('/api/projects/first').flush(first);
    app.refreshOverview();
    const pending = http.expectOne('/api/projects/first/overview/refresh');
    app.selectProject('second');
    http.expectOne('/api/projects/second').flush(second);
    pending.flush({...first, overviewUpdatedAt: '2026-01-01T11:00:00Z'});
    expect(app.selectedProject()?.id).toBe('second');
    expect(app.selectedProject()?.overviewUpdatedAt).toBe(second.overviewUpdatedAt);
    app.refreshOverview();
    const failing = http.expectOne('/api/projects/second/overview/refresh');
    app.selectProject('first');
    http.expectOne('/api/projects/first').flush(first);
    failing.flush({message: 'Old failure'}, {status: 503, statusText: 'Unavailable'});
    expect(app.overviewRefreshError()).toBe('');
    expect(app.overviewRefreshing()).toBeFalse();
    http.verify();
  });
});
