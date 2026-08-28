import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { HeaderComponent } from './features/layout/header/header.component';
import { SidebarComponent } from './features/layout/sidebar/sidebar.component';
import { ProjectOverviewComponent } from './features/projects/project-overview/project-overview.component';
import { QuestionInputComponent } from './features/knowledge/question-input/question-input.component';
import { AnswerComponent } from './features/knowledge/answer/answer.component';
import { KnowledgeApiService } from './core/services/knowledge-api.service';
import { Project } from './core/models/project.model';
import { KnowledgeAnswer } from './core/models/knowledge-answer.model';
import { SearchMode } from './core/models/search-mode.model';
import { LanguageService } from './core/services/language.service';
import { QuestionHistoryService } from './core/services/question-history.service';
import { finalize, Observable } from 'rxjs';
import { HttpLoadingIndicatorComponent } from './shared/http-loading-indicator/http-loading-indicator.component';

@Component({
  selector: 'app-root', standalone: true,
  imports: [HeaderComponent, SidebarComponent, ProjectOverviewComponent, QuestionInputComponent, AnswerComponent, HttpLoadingIndicatorComponent],
  template: `
    <app-http-loading-indicator />
    <app-header [menuOpen]="menuOpen()" (menuToggle)="toggleMenu()" />
    <div class="shell">
      <app-sidebar [projects]="projects()" [selectedId]="selectedId()" [open]="menuOpen()" (selected)="selectProject($event)" />
      @if(menuOpen()){<button class="mobile-backdrop" [attr.aria-label]="language.t('closeNavigation')" (click)="menuOpen.set(false)"></button>}
      <main>
        @if(projectsLoading()){<section class="fatal" role="status"><p>{{language.t('loadingProjects')}}</p></section>}
        @else if(error() && !projects().length){<section class="fatal"><span>!</span><h2>{{language.t('unableConnect')}}</h2><p>{{error()}}</p><button type="button" (click)="loadProjects()">{{language.t('tryAgain')}}</button></section>}
        @else if(!projects().length){<section class="fatal" role="status"><h2>{{language.t('noCodexProjects')}}</h2><p>{{language.t('noCodexProjectsHint')}}</p><button type="button" (click)="loadProjects()">{{language.t('refreshProjects')}}</button></section>}
        @else if(!selectedId()){
          <section class="project-prompt" role="status">
            <span aria-hidden="true">▦</span>
            <h2>{{language.t('chooseProject')}}</h2>
            <p>{{language.t('chooseProjectHint')}}</p>
          </section>
        }
        @else {<div class="content">
          <app-question-input [projectName]="scopeName()" [resetKey]="selectedId()" [loading]="loading()" [mode]="searchMode()" [history]="recentQuestions()" [historyPersistent]="questionHistory.persistent()" (historyCleared)="clearQuestionHistory()" (modeChanged)="searchMode.set($event)" (asked)="ask($event)" />
          @if(error()){<div class="error-banner" role="alert"><span>!</span><p>{{error()}}</p>@if(lastIntegration()){<button type="button" (click)="openIntegration(lastIntegration())">{{language.t('tryAgain')}}</button>}@else if(lastQuestion()){<button type="button" (click)="ask(lastQuestion(), lastSearchMode())">{{language.t('retryQuestion')}}</button>}</div>}
          <div id="results-region">
            @if(answer() && !loading()){
              <div class="result-context"><button class="back-overview" type="button" (click)="showOverview()"><span aria-hidden="true">{{language.isArabic()?'→':'←'}}</span>{{language.t('backToOverview')}}</button><div><small>{{language.t(lastIntegration()?'integrationDetails':'answerFor')}}</small><p dir="auto">{{lastIntegration() || answer()?.question || lastQuestion()}}</p></div></div>
              <app-answer [answer]="answer()" />
            }
            @if(!answer() && !loading()){
              @if(overviewLoading()){<p role="status">{{language.t('loadingOverview')}}</p>}
              @else if(overviewError()){<div class="error-banner overview-error" role="alert"><span>!</span><p>{{overviewError()}}</p><button type="button" (click)="selectProject(selectedId())">{{language.t('tryAgain')}}</button></div>}
              @else {
                @if(overviewRefreshError()){<div class="error-banner overview-refresh-error" role="alert"><span>!</span><p>{{language.t('overviewRefreshFailed')}} {{overviewRefreshError()}}</p><button type="button" [disabled]="overviewRefreshing()" (click)="refreshOverview()">{{language.t('tryAgain')}}</button></div>}
                <app-project-overview [project]="selectedProject()" [refreshing]="overviewRefreshing()" (refreshRequested)="refreshOverview()" (integrationSelected)="openIntegration($event)" />
              }
            }
          </div>
        </div>}
      </main>
    </div>`,
  styleUrl: './app.component.scss'
})
/** Coordinates project selection, repository questions, loading, and top-level error state. */
export class AppComponent implements OnInit {
  private readonly api = inject(KnowledgeApiService);
  readonly questionHistory = inject(QuestionHistoryService);
  readonly language = inject(LanguageService);
  readonly projectsLoading = signal(false);
  readonly projects = signal<Project[]>([]); readonly selectedId = signal(''); readonly selectedProject = signal<Project | null>(null);
  readonly answer = signal<KnowledgeAnswer | null>(null); readonly loading = signal(false); readonly error = signal(''); readonly menuOpen = signal(false);
  readonly searchMode = signal<SearchMode>('basic');
  readonly lastSearchMode = signal<SearchMode>('basic');
  readonly lastQuestion = signal('');
  readonly lastIntegration = signal('');
  readonly overviewLoading = signal(false);
  readonly overviewError = signal('');
  readonly overviewRefreshing = signal(false);
  readonly overviewRefreshError = signal('');
  private selectionVersion = 0;
  readonly scopeName = computed(() => this.selectedId() === 'all' ? this.language.t('allProjects') : this.selectedProject()?.name || '');
  readonly recentQuestions = computed(() => this.questionHistory.forProject(this.selectedId()));
  ngOnInit(): void { this.loadProjects(); }
  toggleMenu(): void { this.menuOpen.update(value => !value); }
  loadProjects(): void { if(this.projectsLoading()) return; this.projectsLoading.set(true); this.error.set(''); this.api.getProjects().pipe(finalize(()=>this.projectsLoading.set(false))).subscribe({
    next: projects => { this.projects.set(projects); this.clearSelection(); },
    error: response => { this.projects.set([]); this.clearSelection(); this.error.set(response.error?.message || this.language.t('connectError')); }
  }); }
  private clearSelection(): void {
    this.loading.set(false);
    this.selectionVersion++; this.overviewLoading.set(false); this.overviewError.set(''); this.overviewRefreshing.set(false); this.overviewRefreshError.set('');
    this.selectedId.set(''); this.selectedProject.set(null); this.answer.set(null); this.lastQuestion.set(''); this.lastIntegration.set('');
  }
  selectProject(projectId: string): void {
    const version = ++this.selectionVersion;
    this.loading.set(false);
    this.selectedId.set(projectId); this.answer.set(null); this.error.set(''); this.lastIntegration.set(''); this.lastQuestion.set(''); this.menuOpen.set(false);
    this.overviewLoading.set(true); this.overviewError.set('');
    this.overviewRefreshing.set(false); this.overviewRefreshError.set('');
    this.selectedProject.set(this.projects().find(project => project.id === projectId) || null);
    // Late responses from a previous selection must never replace the current project's overview.
    this.api.getProject(projectId).subscribe({
      next: project => { if (version === this.selectionVersion) { this.selectedProject.set(project); this.overviewLoading.set(false); } },
      error: response => { if (version === this.selectionVersion) { this.overviewError.set(response.error?.message || this.language.t('overviewError')); this.overviewLoading.set(false); } }
    });
  }
  refreshOverview(): void {
    if (!this.selectedId() || !this.selectedProject() || this.overviewLoading() || this.overviewRefreshing() || this.loading()) return;
    const version = this.selectionVersion;
    this.overviewRefreshing.set(true); this.overviewRefreshError.set('');
    // Keep the last successful snapshot visible until the replacement is ready.
    this.api.refreshProjectOverview(this.selectedId()).subscribe({
      next: project => { if (version === this.selectionVersion) { this.selectedProject.set(project); this.overviewRefreshing.set(false); } },
      error: response => { if (version === this.selectionVersion) { this.overviewRefreshError.set(response.error?.message || this.language.t('overviewError')); this.overviewRefreshing.set(false); } }
    });
  }
  ask(question: string, mode: SearchMode = this.searchMode()): void {
    question = question.trim();
    if (!this.selectedId() || this.loading() || !question) return;
    this.questionHistory.remember(this.selectedId(), question, mode);
    this.lastSearchMode.set(mode);
    this.lastIntegration.set(''); this.lastQuestion.set(question);
    this.requestAnswer(this.api.ask(this.selectedId(), question, this.language.current(), mode));
  }
  clearQuestionHistory(): void { if (!this.loading()) this.questionHistory.clear(this.selectedId()); }
  openIntegration(name: string): void {
    if (!this.selectedId() || this.loading()) return;
    this.lastQuestion.set(''); this.lastIntegration.set(name);
    this.requestAnswer(this.api.getIntegrationDetails(this.selectedId(), name, this.language.current()));
  }
  /** Return to the retained snapshot without another HTTP or model request. */
  showOverview(): void {
    if(this.loading()) return;
    this.answer.set(null); this.error.set(''); this.lastQuestion.set(''); this.lastIntegration.set(''); this.scrollToResults();
  }
  // Questions and integration details share the same loading, result and error lifecycle.
  private requestAnswer(request: Observable<KnowledgeAnswer>): void {
    const version = this.selectionVersion;
    this.loading.set(true); this.error.set(''); this.answer.set(null); this.scrollToResults();
    request.pipe(
      finalize(() => { if(version === this.selectionVersion){this.loading.set(false); this.scrollToResults();} })
    ).subscribe({
      next: answer => { if(version === this.selectionVersion) this.answer.set(answer); },
      error: response => { if(version === this.selectionVersion) this.error.set(response.error?.message || this.language.t('analysisError')); }
    });
  }
  private scrollToResults(): void { window.setTimeout(() => document.querySelector('#results-region')?.scrollIntoView({ behavior: 'smooth', block: 'start' })); }
}
