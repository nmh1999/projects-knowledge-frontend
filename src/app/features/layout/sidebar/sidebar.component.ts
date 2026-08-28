import { Component, computed, inject, input, output, signal } from '@angular/core';
import { Project } from '../../../core/models/project.model';
import { LanguageService } from '../../../core/services/language.service';

@Component({ selector:'app-sidebar', standalone:true, template:`
  <aside id="project-navigation" class="sidebar" [class.open]="open()">
    <div class="sidebar-title"><span>{{language.t('projectsLabel')}}</span><small>{{language.count('projects', projects().length)}}</small></div>
    <div class="project-search"><span aria-hidden="true">⌕</span><input type="search" [value]="query()" (input)="updateQuery($event)" [placeholder]="language.t('searchProjects')" [attr.aria-label]="language.t('searchProjects')">@if(query()){<button type="button" [attr.aria-label]="language.t('clearProjectSearch')" (click)="query.set('')">×</button>}</div>
    <nav [attr.aria-label]="language.t('projectsLabel')">@for(project of filteredProjects();track project.id){<button type="button" class="project-item" [class.active]="selectedId()===project.id" [attr.aria-current]="selectedId()===project.id?'true':null" [title]="project.name" (click)="selected.emit(project.id)"><span class="project-icon" aria-hidden="true">{{initials(project.name)}}</span><span class="project-copy"><strong><bdi dir="auto">{{project.name}}</bdi></strong><small>{{language.count('repositories',project.repositories.length)}}</small></span><span class="chevron" aria-hidden="true">›</span></button>}@empty{<p class="empty-projects" role="status">{{language.t('noProjectsFound')}}</p>}</nav>
    <div class="divider"></div><button type="button" class="project-item all" [disabled]="!projects().length" [class.active]="selectedId()==='all'" [attr.aria-current]="selectedId()==='all'?'true':null" (click)="selected.emit('all')"><span class="project-icon grid" aria-hidden="true">⌘</span><span class="project-copy"><strong>{{language.t('allProjects')}}</strong><small>{{language.t('crossProjectSearch')}}</small></span></button>
    <div class="read-only"><span>✓</span><div><strong>{{language.t('readOnly')}}</strong><small>{{language.t('protected')}}</small></div></div>
  </aside>`, styleUrl:'./sidebar.component.scss' })
export class SidebarComponent {
  readonly language = inject(LanguageService);
  readonly projects = input<Project[]>([]);
  readonly selectedId = input('');
  readonly open = input(false);
  readonly selected = output<string>();
  readonly query = signal('');
  readonly filteredProjects = computed(() => {
    const query = this.query().trim().toLocaleLowerCase();
    return query ? this.projects().filter(project => project.name.toLocaleLowerCase().includes(query)) : this.projects();
  });

  updateQuery(event: Event): void { this.query.set((event.target as HTMLInputElement).value); }
  initials(name: string): string { return name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase(); }
}
