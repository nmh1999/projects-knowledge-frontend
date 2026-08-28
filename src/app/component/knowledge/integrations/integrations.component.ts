import {Component, inject, input} from '@angular/core';
import {DtoIntegrationInfo} from '@shared/schema/response/knowledge/DtoIntegrationInfo';
import {LanguageService} from '@shared/service/language.service';
@Component({
  selector: 'app-integrations',
  standalone: true,
  templateUrl: './integrations.component.html',
  styleUrl: './integrations.component.scss'
})
export class IntegrationsComponent {
  readonly language = inject(LanguageService);
  readonly items = input<DtoIntegrationInfo[]>([]);
}
