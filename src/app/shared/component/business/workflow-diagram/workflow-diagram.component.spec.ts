import {TestBed} from '@angular/core/testing';
import {DtoWorkflowDiagram} from '@shared/schema/response/knowledge/DtoWorkflowDiagram';
import {LanguageService} from '@shared/service/language.service';
import {ThemeService} from '@shared/service/theme.service';
import {WorkflowDiagramComponent} from '@shared/component/business/workflow-diagram/workflow-diagram.component';
import {layoutWorkflow, NODE_HEIGHT, NODE_WIDTH} from '@shared/utils/workflow/workflow-layout';
import {pngDimensions, serializeWorkflowSvg, workflowPng} from '@shared/utils/workflow/workflow-export';
import {createWorkflowScene} from '@shared/utils/workflow/workflow-scene';

const graph: DtoWorkflowDiagram = {
  nodes: [
    {id: 'start', title: 'Submit request', actor: 'APPLICANT', type: 'start'},
    {id: 'review', title: 'Review request', actor: 'REVIEWER', type: 'decision'},
    {id: 'approved', title: 'Approved', actor: '', type: 'end'},
    {id: 'rejected', title: 'Rejected', actor: '', type: 'end'}
  ],
  edges: [
    {from: 'start', to: 'review', label: 'Submit'},
    {from: 'review', to: 'approved', label: 'Approve'},
    {from: 'review', to: 'rejected', label: 'Reject'},
    {from: 'review', to: 'start', label: 'Return'}
  ]
};

describe('Workflow graph layout', () => {
  const merged: DtoWorkflowDiagram = {
    nodes: [
      {id: 's', title: 'Submit', actor: 'Applicant', type: 'start'},
      {id: 'd', title: 'Extra review needed?', actor: 'Reviewer', type: 'decision'},
      {id: 'fast', title: 'Standard review', actor: 'Reviewer', type: 'action'},
      {id: 'slow', title: 'Special review', actor: 'Specialist', type: 'action'},
      {id: 'audit', title: 'Audit', actor: 'Auditor', type: 'action'},
      {id: 'merge', title: 'Prepare outcome', actor: 'System', type: 'action'},
      {id: 'end', title: 'Complete', actor: '', type: 'end'}
    ],
    edges: [
      {from: 's', to: 'd', label: ''},
      {from: 'd', to: 'fast', label: 'No'},
      {from: 'd', to: 'slow', label: 'Yes'},
      {from: 'fast', to: 'merge', label: 'Ready'},
      {from: 'slow', to: 'audit', label: ''},
      {from: 'audit', to: 'merge', label: 'Verified'},
      {from: 'merge', to: 'end', label: ''},
      {from: 'audit', to: 'd', label: 'Review again'},
      {from: 'd', to: 's', label: 'Return'}
    ]
  };

  it('places a merge after every upstream branch without misclassifying shortcuts as returns', () => {
    const layout = layoutWorkflow(merged);
    const node = (id: string) => layout.nodes.find((item) => item.id === id)!;
    expect(node('merge').rank).toBeGreaterThan(node('audit').rank);
    expect(node('merge').rank).toBeGreaterThan(node('fast').rank);
    expect(node('end').y).toBeGreaterThan(node('merge').y);
    expect(layout.edges.find((edge) => edge.from === 'fast' && edge.to === 'merge')!.loop).toBeFalse();
    expect(layout.edges.find((edge) => edge.from === 'audit' && edge.to === 'd')!.loop).toBeTrue();
    expect(layout.edges.map((edge) => [edge.from, edge.to])).toEqual(merged.edges.map((edge) => [edge.from, edge.to]));
  });

  it('keeps paths outside nodes and labels separated in both orientations and languages', () => {
    for (const orientation of ['vertical', 'horizontal'] as const)
      for (const rtl of [false, true]) {
        const scene = createWorkflowScene(merged, rtl, false, (key) => key, orientation);
        const overlaps = (
          a: {x: number; y: number; w: number; h: number},
          b: {x: number; y: number; w: number; h: number}
        ) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
        const nodes = scene.nodes.map((node) => ({x: node.x, y: node.y, w: scene.nodeWidth, h: scene.nodeHeight}));
        const labels = scene.edges
          .filter((edge) => edge.label)
          .map((edge) => ({
            x: edge.x - edge.labelWidth / 2,
            y: edge.y - edge.labelHeight / 2,
            w: edge.labelWidth,
            h: edge.labelHeight
          }));
        for (const [index, label] of labels.entries()) {
          expect(label.x).toBeGreaterThanOrEqual(0);
          expect(label.y).toBeGreaterThanOrEqual(0);
          expect(label.x + label.w).toBeLessThanOrEqual(scene.width);
          expect(label.y + label.h).toBeLessThanOrEqual(scene.height);
          expect(nodes.some((node) => overlaps(label, node))).toBeFalse();
          expect(labels.slice(index + 1).some((other) => overlaps(label, other))).toBeFalse();
        }
        for (const edge of scene.edges)
          for (let i = 1; i < edge.points.length; i++) {
            const a = edge.points[i - 1],
              b = edge.points[i];
            const route = {
              x: Math.min(a.x, b.x),
              y: Math.min(a.y, b.y),
              w: Math.abs(b.x - a.x),
              h: Math.abs(b.y - a.y)
            };
            expect(nodes.some((node) => overlaps(route, node))).toBeFalse();
          }
      }
  });

  it('gives each decision exit a distinct, stable color without changing transitions', () => {
    for (const dark of [false, true]) {
      const scene = createWorkflowScene(graph, false, dark, (key) => key);
      const mirrored = createWorkflowScene({...graph, edges: [...graph.edges].reverse()}, true, dark, (key) => key);
      const branches = scene.edges.filter((edge) => edge.from === 'review');
      expect(new Set(branches.map((edge) => edge.color)).size).toBe(3);
      expect(scene.edges.find((edge) => edge.from === 'start')!.color).toBe(scene.palette.accent);
      for (const edge of scene.edges) {
        expect(mirrored.edges.find((other) => other.from === edge.from && other.to === edge.to)!.color).toBe(
          edge.color
        );
      }
      expect(scene.edges.map((edge) => [edge.from, edge.to])).toEqual(graph.edges.map((edge) => [edge.from, edge.to]));
    }
  });

  it('preserves branches and cycles without inventing transitions', () => {
    const layout = layoutWorkflow(graph);
    expect(layout.edges.length).toBe(4);
    expect(layout.edges.map((edge) => [edge.from, edge.to])).toEqual(graph.edges.map((edge) => [edge.from, edge.to]));
    expect(layout.nodes.length).toBe(4);
    for (const edge of layout.edges) expect(edge.path).not.toMatch(/NaN|Infinity/);
    for (const node of layout.nodes) {
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.y).toBeGreaterThanOrEqual(0);
      expect(node.x + NODE_WIDTH).toBeLessThan(layout.width);
      expect(node.y + NODE_HEIGHT).toBeLessThan(layout.height);
    }
    expect(layoutWorkflow({nodes: graph.nodes, edges: []}).edges).toEqual([]);
  });

  it('mirrors the graph, but preserves transition direction for Arabic', () => {
    const ltr = layoutWorkflow(graph);
    const rtl = layoutWorkflow(graph, true);
    expect(rtl.nodes[0].x).toBe(ltr.width - ltr.nodes[0].x - NODE_WIDTH);
    expect(rtl.edges.map((edge) => [edge.from, edge.to])).toEqual(ltr.edges.map((edge) => [edge.from, edge.to]));
  });

  it('omits malformed graphs instead of drawing partial results', () => {
    expect(layoutWorkflow(undefined).nodes).toEqual([]);
    expect(layoutWorkflow({nodes: [graph.nodes[0], graph.nodes[0]], edges: []}).nodes).toEqual([]);
    expect(layoutWorkflow({...graph, edges: [{from: 'start', to: 'missing', label: ''}]}).nodes).toEqual([]);
  });

  it('supports disconnected nodes and self loops without hanging', () => {
    const layout = layoutWorkflow({...graph, edges: [{from: 'review', to: 'review', label: 'Retry'}]});
    expect(layout.nodes.length).toBe(4);
    expect(layout.edges.length).toBe(1);
    expect(layout.edges[0].path).not.toContain('NaN');
  });
});

describe('Workflow diagram rendering', () => {
  let savedTheme: string | undefined;
  let savedDirection: string;
  beforeEach(async () => {
    savedTheme = document.documentElement.dataset['theme'];
    savedDirection = document.documentElement.dir;
    await TestBed.configureTestingModule({imports: [WorkflowDiagramComponent]}).compileComponents();
  });
  afterEach(() => {
    if (savedTheme) document.documentElement.dataset['theme'] = savedTheme;
    else delete document.documentElement.dataset['theme'];
    document.documentElement.dir = savedDirection;
  });

  it('opens at readable scale and switches orientation without changing business transitions', () => {
    const fixture = TestBed.createComponent(WorkflowDiagramComponent);
    fixture.componentRef.setInput('diagram', graph);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const host = fixture.nativeElement as HTMLElement;
    host.style.width = '700px';
    component.fit('inline', true);
    fixture.detectChanges();
    expect(component.orientation()).toBe('vertical');
    expect(component.inlineScale()).toBeGreaterThanOrEqual(0.75);
    const original = component.scene().edges.map((edge) => [edge.from, edge.to]);
    host.querySelectorAll<HTMLButtonElement>('.orientation-controls button')[1].click();
    fixture.detectChanges();
    expect(component.scene().orientation).toBe('horizontal');
    expect(component.scene().edges.map((edge) => [edge.from, edge.to])).toEqual(original);
    expect(
      host.querySelectorAll<HTMLButtonElement>('.orientation-controls button')[1].getAttribute('aria-pressed')
    ).toBe('true');
    expect(host.querySelector('.decision-surface')).not.toBeNull();
    expect(host.querySelectorAll('.actor-chip').length).toBe(2);
    const edges = [...host.querySelectorAll('.edge-path')];
    component
      .scene()
      .edges.forEach((edge, index) =>
        expect(edges[index].getAttribute('stroke-dasharray')).toBe(edge.loop ? '6 5' : null)
      );
    component.fit('inline');
    fixture.detectChanges();
    expect(component.inlineScale()).toBeLessThan(0.75);
    host.querySelector<HTMLButtonElement>('.readable-button')!.click();
    fixture.detectChanges();
    expect(component.inlineScale()).toBeGreaterThanOrEqual(0.75);
  });

  for (const theme of ['light', 'dark'] as const)
    for (const language of ['en', 'ar'] as const) {
      it(`contains the diagram inside a narrow panel in ${theme}/${language}`, () => {
        const fixture = TestBed.createComponent(WorkflowDiagramComponent);
        TestBed.inject(LanguageService).current.set(language);
        TestBed.inject(ThemeService).current.set(theme);
        document.documentElement.dataset['theme'] = theme;
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
        fixture.componentRef.setInput('diagram', graph);
        const host = fixture.nativeElement as HTMLElement;
        host.style.width = '340px';
        fixture.detectChanges();
        const scroll = host.querySelector<HTMLElement>('.diagram-scroll')!;
        expect(scroll.scrollWidth).toBeGreaterThan(scroll.clientWidth);
        expect(host.scrollWidth).toBeLessThanOrEqual(host.clientWidth + 1);
        expect(host.querySelectorAll('.diagram-node').length).toBe(4);
        expect(host.querySelectorAll('.edge-path').length).toBe(4);
        expect(host.querySelectorAll('.edge-label').length).toBe(4);
        const svg = host.querySelector('svg')!;
        fixture.componentInstance.scene().edges.forEach((edge, index) => {
          const path = svg.querySelectorAll('.edge-path')[index];
          const marker = svg.querySelectorAll('marker')[index];
          const label = svg.querySelectorAll('.edge-label')[index];
          expect(path.getAttribute('stroke')).toBe(edge.color);
          expect(path.getAttribute('marker-end')).toBe(`url(#${marker.id})`);
          expect(marker.querySelector('path')!.getAttribute('fill')).toBe(edge.color);
          expect(label.querySelector('rect')!.getAttribute('stroke')).toBe(edge.color);
          expect(label.querySelector('text')!.getAttribute('fill')).toBe(edge.color);
        });
        expect(host.textContent).toContain('REVIEWER');
        expect(host.textContent).toContain('Return');
        expect(host.querySelector('.diagram-scroll')?.getAttribute('tabindex')).toBe('0');
        const node = host.querySelector('.node-surface')!;
        expect(node.getAttribute('fill')).toBe(theme === 'dark' ? '#102638' : '#ffffff');
        fixture.componentInstance.fit('inline');
        fixture.detectChanges();
        expect(scroll.scrollWidth).toBeLessThanOrEqual(scroll.clientWidth + 1);
      });
    }

  it('renders untrusted labels as text and wraps long titles within node bounds', () => {
    const fixture = TestBed.createComponent(WorkflowDiagramComponent);
    fixture.componentRef.setInput('diagram', {
      nodes: [{...graph.nodes[0], title: '<img src=x onerror=alert(1)>' + 'LongRole'.repeat(40)}],
      edges: []
    });
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('img')).toBeNull();
    for (const line of host.querySelectorAll<SVGTSpanElement>('.node-title tspan')) {
      expect(line.getComputedTextLength()).toBeLessThanOrEqual(NODE_WIDTH - 39);
    }
    expect(host.textContent).toContain('<img');
  });

  it('keeps multiline Arabic and English roles and branch conditions inside their shapes', () => {
    for (const language of ['en', 'ar'] as const) {
      const fixture = TestBed.createComponent(WorkflowDiagramComponent);
      TestBed.inject(LanguageService).current.set(language);
      const actor =
        language === 'ar'
          ? 'المسؤول عن مراجعة الطلب والتحقق من المستندات المرفقة'
          : 'Senior reviewer responsible for verifying the attached supporting documents';
      const label =
        language === 'ar'
          ? 'عند اكتمال جميع البيانات المطلوبة والموافقة على المستندات'
          : 'When all required information is complete and the documents are approved';
      fixture.componentRef.setInput('diagram', {
        ...graph,
        nodes: graph.nodes.map((node) => ({...node, actor})),
        edges: graph.edges.map((edge) => ({...edge, label}))
      });
      fixture.detectChanges();
      const host = fixture.nativeElement as HTMLElement;
      for (const group of host.querySelectorAll<SVGGElement>('.diagram-node')) {
        const chip = group.querySelector<SVGRectElement>('.actor-chip')!.getBBox();
        const text = group.querySelector<SVGTextElement>('.node-actor')!.getBBox();
        const title = group.querySelector<SVGTextElement>('.node-title')!.getBBox();
        expect(text.x).toBeGreaterThanOrEqual(chip.x);
        expect(text.x + text.width).toBeLessThanOrEqual(chip.x + chip.width);
        expect(text.y).toBeGreaterThanOrEqual(chip.y);
        expect(text.y + text.height).toBeLessThanOrEqual(chip.y + chip.height);
        expect(title.y + title.height).toBeLessThan(chip.y);
      }
      for (const group of host.querySelectorAll<SVGGElement>('.edge-label')) {
        const box = group.querySelector<SVGRectElement>('rect')!.getBBox();
        const text = group.querySelector<SVGTextElement>('text')!.getBBox();
        expect(text.x).toBeGreaterThanOrEqual(box.x);
        expect(text.x + text.width).toBeLessThanOrEqual(box.x + box.width);
        expect(text.y).toBeGreaterThanOrEqual(box.y);
        expect(text.y + text.height).toBeLessThanOrEqual(box.y + box.height);
      }
      fixture.destroy();
    }
  });

  it('opens a native modal, zooms, fits, closes with Escape and restores focus and scrolling', () => {
    const fixture = TestBed.createComponent(WorkflowDiagramComponent);
    fixture.componentRef.setInput('diagram', graph);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const trigger = host.querySelector<HTMLButtonElement>('.expand-button')!;
    const overflow = document.body.style.overflow;
    trigger.focus();
    trigger.click();
    fixture.detectChanges();
    const dialog = host.querySelector<HTMLDialogElement>('dialog')!;
    expect(dialog.open).toBeTrue();
    expect(dialog.contains(document.activeElement)).toBeTrue();
    expect(document.body.style.overflow).toBe('hidden');
    expect(dialog.querySelectorAll('.diagram-node').length).toBe(4);
    expect([...dialog.querySelectorAll('.edge-path')].map((path) => path.getAttribute('stroke'))).toEqual(
      fixture.componentInstance.scene().edges.map((edge) => edge.color)
    );
    const allMarkerIds = [...host.querySelectorAll('marker')].map((marker) => marker.id);
    expect(new Set(allMarkerIds).size).toBe(allMarkerIds.length);
    fixture.componentInstance.setZoom('modal', 10);
    fixture.detectChanges();
    expect(fixture.componentInstance.modalScale()).toBe(3);
    expect(dialog.querySelector<HTMLButtonElement>('.zoom-in')!.disabled).toBeTrue();
    fixture.componentInstance.setZoom('modal', 0);
    fixture.detectChanges();
    expect(fixture.componentInstance.modalScale()).toBe(0.1);
    dialog.querySelector<HTMLButtonElement>('.fit-button')!.click();
    fixture.detectChanges();
    const viewport = dialog.querySelector<HTMLElement>('.modal-viewport')!;
    expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth + 1);
    expect(viewport.scrollHeight).toBeLessThanOrEqual(viewport.clientHeight + 1);
    dialog
      .querySelector('button')!
      .dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true, cancelable: true}));
    fixture.detectChanges();
    expect(dialog.open).toBeFalse();
    expect(document.body.style.overflow).toBe(overflow);
    expect(document.activeElement).toBe(trigger);
    trigger.click();
    fixture.detectChanges();
    dialog.dispatchEvent(new Event('cancel', {cancelable: true}));
    fixture.detectChanges();
    expect(dialog.open).toBeFalse();
    trigger.click();
    fixture.detectChanges();
    fixture.destroy();
    expect(document.body.style.overflow).toBe(overflow);
  });

  it('pans a zoomed diagram with the pointer', () => {
    const fixture = TestBed.createComponent(WorkflowDiagramComponent);
    fixture.componentRef.setInput('diagram', graph);
    fixture.detectChanges();
    fixture.componentInstance.setZoom('inline', 3);
    fixture.detectChanges();
    const viewport = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.diagram-scroll')!;
    spyOn(viewport, 'setPointerCapture');
    spyOn(viewport, 'hasPointerCapture').and.returnValue(true);
    spyOn(viewport, 'releasePointerCapture');
    viewport.dispatchEvent(new PointerEvent('pointerdown', {pointerId: 1, clientX: 120, clientY: 100, button: 0}));
    viewport.dispatchEvent(new PointerEvent('pointermove', {pointerId: 1, clientX: 40, clientY: 60}));
    expect(viewport.scrollLeft).toBe(80);
    viewport.dispatchEvent(new PointerEvent('pointerup', {pointerId: 1}));
    expect(fixture.componentInstance.dragging()).toBeNull();
  });

  it('exports the entire Arabic SVG and a decodable PNG at any zoom', async () => {
    const fixture = TestBed.createComponent(WorkflowDiagramComponent);
    TestBed.inject(LanguageService).current.set('ar');
    TestBed.inject(ThemeService).current.set('dark');
    fixture.componentRef.setInput('diagram', {
      ...graph,
      nodes: graph.nodes.map((node) => ({...node, title: 'مراجعة الطلب', actor: 'مقدم الطلب'}))
    });
    fixture.detectChanges();
    fixture.componentInstance.setZoom('inline', 0.2);
    fixture.detectChanges();
    const scene = fixture.componentInstance.scene();
    const svg = (fixture.nativeElement as HTMLElement).querySelector<SVGSVGElement>('svg')!;
    const text = serializeWorkflowSvg(svg, scene.width, scene.height);
    const parsed = new DOMParser().parseFromString(text, 'image/svg+xml');
    expect(parsed.querySelector('parsererror')).toBeNull();
    expect(parsed.documentElement.getAttribute('width')).toBe(String(scene.width));
    expect(parsed.querySelectorAll('.diagram-node').length).toBe(4);
    expect(parsed.querySelector('foreignObject')).toBeNull();
    expect(text).toContain('مراجعة الطلب');
    expect(text).toContain('#102638');
    scene.edges.forEach((edge, index) => {
      expect(parsed.querySelectorAll('.edge-path')[index].getAttribute('stroke')).toBe(edge.color);
      expect(parsed.querySelectorAll('marker path')[index].getAttribute('fill')).toBe(edge.color);
    });
    const blob = await workflowPng(text, scene.width, scene.height);
    expect(blob.type).toBe('image/png');
    expect(blob.size).toBeGreaterThan(1000);
    const bitmap = await createImageBitmap(blob);
    const size = pngDimensions(scene.width, scene.height);
    expect(bitmap.width).toBe(size.width);
    expect(bitmap.height).toBe(size.height);
    bitmap.close();
    const download = spyOn(HTMLAnchorElement.prototype, 'click');
    await fixture.componentInstance.save('svg', 'inline');
    expect(download).toHaveBeenCalled();
    expect(fixture.componentInstance.downloadStarted()).toBeTrue();
  });

  it('reports export failures and always clears the saving state', async () => {
    const fixture = TestBed.createComponent(WorkflowDiagramComponent);
    fixture.componentRef.setInput('diagram', graph);
    fixture.detectChanges();
    spyOn(HTMLCanvasElement.prototype, 'toBlob').and.callFake((callback) => callback(null));
    await fixture.componentInstance.save('png', 'inline');
    expect(fixture.componentInstance.exportError()).toBeTrue();
    expect(fixture.componentInstance.exporting()).toBeNull();
  });

  it('bounds PNG memory without cropping large diagrams', () => {
    const size = pngDimensions(6000, 4000);
    expect(size.width * size.height).toBeLessThanOrEqual(16_000_000);
    expect(size.width / size.height).toBeCloseTo(1.5, 2);
  });
});
