import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {fakeAsync, TestBed, tick} from '@angular/core/testing';
import {AppComponent} from './app.component';
import {loadingInterceptor} from '@shared/interceptor/loading.interceptor';
import {HttpLoadingService} from '@shared/service/http-loading.service';
import {DtoKnowledgeAnswer} from '@shared/schema/response/knowledge/DtoKnowledgeAnswer';

describe('Cancellation UI', () => {
  const project = {
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
  const answer: DtoKnowledgeAnswer = {
    project: 'Sample',
    question: 'Explain approvals',
    summary: 'Previous answer',
    inScope: true,
    enoughEvidence: true,
    confidence: 'high',
    businessFlow: [],
    technicalFlow: [],
    apis: [],
    database: [],
    integrations: [],
    scheduledJobs: [],
    technicalDetails: [],
    sources: [],
    keyFindings: [],
    roles: [],
    risks: [],
    followUpQuestions: [],
    updatedAt: '2026-08-28T10:00:00Z',
    expiresAt: '2026-08-28T15:00:00Z'
  };
  beforeEach(async () => {
    spyOn(Storage.prototype, 'getItem').and.returnValue(null);
    spyOn(Storage.prototype, 'setItem');
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideHttpClient(withInterceptors([loadingInterceptor])), provideHttpClientTesting()]
    }).compileComponents();
  });

  for (const mode of ['basic', 'advanced', 'workflow', 'database'] as const) {
    it(
      'cancels ' + mode + ' answer refresh while keeping the previous answer and history',
      fakeAsync(() => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.componentInstance;
        const http = TestBed.inject(HttpTestingController);
        fixture.detectChanges();
        http.expectOne('/api/projects').flush([project]);
        app.selectProject('sample');
        http.expectOne('/api/projects/sample').flush(project);
        app.ask(answer.question, mode);
        http.expectOne('/api/questions').flush(answer);
        const history = app.recentQuestions();
        app.refreshAnswer();
        const refresh = http.expectOne('/api/questions/refresh');
        fixture.detectChanges();
        fixture.nativeElement.querySelector('.cancel-request').click();
        http.expectOne((request) => request.url.endsWith('/cancel')).flush(null);
        fixture.detectChanges();
        expect(refresh.cancelled).toBeTrue();
        expect(app.answerRefreshing()).toBeFalse();
        expect(app.answerRefreshError()).toBe('');
        expect(app.error()).toBe('');
        expect(app.answer()).toEqual(answer);
        expect(app.recentQuestions()).toEqual(history);
        expect(fixture.nativeElement.querySelector('.http-loading')).toBeNull();
        expect(fixture.nativeElement.querySelector('app-answer').textContent).toContain('Previous answer');
        app.refreshAnswer();
        http.expectOne('/api/questions/refresh').flush({...answer, summary: 'Retry answer'});
        expect(app.answer()?.summary).toBe('Retry answer');
        tick(5000);
        http.verify();
      })
    );
  }

  it('keeps the project usable while its overview loads in the background', fakeAsync(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const http = TestBed.inject(HttpTestingController);
    const loader = TestBed.inject(HttpLoadingService);
    fixture.detectChanges();
    http.expectOne('/api/projects');
    loader.cancelAll();
    http.expectOne((request) => request.url.endsWith('/cancel')).flush(null);
    fixture.detectChanges();
    expect(app.projectsCancelled()).toBeTrue();
    expect(app.error()).toBe('');
    expect(app.projectsLoading()).toBeFalse();
    fixture.nativeElement.querySelector('.fatal button').click();
    http.expectOne('/api/projects').flush([project]);
    tick(450);
    app.selectProject('sample');
    const overview = http.expectOne('/api/projects/sample');
    fixture.detectChanges();
    expect(app.overviewLoading()).toBeTrue();
    expect(app.overviewError()).toBe('');
    expect(loader.pendingCount()).toBe(0);
    expect(fixture.nativeElement.querySelector('.http-loading')).toBeNull();
    expect((fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement).disabled).toBeFalse();
    app.ask(answer.question, 'basic');
    const question = http.expectOne('/api/questions');
    expect(question.request.body.projectId).toBe('sample');
    expect(loader.pendingCount()).toBe(1);
    question.flush(answer);
    overview.flush(project);
    expect(app.answer()).toEqual(answer);
    expect(app.overviewLoading()).toBeFalse();
    tick(5000);
    http.verify();
  }));

  it('shows cancellation instead of failure for a new question and supports retry', fakeAsync(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne('/api/projects').flush([project]);
    app.selectProject('sample');
    http.expectOne('/api/projects/sample').flush(project);
    app.ask(answer.question, 'workflow');
    http.expectOne('/api/questions');
    TestBed.inject(HttpLoadingService).cancelAll();
    http.expectOne((request) => request.url.endsWith('/cancel')).flush(null);
    fixture.detectChanges();
    expect(app.answerCancelled()).toBeTrue();
    expect(app.loading()).toBeFalse();
    expect(app.error()).toBe('');
    fixture.nativeElement.querySelector('.cancelled-state button').click();
    const retry = http.expectOne('/api/questions');
    expect(retry.request.body.mode).toBe('workflow');
    retry.flush(answer);
    expect(app.answerCancelled()).toBeFalse();
    tick(5000);
    http.verify();
  }));

  for (const direction of ['ltr', 'rtl']) {
    for (const width of [390, 1100]) {
      it(`keeps the cancellation notice separated from history at ${width}px in ${direction}`, fakeAsync(() => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.componentInstance;
        const http = TestBed.inject(HttpTestingController);
        fixture.detectChanges();
        http.expectOne('/api/projects').flush([project]);
        app.selectProject('sample');
        http.expectOne('/api/projects/sample').flush(project);
        app.ask(answer.question, 'database');
        http.expectOne('/api/questions');
        TestBed.inject(HttpLoadingService).cancelAll();
        http.expectOne((request) => request.url.endsWith('/cancel')).flush(null);
        fixture.detectChanges();

        const content = fixture.nativeElement.querySelector('.content') as HTMLElement;
        content.style.width = width + 'px';
        content.dir = direction;
        const history = content.querySelector<HTMLElement>('.question-history')!;
        const notice = content.querySelector<HTMLElement>('.cancelled-state')!;
        expect(notice.getBoundingClientRect().top - history.getBoundingClientRect().bottom).toBeGreaterThanOrEqual(19);
        expect(notice.scrollWidth).toBeLessThanOrEqual(notice.clientWidth + 1);
        for (const button of notice.querySelectorAll('button')) {
          const bounds = button.getBoundingClientRect();
          expect(bounds.left).toBeGreaterThanOrEqual(notice.getBoundingClientRect().left);
          expect(bounds.right).toBeLessThanOrEqual(notice.getBoundingClientRect().right);
        }
        expect(notice.querySelectorAll('button').length).toBe(2);
        notice.querySelector<HTMLButtonElement>('.cancelled-back')!.click();
        fixture.detectChanges();
        expect(app.answerCancelled()).toBeFalse();
        expect(content.querySelector('.cancelled-state')).toBeNull();
        tick(5000);
        http.verify();
      }));
    }
  }
});
