import {TestBed} from '@angular/core/testing';
import {AnswerComponent} from '@component/knowledge/answer/answer.component';
import {DtoKnowledgeAnswer} from '@shared/schema/response/knowledge/DtoKnowledgeAnswer';
import {LanguageService} from '@shared/service/language.service';

describe('Basic summary answer', () => {
  for (const language of ['en', 'ar'] as const) {
    it(`shows only the scope notice and never unrelated generated content in ${language}`, async () => {
      await TestBed.configureTestingModule({imports: [AnswerComponent]}).compileComponents();
      const fixture = TestBed.createComponent(AnswerComponent);
      const labels = TestBed.inject(LanguageService);
      labels.current.set(language);
      const answer: DtoKnowledgeAnswer = {
        inScope: false,
        project: 'Project',
        question: 'Tell me a joke',
        summary: 'UNRELATED CONTENT',
        confidence: 'high',
        enoughEvidence: true,
        businessFlow: ['UNRELATED CONTENT'],
        technicalFlow: [],
        apis: [],
        database: [],
        integrations: [],
        scheduledJobs: [],
        technicalDetails: [],
        sources: [],
        keyFindings: ['UNRELATED CONTENT'],
        roles: [],
        risks: [],
        followUpQuestions: [],
        workflowExample: 'UNRELATED CONTENT'
      };
      fixture.componentRef.setInput('answer', answer);
      fixture.detectChanges();
      const host = fixture.nativeElement as HTMLElement;
      expect(host.querySelector('[role="status"]')?.textContent).toContain(labels.t('outOfScopeTitle'));
      expect(host.textContent).not.toContain('UNRELATED CONTENT');
      expect(host.textContent).not.toContain(labels.t('groundedAnswer'));
      expect(host.querySelector('.confidence')).toBeNull();
      expect(host.querySelector('.answer-toolbar')).toBeNull();
      expect(host.querySelector('#workflow-example')).toBeNull();
      const copy = spyOn(navigator.clipboard, 'writeText').and.resolveTo();
      await fixture.componentInstance.copyFullAnswer(answer);
      expect(copy).toHaveBeenCalledWith(labels.t('outOfScopeMessage'));
      fixture.componentRef.setInput('answer', {...answer, inScope: undefined});
      fixture.detectChanges();
      expect(host.textContent).not.toContain('UNRELATED CONTENT');
      expect(host.querySelector('.scope-notice')).not.toBeNull();
      fixture.componentRef.setInput('answer', {
        ...answer,
        inScope: true,
        enoughEvidence: false,
        confidence: 'low',
        summary: 'No project evidence found'
      });
      fixture.detectChanges();
      expect(host.querySelector('.scope-notice')).toBeNull();
      expect(host.querySelector('#summary')?.textContent).toContain('No project evidence found');
    });
  }

  it('uses the shared summary card without sources or detailed sections', async () => {
    await TestBed.configureTestingModule({imports: [AnswerComponent]}).compileComponents();
    const fixture = TestBed.createComponent(AnswerComponent);
    const answer: DtoKnowledgeAnswer = {
      inScope: true,
      project: 'Project',
      question: 'Which framework?',
      summary: 'Uses Angular.',
      confidence: 'high',
      enoughEvidence: true,
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
      followUpQuestions: []
    };
    fixture.componentRef.setInput('answer', answer);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('#summary')?.textContent).toContain('Uses Angular.');
    expect(host.querySelectorAll('.card').length).toBe(1);
    expect(host.querySelector('app-source-viewer')).toBeNull();
    expect(host.querySelector('app-technical-flow')).toBeNull();
    expect(host.querySelector('app-workflow-diagram')).toBeNull();
    expect(host.querySelector('code')).toBeNull();
    expect(host.querySelector('.section-copy')).not.toBeNull();
    for (const language of ['en', 'ar'] as const)
      for (const confidence of ['high', 'medium', 'low'] as const) {
        const labels = TestBed.inject(LanguageService);
        labels.current.set(language);
        fixture.componentRef.setInput('answer', {...answer, confidence});
        fixture.detectChanges();
        expect(host.querySelector('.confidence')).toBeNull();
        expect(host.querySelector('#summary h2')?.textContent).toBe(labels.t('summary'));
        expect(host.querySelector('#summary')?.textContent).not.toContain(labels.t('confidence'));
      }
  });
});

describe('Workflow answer', () => {
  for (const language of ['en', 'ar'] as const) {
    it(`renders roles, steps and a labelled example in ${language}, including section and full copy`, async () => {
      await TestBed.configureTestingModule({imports: [AnswerComponent]}).compileComponents();
      const fixture = TestBed.createComponent(AnswerComponent);
      const labels = TestBed.inject(LanguageService);
      labels.current.set(language);
      const example =
        language === 'ar'
          ? 'افترض أن المراجع يراجع طلبًا مقدمًا.'
          : 'Imagine a reviewer reviewing a submitted request.';
      const answer: DtoKnowledgeAnswer = {
        inScope: true,
        project: 'Project',
        question: 'Explain reviews',
        summary: 'Review process',
        confidence: 'high',
        enoughEvidence: true,
        businessFlow: ['The reviewer reviews the submitted request.'],
        technicalFlow: [],
        apis: [],
        database: [],
        integrations: [],
        scheduledJobs: [],
        technicalDetails: [],
        sources: [],
        keyFindings: [],
        roles: [{role: 'REVIEWER', capability: 'Reviews', evidence: 'Review check'}],
        risks: [],
        followUpQuestions: [],
        workflowExample: example,
        workflowDiagram: {
          nodes: [
            {id: 'review', title: 'Review', actor: 'REVIEWER', type: 'decision'},
            {id: 'done', title: 'Approved', actor: '', type: 'end'}
          ],
          edges: [{from: 'review', to: 'done', label: 'Approve'}]
        }
      };
      fixture.componentRef.setInput('answer', answer);
      fixture.detectChanges();
      const host = fixture.nativeElement as HTMLElement;
      expect(host.querySelector('.roles-grid')?.textContent).toContain('REVIEWER');
      expect(host.querySelector('app-business-flow')?.textContent).toContain(answer.businessFlow[0]);
      expect(host.querySelector('#workflow-example h3')?.textContent).toBe(labels.t('workflowExample'));
      expect(host.querySelector('#workflow-example')?.textContent).toContain(labels.t('workflowExampleNote'));
      expect(host.querySelector('#workflow-example p')?.textContent).toBe(example);
      expect(host.querySelector('app-technical-flow')).toBeNull();
      expect(host.querySelectorAll('app-workflow-diagram .diagram-node').length).toBe(2);
      const copy = spyOn(navigator.clipboard, 'writeText').and.resolveTo();
      host.querySelector<HTMLButtonElement>('#workflow-example .section-copy')!.click();
      expect(copy).toHaveBeenCalledWith(jasmine.stringContaining(example));
      expect(copy).toHaveBeenCalledWith(jasmine.stringContaining(labels.t('workflowExampleNote')));
      host.querySelector<HTMLButtonElement>('#workflow-diagram .section-copy')!.click();
      expect(copy.calls.mostRecent().args[0]).toContain('Review → Approved — Approve');
      await fixture.componentInstance.copyFullAnswer(answer);
      expect(copy.calls.mostRecent().args[0]).toContain('REVIEWER');
      expect(copy.calls.mostRecent().args[0]).toContain(example);
      expect(copy.calls.mostRecent().args[0]).toContain('Review → Approved — Approve');
      fixture.componentRef.setInput('answer', {...answer, workflowExample: ''});
      fixture.detectChanges();
      expect(host.querySelector('#workflow-example')).toBeNull();
    });
  }
});
