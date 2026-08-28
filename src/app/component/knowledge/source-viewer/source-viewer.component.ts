import {Component, inject, input} from '@angular/core';
import {SourceService} from '@shared/service/integration/source/source.service';
import {DtoSourceContent} from '@shared/schema/response/source/DtoSourceContent';
import {DtoSourceReference} from '@shared/schema/response/source/DtoSourceReference';
import {LanguageService} from '@shared/service/language.service';

@Component({
  selector: 'app-source-viewer',
  standalone: true,
  templateUrl: './source-viewer.component.html',
  styleUrl: './source-viewer.component.scss'
})
export class SourceViewerComponent {
  private readonly api = inject(SourceService);
  readonly language = inject(LanguageService);
  readonly sources = input<DtoSourceReference[]>([]);
  selected: DtoSourceReference | null = null;
  content: DtoSourceContent | null = null;
  loading = false;
  error = '';
  open(source: DtoSourceReference) {
    this.selected = source;
    this.content = null;
    this.error = '';
    this.loading = true;
    this.api.getSource(source).subscribe({
      next: (value) => {
        this.content = value;
        this.loading = false;
      },
      error: (response) => {
        this.error = response.error?.message || this.language.t('sourceError');
        this.loading = false;
      }
    });
  }
  close() {
    this.selected = null;
    this.content = null;
  }
}
