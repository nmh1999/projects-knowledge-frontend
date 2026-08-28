import {Component, computed, inject, input, output, signal} from '@angular/core';
import {DtoProject} from '@shared/schema/response/project/DtoProject';
import {LanguageService} from '@shared/service/language.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  readonly language = inject(LanguageService);
  readonly projects = input<DtoProject[]>([]);
  readonly selectedId = input('');
  readonly open = input(false);
  readonly selected = output<string>();
  readonly refreshing = input(false);
  readonly refreshDisabled = input(false);
  readonly refreshError = input('');
  readonly refreshRequested = output<void>();
  readonly query = signal('');
  readonly filteredProjects = computed(() => {
    const query = this.query().trim().toLocaleLowerCase();
    return query
      ? this.projects().filter((project) => project.name.toLocaleLowerCase().includes(query))
      : this.projects();
  });

  updateQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }
  initials(name: string): string {
    return name
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
}
