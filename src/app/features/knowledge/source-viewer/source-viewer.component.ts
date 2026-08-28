import { Component, inject, input } from '@angular/core';
import { KnowledgeApiService } from '../../../core/services/knowledge-api.service';
import { SourceContent, SourceReference } from '../../../core/models/knowledge-answer.model';
import { LanguageService } from '../../../core/services/language.service';

@Component({selector:'app-source-viewer',standalone:true,template:`
  <section class="sources"><div class="source-head"><div><h3>{{language.t('sourceEvidence')}}</h3><p>{{language.t('sourceSubtitle')}}</p></div><span>{{sources().length}} {{language.t('files')}}</span></div>
    <div class="source-grid">@for(source of sources();track $index){<button type="button" (click)="open(source)"><span class="file-icon">&lt;/&gt;</span><span class="file-copy"><strong>{{source.fileName}}</strong><small [title]="source.repositoryName + '/' + source.filePath">{{source.repositoryName}} · {{source.filePath}}</small><em>{{language.t('lines')}} {{source.startLine}}–{{source.endLine}} @if(source.symbol){· {{source.symbol}}}</em></span><b>{{language.t('viewCode')}} {{language.isArabic()?'←':'→'}}</b></button>}</div>
  </section>
  @if(selected){<div class="modal-backdrop" (click)="close()"><section class="code-modal" dir="ltr" (click)="$event.stopPropagation()"><header><div><strong>{{selected.fileName}}</strong><small>{{selected.repositoryName}} / {{selected.filePath}}</small></div><button type="button" [attr.aria-label]="language.t('close')" (click)="close()">×</button></header>@if(loading){<div class="code-loading">{{language.t('loadingLines')}}</div>}@else if(error){<div class="code-error">{{error}}</div>}@else if(content){<pre>@for(line of content.lines;track line.number){<code [class.highlight]="line.highlighted"><span>{{line.number}}</span>{{line.content}}</code>}</pre>}</section></div>}
  `,styleUrl:'./source-viewer.component.scss'})
export class SourceViewerComponent{
  private readonly api=inject(KnowledgeApiService);readonly language=inject(LanguageService);readonly sources=input<SourceReference[]>([]);selected:SourceReference|null=null;content:SourceContent|null=null;loading=false;error='';
  open(source:SourceReference){this.selected=source;this.content=null;this.error='';this.loading=true;this.api.getSource(source).subscribe({next:value=>{this.content=value;this.loading=false;},error:response=>{this.error=response.error?.message||this.language.t('sourceError');this.loading=false;}});}
  close(){this.selected=null;this.content=null;}
}
