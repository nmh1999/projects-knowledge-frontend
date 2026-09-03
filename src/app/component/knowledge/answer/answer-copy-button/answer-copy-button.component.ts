import {Component, input, output} from '@angular/core';

@Component({
  selector: 'app-answer-copy-button',
  standalone: true,
  templateUrl: './answer-copy-button.component.html',
  styleUrl: './answer-copy-button.component.scss'
})
export class AnswerCopyButtonComponent {
  readonly copied = input(false);
  readonly label = input.required<string>();
  readonly copiedLabel = input.required<string>();
  readonly activated = output<void>();
}
