import { Component, inject, input, signal } from '@angular/core';
import { KnowledgeAnswer } from '../../../core/models/knowledge-answer.model';
import { BusinessFlowComponent } from '../business-flow/business-flow.component';
import { WorkflowDiagramComponent } from '../workflow-diagram/workflow-diagram.component';
import { TechnicalFlowComponent } from '../technical-flow/technical-flow.component';
import { ApiListComponent } from '../api-list/api-list.component';
import { DatabaseInfoComponent } from '../database-info/database-info.component';
import { IntegrationsComponent } from '../integrations/integrations.component';
import { ScheduledJobsComponent } from '../scheduled-jobs/scheduled-jobs.component';
import { SourceViewerComponent } from '../source-viewer/source-viewer.component';
import { LanguageService } from '../../../core/services/language.service';

@Component({selector:'app-answer',standalone:true,imports:[BusinessFlowComponent,WorkflowDiagramComponent,TechnicalFlowComponent,ApiListComponent,DatabaseInfoComponent,IntegrationsComponent,ScheduledJobsComponent,SourceViewerComponent],template:`
  @if(answer();as result){
    @if(result.inScope!==true){
      <section class="scope-notice" role="status"><div class="scope-icon" aria-hidden="true">!</div><div><h2>{{language.t('outOfScopeTitle')}}</h2><p>{{language.t('outOfScopeMessage')}}</p></div></section>
    } @else {<div class="answer-wrap"><div class="answer-toolbar"><nav class="answer-nav" [attr.aria-label]="language.t('answerNavigation')"><a href="#summary">{{language.t('summary')}}</a>@if(result.workflowDiagram?.nodes?.length){<a href="#workflow-diagram">{{language.t('workflowDiagram')}}</a>}@if(result.businessFlow.length){<a href="#flow">{{language.t('flow')}}</a>}@if(result.technicalDetails.length){<a href="#technical">{{language.t('technical')}}</a>}@if(result.apis.length){<a href="#api-details">{{language.t('apis')}}</a>}@if(result.database.length){<a href="#database-details">{{language.t('database')}}</a>}@if(result.integrations.length){<a href="#integration-details">{{language.t('integrations')}}</a>}@if(result.sources.length){<a href="#sources">{{language.t('sources')}}</a>}</nav><button type="button" class="copy-all-button" (click)="copyFullAnswer(result)" [attr.aria-label]="language.t('copyFullAnswer')"><span>↗</span>{{language.t('copyFullAnswer')}}</button></div>@if(copyStatus()){<div class="copy-status" role="status">✓ {{language.t(copyStatus()!)}}</div>}
    <section id="summary" class="card summary copy-card" [class.insufficient]="!result.enoughEvidence"><button class="section-copy" type="button" (click)="copySection(language.t('summary'),[result.summary,language.t('confidence')+': '+language.t('confidence_'+result.confidence)])">⧉ {{language.t('copySection')}}</button><div class="summary-icon">✦</div><div><span>{{language.t('groundedAnswer')}}</span><h2>{{language.t('summary')}}</h2><p>{{result.summary}}</p></div></section>
    @if(result.keyFindings.length){<section class="card result-section copy-card"><button class="section-copy" type="button" (click)="copySection(language.t('keyFindings'),result.keyFindings)">⧉ {{language.t('copySection')}}</button><h3>{{language.t('keyFindings')}}</h3><div class="finding-grid">@for(item of result.keyFindings;track item;let index=$index){<article><b>{{index+1}}</b><p>{{item}}</p></article>}</div></section>}
    @if(result.roles.length){<section class="card result-section copy-card"><button class="section-copy" type="button" (click)="copySection(language.t('rolesPermissions'),roleLines(result))">⧉ {{language.t('copySection')}}</button><h3>{{language.t('rolesPermissions')}}</h3><div class="roles-grid">@for(item of result.roles;track item.role+item.capability){<article><strong>{{item.role}}</strong><p><b>{{language.t('capability')}}:</b> {{item.capability}}</p><small><b>{{language.t('evidence')}}:</b> {{item.evidence}}</small></article>}</div></section>}
    @if(result.risks.length||result.followUpQuestions.length){<div class="insight-grid">@if(result.risks.length){<section class="card result-section caution copy-card"><button class="section-copy" type="button" (click)="copySection(language.t('risksCaveats'),result.risks)">⧉ {{language.t('copySection')}}</button><h3>{{language.t('risksCaveats')}}</h3><ul>@for(item of result.risks;track item){<li>{{item}}</li>}</ul></section>}@if(result.followUpQuestions.length){<section class="card result-section followups copy-card"><button class="section-copy" type="button" (click)="copySection(language.t('suggestedQuestions'),result.followUpQuestions)">⧉ {{language.t('copySection')}}</button><h3>{{language.t('suggestedQuestions')}}</h3><ul>@for(item of result.followUpQuestions;track item){<li>{{item}}</li>}</ul></section>}</div>}
    @if(result.businessFlow.length){<div id="flow" class="card copy-card"><button class="section-copy" type="button" (click)="copySection(language.t('businessFlow'),result.businessFlow)">⧉ {{language.t('copySection')}}</button><app-business-flow [steps]="result.businessFlow"/></div>}
    @if(result.workflowDiagram?.nodes?.length){<section id="workflow-diagram" class="card result-section diagram-section copy-card"><button class="section-copy" type="button" (click)="copySection(language.t('workflowDiagram'),diagramLines(result))">⧉ {{language.t('copyDiagramText')}}</button><h3>{{language.t('workflowDiagram')}}</h3><app-workflow-diagram [diagram]="result.workflowDiagram"/></section>}
    @if(result.workflowExample){<section id="workflow-example" class="card result-section workflow-example copy-card"><button class="section-copy" type="button" (click)="copySection(language.t('workflowExample'),[language.t('workflowExampleNote'),result.workflowExample])">⧉ {{language.t('copySection')}}</button><h3>{{language.t('workflowExample')}}</h3><small>{{language.t('workflowExampleNote')}}</small><p>{{result.workflowExample}}</p></section>}
    @if(result.technicalFlow.length){<div class="card copy-card"><button class="section-copy" type="button" (click)="copySection(language.t('technicalFlow'),technicalFlowLines(result))">⧉ {{language.t('copySection')}}</button><app-technical-flow [nodes]="result.technicalFlow"/></div>}
    @if(result.technicalDetails.length){<section id="technical" class="card technical copy-card"><button class="section-copy" type="button" (click)="copySection(language.t('technicalDetails'),technicalDetailLines(result))">⧉ {{language.t('copySection')}}</button><h3>{{language.t('technicalDetails')}}</h3><div class="technical-grid">@for(item of result.technicalDetails;track item.type+item.name){<article><span>{{item.type}}</span><strong>{{item.name}}</strong>@if(item.method){<code>{{item.method}}</code>}<p>{{item.responsibility}}</p></article>}</div></section>}
    @if(result.apis.length||result.database.length||result.integrations.length||result.scheduledJobs.length){<div id="details" class="detail-grid">@if(result.apis.length){<div id="api-details" class="card copy-card"><button class="section-copy" type="button" (click)="copySection(language.t('apis'),apiLines(result))">⧉ {{language.t('copySection')}}</button><app-api-list [items]="result.apis"/></div>}@if(result.database.length){<div id="database-details" class="card copy-card"><button class="section-copy" type="button" (click)="copySection(language.t('database'),databaseLines(result))">⧉ {{language.t('copySection')}}</button><app-database-info [items]="result.database"/></div>}@if(result.integrations.length){<div id="integration-details" class="card copy-card"><button class="section-copy" type="button" (click)="copySection(language.t('integrations'),integrationLines(result))">⧉ {{language.t('copySection')}}</button><app-integrations [items]="result.integrations"/></div>}@if(result.scheduledJobs.length){<div class="card copy-card"><button class="section-copy" type="button" (click)="copySection(language.t('scheduledJobsTitle'),scheduledJobLines(result))">⧉ {{language.t('copySection')}}</button><app-scheduled-jobs [items]="result.scheduledJobs"/></div>}</div>}
    @if(result.sources.length){<div id="sources" class="card copy-card"><button class="section-copy" type="button" (click)="copySection(language.t('sourceEvidence'),sourceLines(result))">⧉ {{language.t('copySection')}}</button><app-source-viewer [sources]="result.sources"/></div>}
  </div>}}`,styleUrl:'./answer.component.scss'})
/** Renders the structured Codex result and provides desktop clipboard actions per section. */
export class AnswerComponent {
  readonly language = inject(LanguageService);
  readonly answer = input<KnowledgeAnswer | null>(null);
  readonly copyStatus = signal<string | null>(null);

  async copyFullAnswer(result: KnowledgeAnswer): Promise<void> {
    await this.copyText(this.formatAnswer(result), 'answerCopied');
  }

  async copySection(title: string, items: string[]): Promise<void> {
    const text = [`${title}:`, ...items.map((item, index) => `${index + 1}. ${item}`)].join('\n');
    await this.copyText(text, 'sectionCopied');
  }

  roleLines(result: KnowledgeAnswer): string[] { return result.roles.map(item => `${item.role} — ${item.capability} (${this.language.t('evidence')}: ${item.evidence})`); }
  diagramLines(result: KnowledgeAnswer): string[] {
    const graph = result.workflowDiagram;
    if (!graph?.nodes.length) return [];
    const titles = new Map(graph.nodes.map(node => [node.id, node.title]));
    return [...graph.nodes.map(node => `${node.title}${node.actor ? ' — ' + node.actor : ''}`),
      ...graph.edges.map(edge => `${titles.get(edge.from)} → ${titles.get(edge.to)}${edge.label ? ' — ' + edge.label : ''}`)];
  }
  technicalFlowLines(result: KnowledgeAnswer): string[] { return result.technicalFlow.map(item => `${item.type}: ${item.name} — ${item.detail}`); }
  technicalDetailLines(result: KnowledgeAnswer): string[] { return result.technicalDetails.map(item => `${item.type}: ${item.name}${item.method ? `.${item.method}` : ''} — ${item.responsibility}`); }
  apiLines(result: KnowledgeAnswer): string[] { return result.apis.map(item => `${item.method} ${item.path} — ${item.purpose} [${item.controller}.${item.methodName}]`); }
  databaseLines(result: KnowledgeAnswer): string[] { return result.database.map(item => `${item.table || item.entity} — ${item.purpose} [${item.repository}]`); }
  integrationLines(result: KnowledgeAnswer): string[] { return result.integrations.map(item => `${item.name} — ${item.purpose} [${item.usedBy}]`); }
  scheduledJobLines(result: KnowledgeAnswer): string[] { return result.scheduledJobs.map(item => `${item.name} — ${item.purpose}${item.schedule ? ` [${item.schedule}]` : ''}`); }
  sourceLines(result: KnowledgeAnswer): string[] { return result.sources.map(item => `${item.repositoryName}/${item.filePath}:${item.startLine}-${item.endLine}${item.symbol ? ` — ${item.symbol}` : ''}`); }

  private async copyText(text: string, successKey: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.showStatus(successKey);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand('copy');
      textarea.remove();
      this.showStatus(copied ? successKey : 'copyFailed');
    }
  }

  private formatAnswer(result: KnowledgeAnswer): string {
    if (result.inScope !== true) return this.language.t('outOfScopeMessage');
    const lines = [
      `Projects Knowledge — ${result.project}`,
      `${this.language.t('questionLabel')}: ${result.question}`,
      '',
      `${this.language.t('summary')}:`,
      result.summary,
      `${this.language.t('confidence')}: ${this.language.t('confidence_' + result.confidence)}`
    ];
    this.addSection(lines, this.language.t('keyFindings'), result.keyFindings);
    this.addSection(lines, this.language.t('rolesPermissions'), this.roleLines(result));
    this.addSection(lines, this.language.t('businessFlow'), result.businessFlow);
    this.addSection(lines, this.language.t('workflowDiagram'), this.diagramLines(result));
    if (result.workflowExample) this.addSection(lines, this.language.t('workflowExample'), [this.language.t('workflowExampleNote'), result.workflowExample]);
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

  private showStatus(key: string): void {
    this.copyStatus.set(key);
    window.setTimeout(() => this.copyStatus.set(null), 3000);
  }
}
