import {DtoWorkflowNode} from '@shared/schema/response/knowledge/DtoWorkflowNode';
import {DtoWorkflowEdge} from '@shared/schema/response/knowledge/DtoWorkflowEdge';

export interface DtoWorkflowDiagram {
  nodes: DtoWorkflowNode[];
  edges: DtoWorkflowEdge[];
}
