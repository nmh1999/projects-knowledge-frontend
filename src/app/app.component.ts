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
import {ReqQuestion} from '@shared/schema/request/knowledge/ReqQuestion';
import {ReqIntegrationDetails} from '@shared/schema/request/knowledge/ReqIntegrationDetails';
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
  readonly projectsRefreshError = signal('');
  readonly projects = signal<DtoProject[]>([]);
  readonly selectedId = signal('');
  readonly selectedProject = signal<DtoProject | null>(null);
  readonly answer = signal<DtoKnowledgeAnswer | null>(null);
  readonly loading = signal(false);
  readonly answerRefreshing = signal(false);
  readonly answerRefreshError = signal('');
  readonly answerBusy = computed(() => this.loading() || this.answerRefreshing());
  private answerRequest:
    | {kind: 'question'; body: ReqQuestion}
    | {kind: 'integration'; body: ReqIntegrationDetails}
    | null = null;
  readonly answerUpdatedAt = computed(() => this.formatAnswerDate(this.answer()?.updatedAt));
  readonly answerExpiresAt = computed(() => this.formatAnswerDate(this.answer()?.expiresAt));
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
  loadProjects(refresh = false): void {
    if (this.projectsLoading()) return;
    if (refresh && (this.answerBusy() || this.overviewLoading() || this.overviewRefreshing())) return;
    this.projectsLoading.set(true);
    this.projectsRefreshError.set('');
    if (!refresh) this.error.set('');
    const request = refresh ? this.projectService.refreshProjects() : this.projectService.getProjects();
    request.pipe(finalize(() => this.projectsLoading.set(false))).subscribe({
      next: (projects) => {
        if (!refresh || !this.selectedId()) this.error.set('');
        this.projects.set(projects);
        // A catalog refresh must not discard the current answer or trigger a new overview analysis.
        if (!refresh || !projects.some((project) => project.id === this.selectedId())) this.clearSelection();
      },
      error: (response) => {
        if (refresh && this.projects().length) {
          this.projectsRefreshError.set(response.error?.message || this.language.t('connectError'));
          return;
        }
        this.projects.set([]);
        this.clearSelection();
        this.error.set(response.error?.message || this.language.t('connectError'));
      }
    });
  }
  private clearSelection(): void {
    this.resetAnswerRefresh();
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
    this.resetAnswerRefresh();
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
      this.answerBusy()
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
    if (!this.selectedId() || this.answerBusy() || !question) return;
    this.questionHistory.remember(this.selectedId(), question, mode);
    this.lastSearchMode.set(mode);
    this.lastIntegration.set('');
    this.lastQuestion.set(question);
    this.answerRequest = {
      kind: 'question',
      body: {projectId: this.selectedId(), question, language: this.language.current(), mode}
    };
    this.requestAnswer(this.questionService.ask(this.selectedId(), question, this.language.current(), mode));
  }
  clearQuestionHistory(): void {
    if (!this.answerBusy()) this.questionHistory.clear(this.selectedId());
  }
  removeQuestionHistory(question: string): void {
    if (!this.answerBusy()) this.questionHistory.remove(this.selectedId(), question);
  }
  openIntegration(name: string): void {
    if (!this.selectedId() || this.answerBusy()) return;
    this.lastQuestion.set('');
    this.lastIntegration.set(name);
    this.answerRequest = {
      kind: 'integration',
      body: {projectId: this.selectedId(), name, language: this.language.current()}
    };
    this.requestAnswer(this.integrationService.getIntegrationDetails(this.selectedId(), name, this.language.current()));
  }
  /** Return to the retained snapshot without another HTTP or model request. */
  showOverview(): void {
    if (this.answerBusy()) return;
    this.resetAnswerRefresh();
    this.answer.set(null);
    this.error.set('');
    this.lastQuestion.set('');
    this.lastIntegration.set('');
    this.scrollToResults();
  }
  /** Refresh the displayed answer's original context, never the current editable draft or picker. */
  refreshAnswer(): void {
    const original = this.answerRequest;
    if (!this.answer() || this.answerBusy() || !original || original.body.projectId !== this.selectedId()) return;
    const request =
      original.kind === 'question'
        ? this.questionService.refresh(original.body)
        : this.integrationService.refresh(original.body);
    this.requestAnswer(request, true);
  }
  private resetAnswerRefresh(): void {
    this.answerRequest = null;
    this.answerRefreshing.set(false);
    this.answerRefreshError.set('');
  }
  private formatAnswerDate(value: string | null | undefined): {iso: string; label: string} | null {
    if (!value) return null;
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return null;
    return {
      iso: date.toISOString(),
      label: new Intl.DateTimeFormat(this.language.isArabic() ? 'ar-SA' : 'en-GB', {
        calendar: 'gregory',
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(date)
    };
  }
  // Questions and integration details share the same loading, result and error lifecycle.
  private requestAnswer(request: Observable<DtoKnowledgeAnswer>, refresh = false): void {
    const version = this.selectionVersion;
    const busy = refresh ? this.answerRefreshing : this.loading;
    busy.set(true);
    this.error.set('');
    this.answerRefreshError.set('');
    if (!refresh) {
      this.answer.set(null);
      this.scrollToResults();
    }
    request
      .pipe(
        finalize(() => {
          if (version === this.selectionVersion) {
            busy.set(false);
            if (!refresh) this.scrollToResults();
          }
        })
      )
      .subscribe({
        next: (answer) => {
          if (version === this.selectionVersion) this.answer.set(answer);
        },
        error: (response) => {
          if (version === this.selectionVersion)
            (refresh ? this.answerRefreshError : this.error).set(
              response.error?.message || this.language.t('analysisError')
            );
        }
      });
  }
  private scrollToResults(): void {
    window.setTimeout(() =>
      document.querySelector('#results-region')?.scrollIntoView({behavior: 'smooth', block: 'start'})
    );
  }
}
