import {Component, inject, input} from '@angular/core';
import {LanguageService} from '@shared/service/language.service';

@Component({
  selector: 'app-business-flow',
  standalone: true,
  templateUrl: './business-flow.component.html',
  styleUrl: './business-flow.component.scss'
})
export class BusinessFlowComponent {
  readonly language = inject(LanguageService);
  readonly steps = input<string[]>([]);
}
