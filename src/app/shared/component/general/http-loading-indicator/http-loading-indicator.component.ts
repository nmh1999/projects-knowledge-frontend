import {Component, inject} from '@angular/core';
import {HttpLoadingService} from '@shared/service/http-loading.service';
import {LanguageService} from '@shared/service/language.service';

@Component({
  selector: 'app-http-loading-indicator',
  standalone: true,
  templateUrl: './http-loading-indicator.component.html',
  styleUrl: './http-loading-indicator.component.scss'
})
export class HttpLoadingIndicatorComponent {
  readonly loading = inject(HttpLoadingService);
  readonly language = inject(LanguageService);
}
