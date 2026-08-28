import {Component, computed, inject, input, OnChanges, output, signal, SimpleChanges} from '@angular/core';
import {DtoProject} from '@shared/schema/response/project/DtoProject';
import {LanguageService} from '@shared/service/language.service';

@Component({
  selector: 'app-project-overview',
  standalone: true,
  templateUrl: './project-overview.component.html',
  styleUrl: './project-overview.component.scss'
})
export class ProjectOverviewComponent implements OnChanges {
  readonly language = inject(LanguageService);
  readonly project = input<DtoProject | null>(null);
  readonly integrationSelected = output<string>();
  readonly refreshing = input(false);
  readonly refreshRequested = output<void>();
  readonly integrationQuery = signal('');
  // Filtering only changes presentation; it never makes a backend or model request.
  readonly filteredIntegrations = computed(() => {
    const query = this.integrationQuery().trim().normalize('NFKC').toLocaleLowerCase();
    const integrations = this.project()?.overview.integrations ?? [];
    return query
      ? integrations.filter((name) => name.normalize('NFKC').toLocaleLowerCase().includes(query))
      : integrations;
  });

  ngOnChanges(changes: SimpleChanges): void {
    const project = changes['project'];
    if (project && project.previousValue?.id !== project.currentValue?.id) this.integrationQuery.set('');
  }

  searchIntegrations(event: Event): void {
    this.integrationQuery.set((event.target as HTMLInputElement).value);
  }
  readonly updatedAt = computed(() => {
    const value = this.project()?.overviewUpdatedAt;
    if (!value) return null;
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return null;
    const label = new Intl.DateTimeFormat(this.language.current() === 'ar' ? 'ar-SA' : 'en-GB', {
      calendar: 'gregory',
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
    return {iso: date.toISOString(), label};
  });
  // Keep the original names intact; layout, not string joining, controls wrapping.
  readonly technologyGroups = computed(() => {
    const overview = this.project()?.overview;
    return [
      {key: 'frontend', label: 'frontend', icon: '◇', values: overview?.frontend ?? []},
      {key: 'backend', label: 'backend', icon: '⌁', values: overview?.backend ?? []},
      {key: 'databases', label: 'database', icon: '▱', values: overview?.databases ?? []}
    ].filter((group) => group.values.length > 0);
  });
}
