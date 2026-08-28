import { Component, inject, input, output } from '@angular/core';
import { LanguageService } from '../../../core/services/language.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-header', standalone: true, template: `
    <header class="app-header">
      <button class="menu-button" type="button" [attr.aria-label]="language.t('toggleProjects')" [attr.aria-expanded]="menuOpen()" aria-controls="project-navigation" (click)="menuToggle.emit()"><span></span><span></span><span></span></button>
      <div class="brand"><span class="brand-mark">PK</span><span><strong>Projects Knowledge</strong><small>{{language.t('repositoryIntelligence')}}</small></span></div>
      <div class="header-actions"><button class="language-button" type="button" (click)="language.toggle()">{{language.t('switchLanguage')}}</button><button class="language-button theme-button" type="button" (click)="theme.toggle()" [attr.aria-label]="language.t(theme.isDark()?'lightMode':'darkMode')" [title]="language.t(theme.isDark()?'lightMode':'darkMode')">{{theme.isDark()?'☀':'☾'}}</button></div>
    </header>`, styleUrl: './header.component.scss', styles:[`.header-actions{display:flex;align-items:center;gap:8px;margin-inline-start:auto}.header-actions .language-button{margin-inline-start:0}.theme-button{min-width:34px;padding-inline:10px;font-size:15px}@media(max-width:760px){.header-actions{gap:5px}.theme-button{min-width:32px;padding-inline:8px}}`]
})
export class HeaderComponent { readonly language=inject(LanguageService);readonly theme=inject(ThemeService);readonly menuOpen=input(false);readonly menuToggle = output<void>(); }
