import {computed, Injectable, signal} from '@angular/core';

import {Language} from '@shared/enums/Language';

import en from '@assets/i18n/en.json';
import ar from '@assets/i18n/ar.json';

const translations: Record<Language, Record<string, string>> = {en, ar};

/** Owns the active UI language and applies the matching document direction. */
@Injectable({providedIn: 'root'})
export class LanguageService {
  readonly current = signal<Language>(this.savedLanguage());
  readonly isArabic = computed(() => this.current() === 'ar');

  constructor() {
    this.apply(this.current());
  }

  t(key: string): string {
    return translations[this.current()][key] ?? key;
  }
  /** Keep numeric labels natural in both languages, including Arabic dual/plural forms. */
  count(kind: 'projects' | 'repositories', count: number): string {
    const value = new Intl.NumberFormat(this.current()).format(count);
    if (!this.isArabic())
      return `${value} ${kind === 'projects' ? (count === 1 ? 'project' : 'projects') : count === 1 ? 'repository' : 'repositories'}`;
    const category = new Intl.PluralRules('ar').select(count);
    const forms: Record<string, string> =
      kind === 'projects'
        ? {
            zero: 'لا توجد مشاريع',
            one: 'مشروع واحد',
            two: 'مشروعان',
            few: `${value} مشاريع`,
            many: `${value} مشروعًا`,
            other: `${value} مشروع`
          }
        : {
            zero: 'لا توجد مستودعات',
            one: 'مستودع واحد',
            two: 'مستودعان',
            few: `${value} مستودعات`,
            many: `${value} مستودعًا`,
            other: `${value} مستودع`
          };
    return forms[category];
  }
  toggle(): void {
    const value: Language = this.current() === 'en' ? 'ar' : 'en';
    this.current.set(value);
    this.apply(value);
    try {
      localStorage.setItem('projects-knowledge-language', value);
    } catch {
      /* storage is optional */
    }
  }

  private savedLanguage(): Language {
    try {
      return localStorage.getItem('projects-knowledge-language') === 'ar' ? 'ar' : 'en';
    } catch {
      return 'en';
    }
  }
  private apply(value: Language): void {
    document.documentElement.lang = value;
    document.documentElement.dir = value === 'ar' ? 'rtl' : 'ltr';
  }
}
