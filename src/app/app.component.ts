import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {HeaderComponent} from '@shared/layout/header/header.component';
import {SidebarComponent} from '@shared/layout/sidebar/sidebar.component';
import {ProjectOverviewComponent} from '@component/project/project-overview/project-overview.component';
import {QuestionInputComponent} from '@component/knowledge/question-input/question-input.component';
import {AnswerComponent} from '@component/knowledge/answer/answer.component';
import {ProjectService} from '@shared/service/integration/project/project.service';
import {QuestionService} from '@shared/service/integration/question/question.service';
import {IntegrationService} from '@shared/service/integration/integration/integration.service';
import {DtoProject} from '@shared/schema/response/project/DtoProject';
import {DtoKnowledgeAnswer} from '@shared/schema/response/knowledge/DtoKnowledgeAnswer';
import {SearchMode} from '@shared/enums/knowledge/SearchMode';
import {LanguageService} from '@shared/service/language.service';
import {QuestionHistoryService} from '@shared/service/question-history.service';
import {finalize, Observable} from 'rxjs';
import {HttpLoadingIndicatorComponent} from '@shared/component/general/http-loading-indicator/http-loading-indicator.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    HeaderComponent,
    SidebarComponent,
    ProjectOverviewComponent,
    QuestionInputComponent,
    AnswerComponent,
    HttpLoadingIndicatorComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
/** Coordinates project selection, repository questions, loading, and top-level error state. */
export class AppComponent implements OnInit {
  private readonly projectService = inject(ProjectService);
  private readonly questionService = inject(QuestionService);
  private readonly integrationService = inject(IntegrationService);
  readonly questionHistory = inject(QuestionHistoryService);
  readonly language = inject(LanguageService);
  readonly projectsLoading = signal(false);
  readonly projects = signal<DtoProject[]>([]);
  readonly selectedId = signal('');
  readonly selectedProject = signal<DtoProject | null>(null);
  readonly answer = signal<DtoKnowledgeAnswer | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly menuOpen = signal(false);
  readonly searchMode = signal<SearchMode>('basic');
  readonly lastSearchMode = signal<SearchMode>('basic');
  readonly lastQuestion = signal('');
  readonly lastIntegration = signal('');
  readonly overviewLoading = signal(false);
  readonly overviewError = signal('');
  readonly overviewRefreshing = signal(false);
  readonly overviewRefreshError = signal('');
  private selectionVersion = 0;
  readonly scopeName = computed(() =>
    this.selectedId() === 'all' ? this.language.t('allProjects') : this.selectedProject()?.name || ''
  );
  readonly recentQuestions = computed(() => this.questionHistory.forProject(this.selectedId()));
  ngOnInit(): void {
    this.loadProjects();
  }
  toggleMenu(): void {
    this.menuOpen.update((value) => !value);
  }
  loadProjects(): void {
    if (this.projectsLoading()) return;
    this.projectsLoading.set(true);
    this.error.set('');
    this.projectService
      .getProjects()
      .pipe(finalize(() => this.projectsLoading.set(false)))
      .subscribe({
        next: (projects) => {
          this.projects.set(projects);
          this.clearSelection();
        },
        error: (response) => {
          this.projects.set([]);
          this.clearSelection();
          this.error.set(response.error?.message || this.language.t('connectError'));
        }
      });
  }
  private clearSelection(): void {
    this.loading.set(false);
    this.selectionVersion++;
    this.overviewLoading.set(false);
    this.overviewError.set('');
    this.overviewRefreshing.set(false);
    this.overviewRefreshError.set('');
    this.selectedId.set('');
    this.selectedProject.set(null);
    this.answer.set(null);
    this.lastQuestion.set('');
    this.lastIntegration.set('');
  }
  selectProject(projectId: string): void {
    const version = ++this.selectionVersion;
    this.loading.set(false);
    this.selectedId.set(projectId);
    this.answer.set(null);
    this.error.set('');
    this.lastIntegration.set('');
    this.lastQuestion.set('');
    this.menuOpen.set(false);
    this.overviewLoading.set(true);
    this.overviewError.set('');
    this.overviewRefreshing.set(false);
    this.overviewRefreshError.set('');
    this.selectedProject.set(this.projects().find((project) => project.id === projectId) || null);
    // Late responses from a previous selection must never replace the current project's overview.
    this.projectService.getProject(projectId).subscribe({
      next: (project) => {
        if (version === this.selectionVersion) {
          this.selectedProject.set(project);
          this.overviewLoading.set(false);
        }
      },
      error: (response) => {
        if (version === this.selectionVersion) {
          this.overviewError.set(response.error?.message || this.language.t('overviewError'));
          this.overviewLoading.set(false);
        }
      }
    });
  }
  refreshOverview(): void {
    if (
      !this.selectedId() ||
      !this.selectedProject() ||
      this.overviewLoading() ||
      this.overviewRefreshing() ||
      this.loading()
    )
      return;
    const version = this.selectionVersion;
    this.overviewRefreshing.set(true);
    this.overviewRefreshError.set('');
    // Keep the last successful snapshot visible until the replacement is ready.
    this.projectService.refreshProjectOverview(this.selectedId()).subscribe({
      next: (project) => {
        if (version === this.selectionVersion) {
          this.selectedProject.set(project);
          this.overviewRefreshing.set(false);
        }
      },
      error: (response) => {
        if (version === this.selectionVersion) {
          this.overviewRefreshError.set(response.error?.message || this.language.t('overviewError'));
          this.overviewRefreshing.set(false);
        }
      }
    });
  }
  ask(question: string, mode: SearchMode = this.searchMode()): void {
    question = question.trim();
    if (!this.selectedId() || this.loading() || !question) return;
    this.questionHistory.remember(this.selectedId(), question, mode);
    this.lastSearchMode.set(mode);
    this.lastIntegration.set('');
    this.lastQuestion.set(question);
    this.requestAnswer(this.questionService.ask(this.selectedId(), question, this.language.current(), mode));
  }
  clearQuestionHistory(): void {
    if (!this.loading()) this.questionHistory.clear(this.selectedId());
  }
  openIntegration(name: string): void {
    if (!this.selectedId() || this.loading()) return;
    this.lastQuestion.set('');
    this.lastIntegration.set(name);
    this.requestAnswer(this.integrationService.getIntegrationDetails(this.selectedId(), name, this.language.current()));
  }
  /** Return to the retained snapshot without another HTTP or model request. */
  showOverview(): void {
    if (this.loading()) return;
    this.answer.set(null);
    this.error.set('');
    this.lastQuestion.set('');
    this.lastIntegration.set('');
    this.scrollToResults();
  }
  // Questions and integration details share the same loading, result and error lifecycle.
  private requestAnswer(request: Observable<DtoKnowledgeAnswer>): void {
    const version = this.selectionVersion;
    this.loading.set(true);
    this.error.set('');
    this.answer.set(null);
    this.scrollToResults();
    request
      .pipe(
        finalize(() => {
          if (version === this.selectionVersion) {
            this.loading.set(false);
            this.scrollToResults();
          }
        })
      )
      .subscribe({
        next: (answer) => {
          if (version === this.selectionVersion) this.answer.set(answer);
        },
        error: (response) => {
          if (version === this.selectionVersion)
            this.error.set(response.error?.message || this.language.t('analysisError'));
        }
      });
  }
  private scrollToResults(): void {
    window.setTimeout(() =>
      document.querySelector('#results-region')?.scrollIntoView({behavior: 'smooth', block: 'start'})
    );
  }
}
