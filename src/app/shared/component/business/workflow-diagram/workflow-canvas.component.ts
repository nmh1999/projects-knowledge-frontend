import {Component, input} from '@angular/core';
import {DIAGRAM_FONT, WorkflowScene} from '@shared/utils/workflow/workflow-scene';

let canvasSequence = 0;

/** One self-contained SVG for the page, expanded view and full-size exports. */
@Component({
  selector: 'app-workflow-canvas',
  standalone: true,
  templateUrl: './workflow-canvas.component.html',
  styleUrl: './workflow-canvas.component.scss'
})
export class WorkflowCanvasComponent {
  readonly scene = input.required<WorkflowScene>();
  readonly scale = input(1);
  readonly font = DIAGRAM_FONT;
  readonly markerId = `workflow-arrow-${++canvasSequence}`;
}
