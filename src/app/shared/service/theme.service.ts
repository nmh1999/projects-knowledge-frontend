import {computed, Injectable, signal} from '@angular/core';

export type AppTheme = 'light' | 'dark';

/** Stores the local color preference and applies it to the whole document. */
@Injectable({providedIn: 'root'})
export class ThemeService {
  readonly current = signal<AppTheme>(this.savedTheme());
  readonly isDark = computed(() => this.current() === 'dark');

  constructor() {
    this.apply(this.current());
  }

  toggle(): void {
    const theme: AppTheme = this.current() === 'dark' ? 'light' : 'dark';
    this.current.set(theme);
    this.apply(theme);
    try {
      localStorage.setItem('projects-knowledge-theme', theme);
    } catch {
      /* storage is optional */
    }
  }

  private savedTheme(): AppTheme {
    try {
      return localStorage.getItem('projects-knowledge-theme') === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  }

  private apply(theme: AppTheme): void {
    document.documentElement.dataset['theme'] = theme;
  }
}
