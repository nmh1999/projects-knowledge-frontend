import {Component, inject, input, OnDestroy} from '@angular/core';
import {Subscription} from 'rxjs';
import {RequestCancelledError} from '@shared/service/request-cancelled.error';
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
export class SourceViewerComponent implements OnDestroy {
  private request?: Subscription;
  private readonly api = inject(SourceService);
  readonly language = inject(LanguageService);
  readonly sources = input<DtoSourceReference[]>([]);
  selected: DtoSourceReference | null = null;
  content: DtoSourceContent | null = null;
  loading = false;
  error = '';
  open(source: DtoSourceReference) {
    this.request?.unsubscribe();
    this.selected = source;
    this.content = null;
    this.error = '';
    this.loading = true;
    this.request = this.api.getSource(source).subscribe({
      next: (value) => {
        this.content = value;
        this.loading = false;
      },
      error: (response) => {
        if (response instanceof RequestCancelledError) this.close();
        else this.error = response.error?.message || this.language.t('sourceError');
        this.loading = false;
      }
    });
  }
  close() {
    this.request?.unsubscribe();
    this.loading = false;
    this.selected = null;
    this.content = null;
  }
  ngOnDestroy() {
    this.request?.unsubscribe();
  }
}
