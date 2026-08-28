import {Component, inject, input} from '@angular/core';
import {DtoApiInfo} from '@shared/schema/response/knowledge/DtoApiInfo';
import {LanguageService} from '@shared/service/language.service';
@Component({
  selector: 'app-api-list',
  standalone: true,
  templateUrl: './api-list.component.html',
  styleUrl: './api-list.component.scss'
})
export class ApiListComponent {
  readonly language = inject(LanguageService);
  readonly items = input<DtoApiInfo[]>([]);
}
