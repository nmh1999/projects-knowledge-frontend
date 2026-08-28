import { Component, computed, inject, input, OnChanges, output, signal, SimpleChanges } from '@angular/core';
import { Project } from '../../../core/models/project.model';
import { LanguageService } from '../../../core/services/language.service';

@Component({ selector:'app-project-overview', standalone:true, template:`
  @if(project();as item){
    <section class="overview">
      <div class="section-head"><div><span class="eyebrow">{{language.t('overviewAnalysis')}}</span><h2><bdi dir="auto">{{item.name}}</bdi> · {{language.t('overviewSuffix')}}</h2>
        <div class="overview-freshness">
          <span class="updated-at">{{language.t('overviewLastUpdated')}}:
            @if(updatedAt(); as timestamp){<time [attr.datetime]="timestamp.iso"><bdi>{{timestamp.label}}</bdi></time>}
            @else {<span>{{language.t('overviewDateUnavailable')}}</span>}
          </span>
          @if(updatedAt()){<span class="cache-note">{{language.t('overviewCacheNote')}}</span>}
          <button type="button" class="refresh-overview" [disabled]="refreshing()" [attr.aria-busy]="refreshing()" [title]="language.t('refreshOverviewHint')" (click)="refreshRequested.emit()">
            <span class="refresh-icon" [class.spinning]="refreshing()" aria-hidden="true">↻</span>{{language.t(refreshing() ? 'refreshingOverview' : 'refreshOverview')}}
          </button>
        </div>
      </div><span class="repo-count">{{language.count('repositories',item.repositories.length)}}</span></div>
      <div class="tech-grid">
        @for(group of technologyGroups(); track group.key){
          <article class="tech-card" [attr.data-category]="group.key" [attr.aria-label]="language.t(group.label)">
            <header class="tech-heading">
              <span class="tech-icon" aria-hidden="true">{{group.icon}}</span>
              <h3>{{language.t(group.label)}}</h3>
              <span class="tech-count" [attr.aria-label]="group.values.length + ' ' + language.t('technologies')">{{group.values.length}}</span>
            </header>
            <ul class="tech-list" [attr.aria-label]="language.t(group.label)">
              @for(value of group.values; track $index){<li class="tech-chip"><bdi dir="auto">{{value}}</bdi></li>}
            </ul>
          </article>
        }
      </div>
      @if(item.overview.domains.length){<div class="domain-block"><h3>{{language.t('detectedModules')}}</h3><div class="chips">@for(domain of item.overview.domains;track domain){<span>{{domain}}</span>}</div></div>}
      <div class="overview-columns">
        <div class="integrations-panel">
          <div class="integration-header">
            <div class="integration-intro">
              <div class="integration-title"><h3>{{language.t('repositoryIntegrations')}}</h3><span class="integration-count" role="status" [attr.aria-label]="language.t('integrations') + ': ' + filteredIntegrations().length + ' / ' + item.overview.integrations.length">@if(integrationQuery()){ {{filteredIntegrations().length}} / }{{item.overview.integrations.length}}</span></div>
              <p class="discovery-note">{{language.t('integrationDiscoveryNote')}}</p>
            </div>
            @if(item.overview.integrations.length){
              <label class="integration-search">
                <span aria-hidden="true">⌕</span><input type="search" [value]="integrationQuery()" (input)="searchIntegrations($event)" [placeholder]="language.t('searchIntegrations')" [attr.aria-label]="language.t('searchIntegrations')" />
                @if(integrationQuery()){<button type="button" [attr.aria-label]="language.t('clearIntegrationSearch')" (click)="integrationQuery.set('')">×</button>}
              </label>
            }
          </div>
          @if(filteredIntegrations().length){
            <ul class="integration-grid" [attr.aria-label]="language.t('repositoryIntegrations')">
              @for(value of filteredIntegrations();track value){
                <li><button type="button" class="integration-link" (click)="integrationSelected.emit(value)" [attr.aria-label]="language.t('viewIntegration') + ' ' + value">
                  <span class="integration-mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m10 13 4-4M8 15l-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2 3 1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0" transform="translate(1 1)"/></svg></span>
                  <bdi class="integration-name" dir="auto">{{value}}</bdi><span class="integration-chevron" aria-hidden="true">›</span>
                </button></li>
              }
            </ul>
          }@else {<p class="integration-empty" role="status">{{language.t(item.overview.integrations.length ? 'noMatchingIntegrations' : 'noIntegrationsFound')}}</p>}
        </div>
        <div class="repositories-panel"><h3>{{language.t('repositories')}}</h3><ul>@for(repo of item.repositories;track repo.id){<li><i [class.offline]="!repo.available"></i><span><bdi dir="auto">{{repo.name}}</bdi><small>{{language.t(repo.type.toLowerCase())}} · <bdi dir="auto">{{repo.languages.join(', ')}}</bdi></small></span></li>}</ul></div>
      </div>
    </section>
  }`, styleUrl:'./project-overview.component.scss' })
export class ProjectOverviewComponent implements OnChanges {
  readonly language = inject(LanguageService);
  readonly project = input<Project|null>(null);
  readonly integrationSelected = output<string>();
  readonly refreshing = input(false);
  readonly refreshRequested = output<void>();
  readonly integrationQuery = signal('');
  // Filtering only changes presentation; it never makes a backend or model request.
  readonly filteredIntegrations = computed(() => {
    const query = this.integrationQuery().trim().normalize('NFKC').toLocaleLowerCase();
    const integrations = this.project()?.overview.integrations ?? [];
    return query ? integrations.filter(name => name.normalize('NFKC').toLocaleLowerCase().includes(query)) : integrations;
  });

  ngOnChanges(changes: SimpleChanges): void {
    const project = changes['project'];
    if (project && project.previousValue?.id !== project.currentValue?.id) this.integrationQuery.set('');
  }

  searchIntegrations(event: Event): void { this.integrationQuery.set((event.target as HTMLInputElement).value); }
  readonly updatedAt = computed(() => {
    const value = this.project()?.overviewUpdatedAt;
    if (!value) return null;
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return null;
    const label = new Intl.DateTimeFormat(this.language.current() === 'ar' ? 'ar-SA' : 'en-GB', {
      calendar: 'gregory', dateStyle: 'medium', timeStyle: 'short'
    }).format(date);
    return { iso: date.toISOString(), label };
  });
  // Keep the original names intact; layout, not string joining, controls wrapping.
  readonly technologyGroups = computed(() => {
    const overview = this.project()?.overview;
    return [
      { key: 'frontend', label: 'frontend', icon: '◇', values: overview?.frontend ?? [] },
      { key: 'backend', label: 'backend', icon: '⌁', values: overview?.backend ?? [] },
      { key: 'databases', label: 'database', icon: '▱', values: overview?.databases ?? [] }
    ].filter(group => group.values.length > 0);
  });
}
