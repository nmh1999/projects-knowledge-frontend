export interface DtoWorkflowNode {
  id: string;
  title: string;
  actor: string;
  type: 'start' | 'action' | 'decision' | 'end';
}
