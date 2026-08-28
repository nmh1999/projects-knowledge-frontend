import {QuestionHistoryService} from '@shared/service/question-history.service';

describe('Question history', () => {
  let saved: string | null;
  beforeEach(() => {
    saved = null;
    spyOn(Storage.prototype, 'getItem').and.callFake(() => saved);
    spyOn(Storage.prototype, 'setItem').and.callFake((_key, value) => {
      saved = value;
    });
    spyOn(Storage.prototype, 'removeItem').and.callFake(() => {
      saved = null;
    });
  });

  it('keeps only the last five unique, trimmed questions per scope, newest first', () => {
    const history = new QuestionHistoryService();
    for (let index = 1; index <= 6; index++) history.remember('one', `  Question ${index}  `, 'basic');
    history.remember('two', 'Other project', 'advanced');
    history.remember('all', 'Across projects', 'workflow');
    expect(history.forProject('one').map((entry) => entry.question)).toEqual([
      'Question 6',
      'Question 5',
      'Question 4',
      'Question 3',
      'Question 2'
    ]);
    history.remember('one', 'Question 3', 'workflow');
    expect(history.forProject('one')[0]).toEqual({question: 'Question 3', mode: 'workflow'});
    expect(history.forProject('one').length).toBe(5);
    expect(history.forProject('two')).toEqual([{question: 'Other project', mode: 'advanced'}]);
    expect(history.forProject('all')).toEqual([{question: 'Across projects', mode: 'workflow'}]);
    history.remember('one', '   ', 'basic');
    history.remember('', 'No selection', 'basic');
    expect(history.forProject('')).toEqual([]);
    expect(history.forProject('one').length).toBe(5);
  });

  it('survives reloads and clears only the selected scope', () => {
    const history = new QuestionHistoryService();
    history.remember('one', 'First', 'workflow');
    history.remember('__proto__', 'Second', 'advanced');
    const reloaded = new QuestionHistoryService();
    expect(reloaded.forProject('one')).toEqual(history.forProject('one'));
    reloaded.clear('one');
    expect(new QuestionHistoryService().forProject('one')).toEqual([]);
    expect(new QuestionHistoryService().forProject('__proto__')).toEqual([{question: 'Second', mode: 'advanced'}]);
    reloaded.clear('__proto__');
    expect(localStorage.removeItem).toHaveBeenCalledOnceWith('projects-knowledge-question-history-v1');
    expect(saved).toBeNull();
  });

  it('validates restored data and limits oversized histories without changing question text', () => {
    const text = '<img src=x onerror=alert(1)>';
    saved = JSON.stringify([
      null,
      ['bad', {}],
      [42, []],
      [
        'one',
        [
          null,
          {},
          {question: ' ', mode: 'basic'},
          {question: 'Ignore', mode: 'unknown'},
          {question: text, mode: 'workflow'},
          {question: text, mode: 'basic'},
          ...Array.from({length: 10}, (_, index) => ({question: `Question ${index}`, mode: 'advanced'}))
        ]
      ]
    ]);
    const history = new QuestionHistoryService();
    expect(history.forProject('one').length).toBe(5);
    expect(history.forProject('one')[0]).toEqual({question: text, mode: 'workflow'});
    expect(history.forProject('bad')).toEqual([]);
    saved = '{broken';
    expect(new QuestionHistoryService().forProject('one')).toEqual([]);
    saved = '{}';
    expect(new QuestionHistoryService().forProject('one')).toEqual([]);
  });

  it('keeps questions usable in memory when local storage is blocked or full', () => {
    (localStorage.getItem as jasmine.Spy).and.throwError('Blocked');
    (localStorage.setItem as jasmine.Spy).and.throwError('Full');
    (localStorage.removeItem as jasmine.Spy).and.throwError('Blocked');
    const history = new QuestionHistoryService();
    expect(history.persistent()).toBeFalse();
    expect(() => history.remember('one', 'Still works', 'basic')).not.toThrow();
    expect(history.forProject('one').length).toBe(1);
    expect(history.persistent()).toBeFalse();
    expect(() => history.clear('one')).not.toThrow();
    expect(history.forProject('one')).toEqual([]);
  });
});
