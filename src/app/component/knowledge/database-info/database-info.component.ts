import {Component, inject, input} from '@angular/core';
import {DtoDatabaseInfo} from '@shared/schema/response/knowledge/DtoDatabaseInfo';
import {LanguageService} from '@shared/service/language.service';
@Component({
  selector: 'app-database-info',
  standalone: true,
  templateUrl: './database-info.component.html',
  styleUrl: './database-info.component.scss'
})
export class DatabaseInfoComponent {
  readonly language = inject(LanguageService);
  readonly items = input<DtoDatabaseInfo[]>([]);
}
