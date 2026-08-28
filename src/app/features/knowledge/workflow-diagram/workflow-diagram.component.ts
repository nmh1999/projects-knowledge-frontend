import { Component, computed, effect, ElementRef, inject, input, OnDestroy, signal, untracked, ViewChild } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { WorkflowDiagram } from '../../../core/models/workflow-diagram.model';
import { LanguageService } from '../../../core/services/language.service';
import { ThemeService } from '../../../core/services/theme.service';
import { WorkflowCanvasComponent } from './workflow-canvas.component';
import { createWorkflowScene } from './workflow-scene';
import { WorkflowOrientation } from './workflow-layout';
import { downloadWorkflow, serializeWorkflowSvg, workflowPng } from './workflow-export';

type DiagramView = 'inline' | 'modal';
type ExportFormat = 'png' | 'svg';
let diagramSequence = 0;

@Component({ selector: 'app-workflow-diagram', standalone: true, imports: [NgTemplateOutlet, WorkflowCanvasComponent],
  templateUrl: './workflow-diagram.component.html', styleUrl: './workflow-diagram.component.scss' })
export class WorkflowDiagramComponent implements OnDestroy {
  readonly language = inject(LanguageService);
  readonly theme = inject(ThemeService);
  readonly diagram = input<WorkflowDiagram>();
  readonly orientation = signal<WorkflowOrientation>('vertical');
  readonly scene = computed(() => createWorkflowScene(this.diagram(), this.language.isArabic(), this.theme.isDark(), key => this.language.t(key), this.orientation()));
  readonly inlineScale = signal(1);
  readonly modalScale = signal(1);
  readonly modalOpen = signal(false);
  readonly exporting = signal<ExportFormat | null>(null);
  readonly exportError = signal(false);
  readonly downloadStarted = signal(false);
  readonly dragging = signal<DiagramView | null>(null);
  readonly modalTitleId = 'workflow-dialog-' + ++diagramSequence;
  private viewports: Partial<Record<DiagramView, HTMLElement>> = {};
  private observers: Partial<Record<DiagramView, ResizeObserver>> = {};
  private autoFit: Record<DiagramView, 'readable' | 'all' | false> = { inline: 'readable', modal: 'readable' };
  private frames = new Set<number>();
  private previousOverflow: string | undefined;
  private returnFocus: HTMLElement | null = null;
  private destroyed = false;
  private pan: { pointer: number; x: number; y: number; left: number; top: number } | null = null;
  @ViewChild('modal') private modal?: ElementRef<HTMLDialogElement>;
  @ViewChild('inlineViewport') set inlineViewport(value: ElementRef<HTMLElement> | undefined) { this.observe('inline', value); }
  @ViewChild('modalViewport') set modalViewport(value: ElementRef<HTMLElement> | undefined) { this.observe('modal', value); }

  constructor() {
    effect(() => { this.diagram(); untracked(() => { this.closeModal(); this.autoFit.inline = 'readable'; this.exportError.set(false); this.downloadStarted.set(false); }); });
    effect(() => { this.scene(); untracked(() => this.nextFrame(() => { if (this.autoFit.inline) this.fit('inline', this.autoFit.inline === 'readable'); if (this.modalOpen() && this.autoFit.modal) this.fit('modal', this.autoFit.modal === 'readable'); })); });
  }

  changeOrientation(value: WorkflowOrientation): void {
    if (value === this.orientation()) return;
    this.autoFit.inline = 'readable'; this.autoFit.modal = 'readable'; this.orientation.set(value);
  }

  scale(view: DiagramView): number { return view === 'inline' ? this.inlineScale() : this.modalScale(); }
  percent(view: DiagramView): number { return Math.round(this.scale(view) * 100); }
  zoom(view: DiagramView, delta: number): void { this.setZoom(view, this.scale(view) + delta); }
  setZoom(view: DiagramView, scale: number): void {
    this.autoFit[view] = false;
    const viewport = this.viewports[view];
    const previous = this.scale(view);
    const next = Math.max(.1, Math.min(3, scale));
    const x = viewport ? viewport.scrollLeft + viewport.clientWidth / 2 : 0;
    const y = viewport ? viewport.scrollTop + viewport.clientHeight / 2 : 0;
    (view === 'inline' ? this.inlineScale : this.modalScale).set(next);
    this.nextFrame(() => { if (viewport) { viewport.scrollLeft = x * next / previous - viewport.clientWidth / 2; viewport.scrollTop = y * next / previous - viewport.clientHeight / 2; } });
  }

  fit(view: DiagramView, readable = false): void {
    const viewport = this.viewports[view];
    const graph = this.scene();
    if (!viewport?.clientWidth || !viewport.clientHeight || !graph.width || !graph.height) return;
    this.autoFit[view] = readable ? 'readable' : 'all';
    // Default to legible text and scrolling; fitting the whole graph is an explicit action.
    const scale = readable
      ? Math.max(.75, Math.min(1, (viewport.clientWidth - 48) / graph.width))
      : Math.max(.1, Math.min(1, (viewport.clientWidth - 48) / graph.width, (viewport.clientHeight - 48) / graph.height));
    (view === 'inline' ? this.inlineScale : this.modalScale).set(scale);
    this.nextFrame(() => {
      viewport.scrollLeft = readable && this.language.isArabic() ? viewport.scrollWidth - viewport.clientWidth : 0;
      viewport.scrollTop = 0;
    });
  }

  openModal(): void {
    const dialog = this.modal?.nativeElement;
    if (!dialog || dialog.open || !this.scene().nodes.length) return;
    this.returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    this.modalOpen.set(true); this.autoFit.modal = 'readable';
    dialog.showModal();
    this.nextFrame(() => this.fit('modal', true));
  }
  closeModal(event?: Event): void {
    event?.preventDefault();
    this.modal?.nativeElement.close();
    this.onModalClosed();
  }
  onModalClosed(): void {
    this.modalOpen.set(false); this.pan = null; this.dragging.set(null);
    if (this.previousOverflow !== undefined) { document.body.style.overflow = this.previousOverflow; this.previousOverflow = undefined; }
    if (this.returnFocus?.isConnected) this.returnFocus.focus();
    this.returnFocus = null;
  }
  backdropClick(event: MouseEvent): void {
    const dialog = this.modal?.nativeElement;
    if (event.target !== dialog || !dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) this.closeModal();
  }

  startPan(view: DiagramView, event: PointerEvent): void {
    if (event.button !== 0) return;
    const viewport = event.currentTarget as HTMLElement;
    this.pan = { pointer: event.pointerId, x: event.clientX, y: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop };
    viewport.setPointerCapture(event.pointerId); this.dragging.set(view);
  }
  movePan(event: PointerEvent): void {
    if (!this.pan || this.pan.pointer !== event.pointerId) return;
    const viewport = event.currentTarget as HTMLElement;
    viewport.scrollLeft = this.pan.left - (event.clientX - this.pan.x);
    viewport.scrollTop = this.pan.top - (event.clientY - this.pan.y);
  }
  endPan(event: PointerEvent): void {
    const viewport = event.currentTarget as HTMLElement;
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    this.pan = null; this.dragging.set(null);
  }
  wheel(view: DiagramView, event: WheelEvent): void {
    if (event.ctrlKey || event.metaKey) { event.preventDefault(); this.zoom(view, event.deltaY < 0 ? .1 : -.1); }
  }

  async save(format: ExportFormat, view: DiagramView): Promise<void> {
    if (this.exporting()) return;
    const source = this.viewports[view]?.querySelector<SVGSVGElement>('svg');
    const graph = this.scene();
    if (!source || !graph.nodes.length) return;
    this.exporting.set(format); this.exportError.set(false); this.downloadStarted.set(false);
    try {
      const text = serializeWorkflowSvg(source, graph.width, graph.height);
      await document.fonts.ready;
      const blob = format === 'svg' ? new Blob([text], { type: 'image/svg+xml;charset=utf-8' }) : await workflowPng(text, graph.width, graph.height);
      if (this.destroyed) return;
      downloadWorkflow(blob, 'workflow-' + new Date().toISOString().replace(/[:.]/g, '-') + '.' + format);
      this.downloadStarted.set(true);
    } catch { if (!this.destroyed) this.exportError.set(true); }
    finally { this.exporting.set(null); }
  }

  private observe(view: DiagramView, reference: ElementRef<HTMLElement> | undefined): void {
    this.observers[view]?.disconnect();
    this.viewports[view] = reference?.nativeElement;
    if (!reference) return;
    this.observers[view] = new ResizeObserver(() => this.nextFrame(() => { if (this.autoFit[view]) this.fit(view, this.autoFit[view] === 'readable'); }));
    this.observers[view]!.observe(reference.nativeElement);
  }
  private nextFrame(callback: () => void): void {
    if (this.destroyed) return;
    const id = requestAnimationFrame(() => { this.frames.delete(id); if (!this.destroyed) callback(); });
    this.frames.add(id);
  }
  ngOnDestroy(): void {
    this.destroyed = true; this.closeModal();
    Object.values(this.observers).forEach(observer => observer?.disconnect());
    this.frames.forEach(id => cancelAnimationFrame(id));
  }
}
