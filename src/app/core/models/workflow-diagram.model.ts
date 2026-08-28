export interface WorkflowNode { id: string; title: string; actor: string; type: 'start' | 'action' | 'decision' | 'end'; }
export interface WorkflowEdge { from: string; to: string; label: string; }
export interface WorkflowDiagram { nodes: WorkflowNode[]; edges: WorkflowEdge[]; }
