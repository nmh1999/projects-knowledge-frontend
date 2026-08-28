import { WorkflowDiagram } from './workflow-diagram.model';

export interface FlowNode { type: string; name: string; detail: string; }
export interface ApiInfo { method: string; path: string; controller: string; methodName: string; purpose: string; }
export interface DatabaseInfo { table: string; entity: string; repository: string; purpose: string; }
export interface IntegrationInfo { name: string; usedBy: string; purpose: string; }
export interface ScheduledJobInfo { name: string; purpose: string; schedule: string; }
export interface TechnicalDetail { name: string; type: string; method: string; responsibility: string; }
export interface RoleInfo { role: string; capability: string; evidence: string; }
export interface SourceReference {
  repositoryId: string; repositoryName: string; filePath: string; fileName: string; symbol: string;
  startLine: number; endLine: number; excerpt: string;
}
export interface KnowledgeAnswer {
  inScope: boolean;
  project: string; question: string; summary: string; businessFlow: string[]; technicalFlow: FlowNode[];
  apis: ApiInfo[]; database: DatabaseInfo[]; integrations: IntegrationInfo[]; scheduledJobs: ScheduledJobInfo[];
  technicalDetails: TechnicalDetail[]; sources: SourceReference[]; confidence: 'high' | 'medium' | 'low';
  keyFindings: string[]; roles: RoleInfo[]; risks: string[]; followUpQuestions: string[]; enoughEvidence: boolean;
  workflowExample?: string;
  workflowDiagram?: WorkflowDiagram;
}
export interface SourceLine { number: number; content: string; highlighted: boolean; }
export interface SourceContent { repositoryId: string; filePath: string; startLine: number; endLine: number; lines: SourceLine[]; }
