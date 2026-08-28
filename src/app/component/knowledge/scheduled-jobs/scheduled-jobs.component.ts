import {Component, inject, input} from '@angular/core';
import {DtoScheduledJobInfo} from '@shared/schema/response/knowledge/DtoScheduledJobInfo';
import {LanguageService} from '@shared/service/language.service';
@Component({
  selector: 'app-scheduled-jobs',
  standalone: true,
  templateUrl: './scheduled-jobs.component.html',
  styleUrl: './scheduled-jobs.component.scss'
})
export class ScheduledJobsComponent {
  readonly language = inject(LanguageService);
  readonly items = input<DtoScheduledJobInfo[]>([]);
}
