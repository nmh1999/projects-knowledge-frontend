import { Component, effect, ElementRef, inject, input, output, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { LanguageService } from '../../../core/services/language.service';
import { SearchMode } from '../../../core/models/search-mode.model';
import { QuestionHistoryEntry } from '../../../core/services/question-history.service';

@Component({ selector:'app-question-input', standalone:true, imports:[ReactiveFormsModule], template:`
  <section class="ask-card">
    <header class="ask-copy"><h1>{{language.t('askAnything')}} <bdi dir="auto">{{projectName()}}</bdi></h1><p>{{language.t('searchHelp')}}</p></header>
    <form (submit)="submit($event)">
      <div class="mode-picker">
        <fieldset class="search-modes" [disabled]="loading()" aria-describedby="mode-hint">
          <legend>{{language.t('searchMode')}}</legend>
          <div class="mode-options">@for(option of modes;track option){
            <label [class.selected]="mode()===option"><input type="radio" name="search-mode" [value]="option" [checked]="mode()===option" (change)="modeChanged.emit(option)"><span>{{language.t(option+'Mode')}}</span></label>
          }</div>
        </fieldset>
        <p class="mode-hint" id="mode-hint">{{language.t(mode()+'Hint')}}</p>
      </div>
      <label class="sr-only" for="project-question">{{language.t('questionLabel')}}</label>
      <div class="question-field"><textarea #questionField id="project-question" dir="auto" [formControl]="question" rows="3" [placeholder]="language.t('questionPlaceholder')" (blur)="trimQuestion()" (keydown.enter)="handleEnter($event)"></textarea>@if(question.value){<button class="clear-question" type="button" (click)="clear()" [attr.aria-label]="language.t('clearQuestion')">×</button>}</div>
      <div class="form-foot">
        <button class="ask-button" type="submit" [disabled]="!question.value.trim()||loading()">@if(loading()){<i aria-hidden="true"></i><span>{{language.t('analyzingShort')}}</span>}@else{<span>{{language.t('askProject')}}</span>}</button>
      </div>
    </form>
  </section>
  <details class="question-history">
    <summary><span class="history-chevron" aria-hidden="true">›</span><span>{{language.t('recentQuestions')}}</span><span class="history-count"><bdi dir="ltr">{{history().length}} / 5</bdi></span></summary>
    <div class="history-body">
      @if(history().length){
        <div class="history-tools"><p>{{language.t('questionHistoryHint')}}</p><button type="button" class="clear-history" [disabled]="loading()" (click)="historyCleared.emit()">{{language.t('clearQuestionHistory')}}</button></div>
        <ol>
          @for(entry of history();track entry.question){<li><button type="button" class="history-question" [disabled]="loading()" [title]="entry.question" (click)="restore(entry)"><span class="history-text" dir="auto">{{entry.question}}</span><span class="history-mode">{{language.t(entry.mode+'Mode')}}</span><span class="history-restore" aria-hidden="true">↶</span></button></li>}
        </ol>
      } @else {<p class="history-empty">{{language.t('noRecentQuestions')}}</p>}
      <p class="history-note" [class.history-warning]="!historyPersistent()">{{language.t(historyPersistent()?'questionHistoryLocal':'questionHistoryTemporary')}}</p>
    </div>
  </details>`, styleUrl:'./question-input.component.scss' })
export class QuestionInputComponent {
  readonly language=inject(LanguageService);
  readonly modes: SearchMode[] = ['basic', 'advanced', 'workflow'];
  readonly mode=input<SearchMode>('basic');
  readonly modeChanged=output<SearchMode>();
  readonly history=input<readonly QuestionHistoryEntry[]>([]);
  readonly historyPersistent=input(true);
  readonly historyCleared=output<void>();
  @ViewChild('questionField') private questionField?:ElementRef<HTMLTextAreaElement>;
  readonly projectName=input('this project');readonly resetKey=input('');readonly loading=input(false);readonly asked=output<string>();
  readonly question=new FormControl('',{nonNullable:true,validators:[Validators.required]});
  constructor(){effect(()=>{this.resetKey();this.question.setValue('');});}
  clear():void{this.question.setValue('');}
  /** Restore an editable draft and its format; only an explicit submit sends it again. */
  restore(entry:QuestionHistoryEntry):void{
    if(this.loading())return;
    this.question.setValue(entry.question);this.modeChanged.emit(entry.mode);this.questionField?.nativeElement.focus();
  }
  trimQuestion():string{const value=this.question.value.trim();if(value!==this.question.value)this.question.setValue(value);return value;}
  handleEnter(event:Event):void{const key=event as KeyboardEvent;if(!key.shiftKey&&!key.isComposing&&!key.repeat)this.submit(event);}
  submit(event:Event){event.preventDefault();const value=this.trimQuestion();if(value&&!this.loading())this.asked.emit(value);}
}
