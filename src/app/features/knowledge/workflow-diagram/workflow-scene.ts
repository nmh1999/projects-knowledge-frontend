import { WorkflowDiagram } from '../../../core/models/workflow-diagram.model';
import { layoutWorkflow, NODE_HEIGHT, NODE_WIDTH, PositionedEdge, PositionedNode, WorkflowOrientation } from './workflow-layout';

export interface DiagramPalette { background: string; surface: string; border: string; ink: string; muted: string; accent: string; decision: string; decisionSurface: string; actorSurface: string; terminal: string; }
export interface SceneNode extends PositionedNode { heading: string; titleLines: string[]; actorLines: string[]; actorY: number; actorHeight: number; }
export interface SceneEdge extends PositionedEdge { lines: string[]; labelWidth: number; labelHeight: number; color: string; }
export interface WorkflowScene {
  width: number; height: number; nodeWidth: number; nodeHeight: number; rtl: boolean; title: string; orientation: WorkflowOrientation;
  palette: DiagramPalette; nodes: SceneNode[]; edges: SceneEdge[];
}
export const DIAGRAM_FONT = '"Segoe UI", Tahoma, Arial, sans-serif';

/** Wrap once for the on-screen SVG and both downloads, without cropping long role names. */
export function wrapDiagramText(text: string, width: number, font: string): string[] {
  const context = document.createElement('canvas').getContext('2d');
  if (!context) throw new Error('Canvas is unavailable');
  context.font = font;
  const lines: string[] = [];
  for (const paragraph of text.split(/\r?\n/)) {
    let line = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? line + ' ' + word : word;
      if (context.measureText(candidate).width <= width) { line = candidate; continue; }
      if (line) { lines.push(line); line = ''; }
      for (const character of word) {
        if (line && context.measureText(line + character).width > width) { lines.push(line); line = ''; }
        line += character;
      }
    }
    lines.push(line);
  }
  return lines.length ? lines : [''];
}

export function createWorkflowScene(graph: WorkflowDiagram | undefined, rtl: boolean, dark: boolean, translate: (key: string) => string, orientation: WorkflowOrientation = 'vertical'): WorkflowScene {
  const initial = layoutWorkflow(graph, rtl, undefined, orientation);
  const text = new Map(initial.nodes.map(node => [node.id, {
    titleLines: wrapDiagramText(node.title, NODE_WIDTH - 40, `600 15px ${DIAGRAM_FONT}`),
    actorLines: node.actor ? wrapDiagramText(node.actor, NODE_WIDTH - 52, `12px ${DIAGRAM_FONT}`) : []
  }]));
  const edgeText = new Map(initial.edges.map(edge => [JSON.stringify([edge.from, edge.to]),
    edge.label ? wrapDiagramText(edge.label, 130, `12px ${DIAGRAM_FONT}`) : []]));
  const nodeHeight = Math.max(NODE_HEIGHT, ...[...text.values()].map(value => 65 + value.titleLines.length * 21 + value.actorLines.length * 17));
  const labelHeight = Math.max(30, ...[...edgeText.values()].map(lines => lines.length * 17 + 14));
  const layout = layoutWorkflow(graph, rtl, { nodeHeight, labelWidth: 150, labelHeight }, orientation);
  const decisions = new Set(layout.nodes.filter(node => node.type === 'decision').map(node => node.id));
  const edgeKey = (edge: PositionedEdge) => JSON.stringify([edge.from, edge.to]);
  // Stable branch identities, independent of language, layout and edge order. Colors do not imply approval/rejection.
  const branchKeys = layout.edges.filter(edge => decisions.has(edge.from)).map(edgeKey).sort();
  const branchColors = new Map(branchKeys.map((key, index) => [key,
    `hsl(${Math.round((160 + index * 137.508) % 360)}, ${dark ? 72 : 68}%, ${dark ? 70 : 32}%)`]));
  return { ...layout, nodeWidth: NODE_WIDTH, nodeHeight, rtl, orientation, title: translate('workflowDiagram'),
    palette: dark
      ? { background: '#0b1e2e', surface: '#102638', border: '#35546b', ink: '#e6f0f7', muted: '#a9bdcc', accent: '#68b6e3', decision: '#edb55b', decisionSurface: '#302a20', actorSurface: '#19374c', terminal: '#78cbb0' }
      : { background: '#f4f8fc', surface: '#ffffff', border: '#cedeea', ink: '#172c3d', muted: '#5c7387', accent: '#247fab', decision: '#966318', decisionSurface: '#fff8e8', actorSurface: '#edf5fb', terminal: '#1d7c62' },
    nodes: layout.nodes.map(node => {
      const content = text.get(node.id)!;
      return { ...node, ...content, actorHeight: content.actorLines.length * 17 + 10,
        actorY: nodeHeight - content.actorLines.length * 17 - 24, heading: translate('diagramType_' + node.type) };
    }),
    edges: layout.edges.map(edge => {
      const lines = edgeText.get(JSON.stringify([edge.from, edge.to]))!;
      return { ...edge, lines, labelWidth: 150, labelHeight: lines.length * 17 + 14,
        color: branchColors.get(edgeKey(edge)) ?? (dark ? '#68b6e3' : '#247fab') };
    })
  };
}
