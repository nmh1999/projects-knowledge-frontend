import {TestBed} from '@angular/core/testing';
import {LanguageService} from '@shared/service/language.service';
import en from '@assets/i18n/en.json';
import ar from '@assets/i18n/ar.json';

describe('Interface language', () => {
  it('keeps English and Arabic dictionaries in sync after extraction', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(ar).sort());
    const language = TestBed.inject(LanguageService);
    for (const [locale, dictionary] of [
      ['en', en],
      ['ar', ar]
    ] as const) {
      language.current.set(locale);
      for (const [key, value] of Object.entries(dictionary)) {
        expect(value.trim()).not.toBe('');
        expect(language.t(key)).toBe(value);
      }
    }
  });

  it('formats project and repository counts naturally in both languages', () => {
    const language = TestBed.inject(LanguageService);
    language.current.set('en');
    expect(language.count('repositories', 1)).toBe('1 repository');
    expect(language.count('projects', 2)).toBe('2 projects');
    language.current.set('ar');
    expect(language.count('repositories', 1)).toBe('مستودع واحد');
    expect(language.count('repositories', 2)).toBe('مستودعان');
    expect(language.count('projects', 3)).toBe(`${new Intl.NumberFormat('ar').format(3)} مشاريع`);
    expect(language.count('projects', 12)).toBe(`${new Intl.NumberFormat('ar').format(12)} مشروعًا`);
  });

  it('provides complete localized labels for the revised experience', () => {
    const language = TestBed.inject(LanguageService);
    for (const locale of ['ar', 'en'] as const) {
      language.current.set(locale);
      for (const key of [
        'basicMode',
        'advancedMode',
        'workflowMode',
        'chooseProject',
        'chooseProjectHint',
        'backToOverview',
        'overviewCacheNote',
        'loadingProjects',
        'clearProjectSearch',
        'answerNavigation'
      ]) {
        expect(language.t(key)).not.toBe(key);
      }
    }
  });
});
