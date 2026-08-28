import {Component, inject, input} from '@angular/core';
import {DtoFlowNode} from '@shared/schema/response/knowledge/DtoFlowNode';
import {LanguageService} from '@shared/service/language.service';

@Component({
  selector: 'app-technical-flow',
  standalone: true,
  templateUrl: './technical-flow.component.html',
  styleUrl: './technical-flow.component.scss'
})
export class TechnicalFlowComponent {
  readonly language = inject(LanguageService);
  readonly nodes = input<DtoFlowNode[]>([]);
  label(type: string) {
    const key =
      type === 'scheduler'
        ? 'scheduledJobsTitle'
        : type === 'integration'
          ? 'integrations'
          : type === 'database'
            ? 'database'
            : type === 'frontend'
              ? 'frontend'
              : type === 'entity'
                ? 'entity'
                : '';
    return key ? this.language.t(key) : type.replace('-', ' ');
  }
  icon(type: string) {
    return (
      (
        {
          frontend: '◇',
          'frontend-service': '⇢',
          api: '↗',
          controller: 'C',
          service: 'S',
          repository: 'R',
          entity: 'E',
          database: '▱',
          integration: '⌁',
          scheduler: '◷',
          messaging: '⇄',
          configuration: '⚙'
        } as Record<string, string>
      )[type] || '·'
    );
  }
}
