import {Component, inject, input, signal} from '@angular/core';
import {DtoKnowledgeAnswer} from '@shared/schema/response/knowledge/DtoKnowledgeAnswer';
import {BusinessFlowComponent} from '@component/knowledge/business-flow/business-flow.component';
import {WorkflowDiagramComponent} from '@shared/component/business/workflow-diagram/workflow-diagram.component';
import {TechnicalFlowComponent} from '@component/knowledge/technical-flow/technical-flow.component';
import {ApiListComponent} from '@component/knowledge/api-list/api-list.component';
import {DatabaseInfoComponent} from '@component/knowledge/database-info/database-info.component';
import {IntegrationsComponent} from '@component/knowledge/integrations/integrations.component';
import {ScheduledJobsComponent} from '@component/knowledge/scheduled-jobs/scheduled-jobs.component';
import {SourceViewerComponent} from '@component/knowledge/source-viewer/source-viewer.component';
import {LanguageService} from '@shared/service/language.service';

@Component({
  selector: 'app-answer',
  standalone: true,
  imports: [
    BusinessFlowComponent,
    WorkflowDiagramComponent,
    TechnicalFlowComponent,
    ApiListComponent,
    DatabaseInfoComponent,
    IntegrationsComponent,
    ScheduledJobsComponent,
    SourceViewerComponent
  ],
  templateUrl: './answer.component.html',
  styleUrl: './answer.component.scss'
})
/** Renders the structured Codex result and provides desktop clipboard actions per section. */
export class AnswerComponent {
  readonly language = inject(LanguageService);
  readonly answer = input<DtoKnowledgeAnswer | null>(null);
  readonly copiedTarget = signal<string | null>(null);
  readonly copyFailed = signal(false);
  private statusTimer?: number;

  async copyFullAnswer(result: DtoKnowledgeAnswer): Promise<void> {
    await this.copyText(this.formatAnswer(result), 'full');
  }

  async copySection(target: string, items: string[]): Promise<void> {
    const text = items.length === 1 ? items[0] : items.map((item, index) => `${index + 1}. ${item}`).join('\n');
    await this.copyText(text, target);
  }

  roleLines(result: DtoKnowledgeAnswer): string[] {
    return result.roles.map(
      (item) => `${item.role} — ${item.capability} (${this.language.t('evidence')}: ${item.evidence})`
    );
  }
  diagramLines(result: DtoKnowledgeAnswer): string[] {
    const graph = result.workflowDiagram;
    if (!graph?.nodes.length) return [];
    const titles = new Map(graph.nodes.map((node) => [node.id, node.title]));
    return [
      ...graph.nodes.map((node) => `${node.title}${node.actor ? ' — ' + node.actor : ''}`),
      ...graph.edges.map(
        (edge) => `${titles.get(edge.from)} → ${titles.get(edge.to)}${edge.label ? ' — ' + edge.label : ''}`
      )
    ];
  }
  technicalFlowLines(result: DtoKnowledgeAnswer): string[] {
    return result.technicalFlow.map((item) => `${item.type}: ${item.name} — ${item.detail}`);
  }
  technicalDetailLines(result: DtoKnowledgeAnswer): string[] {
    return result.technicalDetails.map(
      (item) => `${item.type}: ${item.name}${item.method ? `.${item.method}` : ''} — ${item.responsibility}`
    );
  }
  apiLines(result: DtoKnowledgeAnswer): string[] {
    return result.apis.map(
      (item) => `${item.method} ${item.path} — ${item.purpose} [${item.controller}.${item.methodName}]`
    );
  }
  databaseLines(result: DtoKnowledgeAnswer): string[] {
    return result.database.map((item) =>
      [
        `${item.table || item.entity || this.language.t('databaseUnknownTable')} — ${item.purpose}`,
        ...(item.entity ? [`${this.language.t('entity')}: ${item.entity}`] : []),
        ...(item.repository ? [`${this.language.t('databaseAccess')}: ${item.repository}`] : []),
        ...(item.columns?.length
          ? [`${this.language.t('databaseColumns')}:`, ...item.columns.map((value) => `  • ${value}`)]
          : []),
        ...(item.relationships?.length
          ? [`${this.language.t('databaseRelationships')}:`, ...item.relationships.map((value) => `  • ${value}`)]
          : [])
      ].join('\n')
    );
  }
  integrationLines(result: DtoKnowledgeAnswer): string[] {
    return result.integrations.map((item) => `${item.name} — ${item.purpose} [${item.usedBy}]`);
  }
  scheduledJobLines(result: DtoKnowledgeAnswer): string[] {
    return result.scheduledJobs.map(
      (item) => `${item.name} — ${item.purpose}${item.schedule ? ` [${item.schedule}]` : ''}`
    );
  }
  sourceLines(result: DtoKnowledgeAnswer): string[] {
    return result.sources.map(
      (item) =>
        `${item.repositoryName}/${item.filePath}:${item.startLine}-${item.endLine}${item.symbol ? ` — ${item.symbol}` : ''}`
    );
  }

  private async copyText(text: string, target: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.showCopied(target);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand('copy');
      textarea.remove();
      copied ? this.showCopied(target) : this.showCopyFailure();
    }
  }

  private formatAnswer(result: DtoKnowledgeAnswer): string {
    if (result.inScope !== true) return this.language.t('outOfScopeMessage');
    const lines = [
      `Projects Knowledge — ${result.project}`,
      `${this.language.t('questionLabel')}: ${result.question}`,
      '',
      `${this.language.t('summary')}:`,
      result.summary
    ];
    this.addSection(lines, this.language.t('keyFindings'), result.keyFindings);
    this.addSection(lines, this.language.t('rolesPermissions'), this.roleLines(result));
    this.addSection(lines, this.language.t('businessFlow'), result.businessFlow);
    this.addSection(lines, this.language.t('workflowDiagram'), this.diagramLines(result));
    if (result.workflowExample)
      this.addSection(lines, this.language.t('workflowExample'), [
        this.language.t('workflowExampleNote'),
        result.workflowExample
      ]);
    this.addSection(lines, this.language.t('technicalFlow'), this.technicalFlowLines(result));
    this.addSection(lines, this.language.t('apis'), this.apiLines(result));
    this.addSection(lines, this.language.t('database'), this.databaseLines(result));
    this.addSection(lines, this.language.t('integrations'), this.integrationLines(result));
    this.addSection(lines, this.language.t('scheduledJobsTitle'), this.scheduledJobLines(result));
    this.addSection(lines, this.language.t('technicalDetails'), this.technicalDetailLines(result));
    this.addSection(lines, this.language.t('risksCaveats'), result.risks);
    this.addSection(lines, this.language.t('suggestedQuestions'), result.followUpQuestions);
    this.addSection(lines, this.language.t('sourceEvidence'), this.sourceLines(result));
    return lines.join('\n');
  }

  private addSection(lines: string[], title: string, items: string[]): void {
    if (!items.length) return;
    lines.push('', `${title}:`, ...items.map((item, index) => `${index + 1}. ${item}`));
  }

  private showCopied(target: string): void {
    this.clearStatusTimer();
    this.copyFailed.set(false);
    this.copiedTarget.set(target);
    this.statusTimer = window.setTimeout(() => this.copiedTarget.set(null), 3000);
  }

  private showCopyFailure(): void {
    this.clearStatusTimer();
    this.copiedTarget.set(null);
    this.copyFailed.set(true);
    this.statusTimer = window.setTimeout(() => this.copyFailed.set(false), 3000);
  }

  private clearStatusTimer(): void {
    if (this.statusTimer !== undefined) window.clearTimeout(this.statusTimer);
  }
}
