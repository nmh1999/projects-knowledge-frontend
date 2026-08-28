import {DtoWorkflowDiagram} from '@shared/schema/response/knowledge/DtoWorkflowDiagram';
import {DtoWorkflowEdge} from '@shared/schema/response/knowledge/DtoWorkflowEdge';
import {DtoWorkflowNode} from '@shared/schema/response/knowledge/DtoWorkflowNode';

export type WorkflowOrientation = 'vertical' | 'horizontal';
export interface Point {
  x: number;
  y: number;
}
export interface PositionedNode extends DtoWorkflowNode {
  x: number;
  y: number;
  rank: number;
}
export interface PositionedEdge extends DtoWorkflowEdge {
  path: string;
  points: Point[];
  x: number;
  y: number;
  description: string;
  loop: boolean;
}
export interface WorkflowLayout {
  nodes: PositionedNode[];
  edges: PositionedEdge[];
  width: number;
  height: number;
}
export const NODE_WIDTH = 248;
export const NODE_HEIGHT = 132;
export interface WorkflowGeometry {
  nodeHeight: number;
  labelWidth: number;
  labelHeight: number;
}

const edgeKey = (edge: DtoWorkflowEdge) => JSON.stringify([edge.from, edge.to]);

/** Round orthogonal corners without moving the endpoints or crossing node interiors. */
function roundedPath(points: Point[]): string {
  const clean = points.filter((p, i) => !i || p.x !== points[i - 1].x || p.y !== points[i - 1].y);
  let path = `M ${clean[0].x} ${clean[0].y}`;
  for (let i = 1; i < clean.length - 1; i++) {
    const previous = clean[i - 1],
      point = clean[i],
      next = clean[i + 1];
    const before = Math.hypot(point.x - previous.x, point.y - previous.y);
    const after = Math.hypot(next.x - point.x, next.y - point.y);
    const radius = Math.min(9, before / 2, after / 2);
    const x1 = point.x + ((previous.x - point.x) * radius) / before;
    const y1 = point.y + ((previous.y - point.y) * radius) / before;
    const x2 = point.x + ((next.x - point.x) * radius) / after;
    const y2 = point.y + ((next.y - point.y) * radius) / after;
    path += ` L ${x1} ${y1} Q ${point.x} ${point.y} ${x2} ${y2}`;
  }
  const end = clean[clean.length - 1];
  return path + ` L ${end.x} ${end.y}`;
}

/** Layout only: preserve every verified transition, including disconnected components and cycles. */
export function layoutWorkflow(
  graph: DtoWorkflowDiagram | undefined,
  rtl = false,
  geometry?: WorkflowGeometry,
  orientation: WorkflowOrientation = 'vertical'
): WorkflowLayout {
  const empty: WorkflowLayout = {nodes: [], edges: [], width: 0, height: 0};
  if (
    !graph ||
    !Array.isArray(graph.nodes) ||
    !graph.nodes.length ||
    !Array.isArray(graph.edges) ||
    graph.nodes.length > 10 ||
    graph.edges.length > 16
  )
    return empty;
  const ids = new Set<string>();
  for (const node of graph.nodes) {
    if (
      !node ||
      typeof node.id !== 'string' ||
      !node.id.trim() ||
      typeof node.title !== 'string' ||
      !node.title.trim() ||
      typeof node.actor !== 'string' ||
      ids.has(node.id) ||
      !['start', 'action', 'decision', 'end'].includes(node.type)
    )
      return empty;
    ids.add(node.id);
  }
  if (graph.edges.some((edge) => !edge || !ids.has(edge.from) || !ids.has(edge.to) || typeof edge.label !== 'string'))
    return empty;

  const pairs = new Map<string, DtoWorkflowEdge>();
  for (const edge of graph.edges) {
    const previous = pairs.get(edgeKey(edge));
    pairs.set(
      edgeKey(edge),
      previous ? {...edge, label: [...new Set([previous.label, edge.label].filter(Boolean))].join(' / ')} : {...edge}
    );
  }
  const edges = [...pairs.values()];
  const outgoing = (id: string) => edges.filter((edge) => edge.from === id).sort((a, b) => a.to.localeCompare(b.to));

  // Exclude DFS back edges only for ranking. They are still rendered as return routes.
  const visited = new Set<string>(),
    active = new Set<string>(),
    back = new Set<string>();
  const visit = (id: string) => {
    visited.add(id);
    active.add(id);
    for (const edge of outgoing(id)) {
      if (active.has(edge.to)) back.add(edgeKey(edge));
      else if (!visited.has(edge.to)) visit(edge.to);
    }
    active.delete(id);
  };
  const incoming = new Set(edges.map((edge) => edge.to));
  const roots = [...graph.nodes].sort((a, b) => {
    const priority = (node: DtoWorkflowNode) => (node.type === 'start' ? 0 : !incoming.has(node.id) ? 1 : 2);
    return priority(a) - priority(b);
  });
  roots.forEach((node) => {
    if (!visited.has(node.id)) visit(node.id);
  });
  const forward = edges.filter((edge) => !back.has(edgeKey(edge)));
  const remaining = new Map(graph.nodes.map((node) => [node.id, forward.filter((edge) => edge.to === node.id).length]));
  const ranks = new Map(graph.nodes.map((node) => [node.id, 0]));
  const queue = graph.nodes.filter((node) => remaining.get(node.id) === 0).map((node) => node.id);
  for (let index = 0; index < queue.length; index++) {
    const id = queue[index];
    for (const edge of forward.filter((edge) => edge.from === id)) {
      // Longest-path ranks place a merge after ALL its upstream branches, not the first one found.
      ranks.set(edge.to, Math.max(ranks.get(edge.to)!, ranks.get(id)! + 1));
      remaining.set(edge.to, remaining.get(edge.to)! - 1);
      if (!remaining.get(edge.to)) queue.push(edge.to);
    }
  }
  const groups = Array.from({length: Math.max(...ranks.values()) + 1}, (_, rank) =>
    graph.nodes.filter((node) => ranks.get(node.id) === rank)
  );
  const positions = new Map<string, number>();
  const updatePositions = () =>
    groups.forEach((group) => group.forEach((node, index) => positions.set(node.id, index - (group.length - 1) / 2)));
  updatePositions();
  // Barycentric sweeps align parents, branches and merges while keeping ties stable.
  for (let pass = 0; pass < 4; pass++) {
    const reverse = pass % 2 === 1;
    const layers = reverse ? [...groups].reverse() : groups;
    for (const layer of layers) {
      const score = (node: DtoWorkflowNode) => {
        const neighbors = forward
          .filter((edge) => (reverse ? edge.from === node.id : edge.to === node.id))
          .map((edge) => positions.get(reverse ? edge.to : edge.from)!);
        return neighbors.length
          ? neighbors.reduce((sum, value) => sum + value, 0) / neighbors.length
          : positions.get(node.id)!;
      };
      layer.sort((a, b) => score(a) - score(b));
      updatePositions();
    }
  }

  const vertical = orientation === 'vertical';
  const nodeHeight = geometry?.nodeHeight ?? NODE_HEIGHT;
  const labelWidth = geometry?.labelWidth ?? 150,
    labelHeight = geometry?.labelHeight ?? 28;
  const mainSize = vertical ? nodeHeight : NODE_WIDTH,
    crossSize = vertical ? NODE_WIDTH : nodeHeight;
  const labelMain = vertical ? labelHeight : labelWidth,
    labelCross = vertical ? labelWidth : labelHeight;
  const crossGap = 72,
    laneGap = labelCross + 28,
    padding = 40;
  const loops = edges.filter((edge) => ranks.get(edge.to)! <= ranks.get(edge.from)!);
  const skips = edges.filter((edge) => ranks.get(edge.to)! > ranks.get(edge.from)! + 1);
  const crossStart = padding + loops.length * laneGap;
  const crossSpan = Math.max(...groups.map((group) => group.length)) * (crossSize + crossGap) - crossGap;
  const crossExtent = crossStart + crossSpan + skips.length * laneGap + padding;
  const normal = edges.filter((edge) => ranks.get(edge.to)! === ranks.get(edge.from)! + 1);
  const transitions = groups.map((_, rank) =>
    normal
      .filter((edge) => ranks.get(edge.from) === rank)
      .sort((a, b) => {
        return positions.get(a.from)! - positions.get(b.from)! || positions.get(a.to)! - positions.get(b.to)!;
      })
  );
  const mainStarts = [padding];
  const gaps = groups.map((_, rank) => Math.max(76, transitions[rank].length * (labelMain + 12) + 32));
  for (let rank = 1; rank < groups.length; rank++) mainStarts.push(mainStarts[rank - 1] + mainSize + gaps[rank - 1]);
  const mainExtent = mainStarts[mainStarts.length - 1] + mainSize + padding;
  const width = vertical ? crossExtent : mainExtent,
    height = vertical ? mainExtent : crossExtent;
  const point = (main: number, cross: number): Point => {
    const x = vertical ? cross : main;
    return {x: rtl ? width - x : x, y: vertical ? main : cross};
  };
  const centers = new Map<string, number>();
  const nodes = graph.nodes.map((node) => {
    const rank = ranks.get(node.id)!;
    const cross = crossStart + crossSpan / 2 + positions.get(node.id)! * (crossSize + crossGap) - crossSize / 2;
    centers.set(node.id, cross + crossSize / 2);
    const position = point(mainStarts[rank], cross);
    return {...node, rank, x: rtl ? position.x - NODE_WIDTH : position.x, y: position.y};
  });
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const port = (edge: DtoWorkflowEdge, from: boolean) => {
    const id = from ? edge.from : edge.to;
    const peers = edges
      .filter((other) => (from ? other.from : other.to) === id)
      .sort(
        (a, b) =>
          centers.get(from ? a.to : a.from)! - centers.get(from ? b.to : b.from)! ||
          edgeKey(a).localeCompare(edgeKey(b))
      );
    const index = peers.indexOf(edge);
    const spacing = Math.min(24, (crossSize * 0.5) / Math.max(1, peers.length - 1));
    return centers.get(id)! + (index - (peers.length - 1) / 2) * spacing;
  };
  const routed = edges.map((edge) => {
    const from = byId.get(edge.from)!,
      to = byId.get(edge.to)!;
    const startMain = mainStarts[from.rank] + mainSize + 2,
      endMain = mainStarts[to.rank] - 5;
    const startCross = port(edge, true),
      endCross = port(edge, false);
    const loop = to.rank <= from.rank;
    let route: Point[], label: Point;
    if (to.rank === from.rank + 1) {
      const lane = transitions[from.rank].indexOf(edge);
      const middle = mainStarts[from.rank] + mainSize + 16 + (lane + 0.5) * (labelMain + 12);
      route = [
        point(startMain, startCross),
        point(middle, startCross),
        point(middle, endCross),
        point(endMain, endCross)
      ];
      label = point(middle, (startCross + endCross) / 2);
    } else {
      const lane = (loop ? loops : skips).indexOf(edge);
      const outside = loop ? crossStart - (lane + 0.5) * laneGap : crossStart + crossSpan + (lane + 0.5) * laneGap;
      const depart = startMain + 14,
        arrive = endMain - 14;
      route = [
        point(startMain, startCross),
        point(depart, startCross),
        point(depart, outside),
        point(arrive, outside),
        point(arrive, endCross),
        point(endMain, endCross)
      ];
      label = point((depart + arrive) / 2, outside);
    }
    return {
      ...edge,
      path: roundedPath(route),
      points: route,
      x: label.x,
      y: label.y,
      loop,
      description: `${from.title} → ${to.title}${edge.label ? ' — ' + edge.label : ''}`
    };
  });
  return {nodes, edges: routed, width, height};
}
