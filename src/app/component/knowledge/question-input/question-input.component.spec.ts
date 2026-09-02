import {ComponentFixture, TestBed} from '@angular/core/testing';
import {QuestionInputComponent} from '@component/knowledge/question-input/question-input.component';

describe('Question search modes', () => {
  let fixture: ComponentFixture<QuestionInputComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({imports: [QuestionInputComponent]}).compileComponents();
    fixture = TestBed.createComponent(QuestionInputComponent);
    fixture.detectChanges();
  });

  it('defaults to Basic and changes mode without submitting or clearing the question', () => {
    const component = fixture.componentInstance;
    const changed = jasmine.createSpy('changed');
    const asked = jasmine.createSpy('asked');
    component.modeChanged.subscribe(changed);
    component.asked.subscribe(asked);
    component.question.setValue('Which framework?');
    expect(fixture.nativeElement.querySelector('input[value="basic"]').checked).toBeTrue();
    fixture.nativeElement.querySelector('input[value="advanced"]').click();
    expect(changed).toHaveBeenCalledOnceWith('advanced');
    expect(asked).not.toHaveBeenCalled();
    expect(component.question.value).toBe('Which framework?');
  });

  it('keeps history collapsed until opened and restores text and mode without sending', () => {
    const host = fixture.nativeElement as HTMLElement;
    const entry = {question: 'Explain approval roles', mode: 'workflow' as const};
    fixture.componentRef.setInput('history', [entry]);
    fixture.detectChanges();
    const details = host.querySelector<HTMLDetailsElement>('.question-history')!;
    expect(details.open).toBeFalse();
    const asked = spyOn(fixture.componentInstance.asked, 'emit');
    const changed = spyOn(fixture.componentInstance.modeChanged, 'emit');
    details.querySelector('summary')!.click();
    expect(details.open).toBeTrue();
    host.querySelector<HTMLButtonElement>('.history-question')!.click();
    expect(fixture.componentInstance.question.value).toBe(entry.question);
    expect(changed).toHaveBeenCalledOnceWith('workflow');
    expect(asked).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(host.querySelector('textarea'));
    const cleared = spyOn(fixture.componentInstance.historyCleared, 'emit');
    host.querySelector<HTMLButtonElement>('.clear-history')!.click();
    expect(cleared).toHaveBeenCalledTimes(1);
  });

  it('disables history actions while loading and leaves the current draft untouched', () => {
    const entry = {question: 'Past question', mode: 'advanced' as const};
    fixture.componentRef.setInput('history', [entry]);
    fixture.componentRef.setInput('loading', true);
    fixture.componentInstance.question.setValue('Current draft');
    fixture.detectChanges();
    const cleared = spyOn(fixture.componentInstance.historyCleared, 'emit');
    const changed = spyOn(fixture.componentInstance.modeChanged, 'emit');
    for (const button of fixture.nativeElement.querySelectorAll(
      '.question-history button'
    ) as NodeListOf<HTMLButtonElement>) {
      expect(button.disabled).toBeTrue();
      button.click();
    }
    fixture.componentInstance.restore(entry);
    expect(fixture.componentInstance.question.value).toBe('Current draft');
    expect(cleared).not.toHaveBeenCalled();
    expect(changed).not.toHaveBeenCalled();
  });

  it('renders safe, localized history with long questions in a narrow panel', () => {
    const host = fixture.nativeElement as HTMLElement;
    host.style.display = 'block';
    host.style.width = '320px';
    fixture.componentRef.setInput(
      'history',
      Array.from({length: 20}, (_, index) => ({
        question: `${index} <img src=x onerror=alert(1)> ` + 'مرحباLongQuestion'.repeat(30),
        mode: 'workflow'
      }))
    );
    fixture.detectChanges();
    host.querySelector<HTMLDetailsElement>('.question-history')!.open = true;
    for (const language of ['en', 'ar'] as const) {
      fixture.componentInstance.language.current.set(language);
      host.dir = language === 'ar' ? 'rtl' : 'ltr';
      fixture.detectChanges();
      expect(host.querySelectorAll('.history-question').length).toBe(20);
      expect(host.querySelector('.history-count')?.textContent).toContain('20 / 20');
      const list = host.querySelector('ol')!;
      expect(list.clientHeight).toBeLessThanOrEqual(366);
      expect(list.scrollHeight).toBeGreaterThan(list.clientHeight);
      expect(host.querySelector('.question-history summary')?.textContent).toContain(
        fixture.componentInstance.language.t('recentQuestions')
      );
      expect(host.querySelector('.history-mode')?.textContent).toBe(
        fixture.componentInstance.language.t('workflowMode')
      );
      expect(host.querySelector('.question-history img')).toBeNull();
      expect(host.scrollWidth).toBeLessThanOrEqual(host.clientWidth + 1);
      expect(getComputedStyle(host.querySelector('.history-chevron')!).direction).toBe('ltr');
      const panel = host.querySelector('.question-history')!.getBoundingClientRect();
      const count = host.querySelector('.history-count')!.getBoundingClientRect();
      expect(language === 'ar' ? count.left - panel.left : panel.right - count.right).toBeLessThan(20);
    }
    fixture.componentRef.setInput('history', []);
    fixture.componentRef.setInput('historyPersistent', false);
    fixture.detectChanges();
    expect(host.querySelector('.history-empty')?.textContent).toBe(
      fixture.componentInstance.language.t('noRecentQuestions')
    );
    expect(host.querySelector('.history-warning')?.textContent).toBe(
      fixture.componentInstance.language.t('questionHistoryTemporary')
    );
  });

  it('disables mode changes while a request is loading', () => {
    const changed = jasmine.createSpy('changed');
    fixture.componentInstance.modeChanged.subscribe(changed);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('fieldset').disabled).toBeTrue();
    fixture.nativeElement.querySelector('input[value="advanced"]').click();
    fixture.nativeElement.querySelector('input[value="workflow"]').click();
    expect(changed).not.toHaveBeenCalled();
    fixture.nativeElement.querySelector('input[value="database"]').click();
    expect(changed).not.toHaveBeenCalled();
  });

  it('deletes only the chosen entry without restoring or submitting its question', () => {
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('history', [
      {question: 'First', mode: 'basic'},
      {question: 'Second', mode: 'database'}
    ]);
    component.question.setValue('Unsent draft');
    fixture.detectChanges();
    const deleted = spyOn(component.historyRemoved, 'emit');
    const asked = spyOn(component.asked, 'emit');
    const changed = spyOn(component.modeChanged, 'emit');
    const button = fixture.nativeElement.querySelectorAll('.remove-history')[1] as HTMLButtonElement;
    expect(button.getAttribute('aria-label')).toContain('Second');
    button.click();
    expect(deleted).toHaveBeenCalledOnceWith('Second');
    expect(component.question.value).toBe('Unsent draft');
    expect(asked).not.toHaveBeenCalled();
    expect(changed).not.toHaveBeenCalled();
  });

  it('selects Workflow without submitting and displays its own hint', () => {
    const changed = jasmine.createSpy('changed');
    const asked = jasmine.createSpy('asked');
    fixture.componentInstance.modeChanged.subscribe(changed);
    fixture.componentInstance.asked.subscribe(asked);
    fixture.componentInstance.question.setValue('Explain approvals');
    fixture.nativeElement.querySelector('input[value="workflow"]').click();
    expect(changed).toHaveBeenCalledOnceWith('workflow');
    expect(asked).not.toHaveBeenCalled();
    fixture.componentRef.setInput('mode', 'workflow');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.mode-hint').textContent).toContain(
      fixture.componentInstance.language.t('workflowHint')
    );
    expect(fixture.componentInstance.question.value).toBe('Explain approvals');
  });

  it('selects and restores Database mode without sending until Enter', () => {
    const component = fixture.componentInstance;
    const changed = spyOn(component.modeChanged, 'emit');
    const asked = spyOn(component.asked, 'emit');
    component.question.setValue('Explain order tables');
    fixture.nativeElement.querySelector('input[value="database"]').click();
    expect(changed).toHaveBeenCalledOnceWith('database');
    expect(component.question.value).toBe('Explain order tables');
    expect(asked).not.toHaveBeenCalled();
    fixture.componentRef.setInput('mode', 'database');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.mode-hint').textContent).toBe(component.language.t('databaseHint'));
    component.restore({question: '  Explain keys  ', mode: 'database'});
    expect(asked).not.toHaveBeenCalled();
    fixture.nativeElement
      .querySelector('textarea')
      .dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true, cancelable: true}));
    expect(asked).toHaveBeenCalledOnceWith('Explain keys');
  });

  it('sends trimmed text on Enter, but not Shift+Enter', () => {
    const asked = jasmine.createSpy('asked');
    fixture.componentInstance.asked.subscribe(asked);
    fixture.componentInstance.question.setValue('  Which framework?  ');
    const textarea = fixture.nativeElement.querySelector('textarea');
    textarea.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', shiftKey: true, bubbles: true}));
    expect(asked).not.toHaveBeenCalled();
    textarea.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true, cancelable: true}));
    expect(asked).toHaveBeenCalledOnceWith('Which framework?');
  });

  it('starts question text naturally and keeps space beside the clear button for mixed-direction text', () => {
    const host = fixture.nativeElement as HTMLElement;
    const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    host.dir = 'ltr';
    fixture.componentInstance.question.setValue('سؤال عربي');
    fixture.detectChanges();
    let style = getComputedStyle(textarea);
    expect(style.paddingLeft).toBe('14px');
    expect(style.paddingRight).toBe('46px');

    host.dir = 'rtl';
    fixture.componentInstance.question.setValue('English question');
    fixture.detectChanges();
    style = getComputedStyle(textarea);
    expect(style.paddingRight).toBe('14px');
    expect(style.paddingLeft).toBe('46px');
  });

  it('localizes each mode and includes the selected project in the restored heading', () => {
    fixture.componentRef.setInput('projectName', 'Example API');
    for (const language of ['ar', 'en'] as const) {
      fixture.componentInstance.language.current.set(language);
      fixture.detectChanges();
      const host = fixture.nativeElement as HTMLElement;
      expect(host.querySelector('h1 bdi')?.textContent).toBe('Example API');
      expect(host.querySelector('h1')?.textContent).toBe(
        language === 'ar' ? 'اسأل عن Example API' : 'Ask anything about Example API'
      );
      expect(host.querySelector('.ask-context')).toBeNull();
      for (const mode of ['basic', 'advanced', 'workflow', 'database']) {
        expect(host.textContent).toContain(fixture.componentInstance.language.t(mode + 'Mode'));
      }
      expect(host.querySelectorAll('.mode-hint').length).toBe(1);
      expect(host.querySelector('.search-modes small')).toBeNull();
      expect(host.querySelector('.mode-hint')?.textContent).toBe(fixture.componentInstance.language.t('basicHint'));
      expect(host.querySelector('.mode-hint')?.getAttribute('aria-live')).toBe('polite');
      expect(host.querySelector('.question-label')?.textContent).toBe(
        fixture.componentInstance.language.t('questionLabel')
      );
      expect(host.querySelector('textarea')?.hasAttribute('maxlength')).toBeFalse();
      expect(host.querySelector('textarea')?.getAttribute('dir')).toBe(language === 'ar' ? 'rtl' : 'ltr');
    }
    fixture.componentInstance.question.setValue('Mixed direction text');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('textarea').getAttribute('dir')).toBe('auto');
  });

  it('focuses the question field without scrolling when a project is selected', async () => {
    const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    const focus = spyOn(textarea, 'focus');
    fixture.componentRef.setInput('resetKey', 'project-a');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(focus).toHaveBeenCalledOnceWith({preventScroll: true});
  });

  it('exposes the loading state on the question card', () => {
    const card = fixture.nativeElement.querySelector('.ask-card') as HTMLElement;
    expect(card.getAttribute('aria-busy')).toBe('false');
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    expect(card.getAttribute('aria-busy')).toBe('true');
  });

  it('does not submit whitespace, composing text or a held Enter key', () => {
    const asked = spyOn(fixture.componentInstance.asked, 'emit');
    fixture.componentInstance.question.setValue('   ');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.ask-button').disabled).toBeTrue();
    fixture.componentInstance.submit(new Event('submit'));
    fixture.componentInstance.question.setValue('A question');
    fixture.nativeElement
      .querySelector('textarea')
      .dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', isComposing: true, bubbles: true}));
    fixture.nativeElement
      .querySelector('textarea')
      .dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', repeat: true, bubbles: true}));
    expect(asked).not.toHaveBeenCalled();
  });

  it('places the format above the question and the send button below without horizontal overflow', () => {
    fixture.componentRef.setInput('projectName', 'Example');
    const host = fixture.nativeElement as HTMLElement;
    host.style.display = 'block';
    for (const language of ['en', 'ar'] as const) {
      fixture.componentInstance.language.current.set(language);
      host.dir = language === 'ar' ? 'rtl' : 'ltr';
      fixture.detectChanges();
      for (const width of [960, 320]) {
        host.style.width = `${width}px`;
        const card = host.querySelector<HTMLElement>('.ask-card')!;
        const choices = Array.from(host.querySelectorAll<HTMLElement>('.search-modes label'));
        expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth + 1);
        expect(choices.length).toBe(4);
        if (width === 960)
          expect(
            choices.every((choice) => choice.getBoundingClientRect().top === choices[0].getBoundingClientRect().top)
          ).toBeTrue();
        else expect(new Set(choices.map((choice) => choice.getBoundingClientRect().top)).size).toBe(2);
        expect(host.querySelector('form')!.contains(host.querySelector('fieldset'))).toBeTrue();
        expect(host.querySelector('.ask-button b')).toBeNull();
        const picker = host.querySelector<HTMLElement>('.mode-picker')!;
        const question = host.querySelector<HTMLTextAreaElement>('textarea')!;
        const send = host.querySelector<HTMLButtonElement>('.ask-button')!;
        expect(picker.getBoundingClientRect().bottom).toBeLessThan(question.getBoundingClientRect().top);
        expect(question.getBoundingClientRect().bottom).toBeLessThan(send.getBoundingClientRect().top);
        expect(picker.compareDocumentPosition(question) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        if (width === 960) expect(card.getBoundingClientRect().height).toBeLessThan(400);
      }
    }
  });
});
