import {Component, effect, ElementRef, inject, input, output, ViewChild} from '@angular/core';
import {FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import {LanguageService} from '@shared/service/language.service';
import {SEARCH_MODES, SearchMode} from '@shared/enums/knowledge/SearchMode';
import {QuestionHistoryEntry} from '@shared/schema/general/QuestionHistoryEntry';
import {QUESTION_HISTORY_LIMIT} from '@shared/service/question-history.service';

@Component({
  selector: 'app-question-input',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './question-input.component.html',
  styleUrl: './question-input.component.scss'
})
export class QuestionInputComponent {
  readonly language = inject(LanguageService);
  readonly modes = SEARCH_MODES;
  readonly mode = input<SearchMode>('basic');
  readonly modeChanged = output<SearchMode>();
  readonly history = input<readonly QuestionHistoryEntry[]>([]);
  readonly historyPersistent = input(true);
  readonly historyCleared = output<void>();
  readonly historyRemoved = output<string>();
  readonly historyLimit = QUESTION_HISTORY_LIMIT;
  @ViewChild('questionField') private questionField?: ElementRef<HTMLTextAreaElement>;
  readonly projectName = input('this project');
  readonly resetKey = input('');
  readonly loading = input(false);
  readonly asked = output<string>();
  readonly question = new FormControl('', {nonNullable: true, validators: [Validators.required]});
  constructor() {
    effect(() => {
      this.resetKey();
      this.question.setValue('');
    });
  }
  clear(): void {
    this.question.setValue('');
  }
  /** Restore an editable draft and its format; only an explicit submit sends it again. */
  restore(entry: QuestionHistoryEntry): void {
    if (this.loading()) return;
    this.question.setValue(entry.question);
    this.modeChanged.emit(entry.mode);
    this.questionField?.nativeElement.focus();
  }
  trimQuestion(): string {
    const value = this.question.value.trim();
    if (value !== this.question.value) this.question.setValue(value);
    return value;
  }
  handleEnter(event: Event): void {
    const key = event as KeyboardEvent;
    if (!key.shiftKey && !key.isComposing && !key.repeat) this.submit(event);
  }
  submit(event: Event) {
    event.preventDefault();
    const value = this.trimQuestion();
    if (value && !this.loading()) this.asked.emit(value);
  }
}
