import {DtoFlowNode} from '@shared/schema/response/knowledge/DtoFlowNode';
import {DtoApiInfo} from '@shared/schema/response/knowledge/DtoApiInfo';
import {DtoDatabaseInfo} from '@shared/schema/response/knowledge/DtoDatabaseInfo';
import {DtoIntegrationInfo} from '@shared/schema/response/knowledge/DtoIntegrationInfo';
import {DtoScheduledJobInfo} from '@shared/schema/response/knowledge/DtoScheduledJobInfo';
import {DtoTechnicalDetail} from '@shared/schema/response/knowledge/DtoTechnicalDetail';
import {DtoRoleInfo} from '@shared/schema/response/knowledge/DtoRoleInfo';
import {DtoSourceReference} from '@shared/schema/response/source/DtoSourceReference';
import {DtoWorkflowDiagram} from '@shared/schema/response/knowledge/DtoWorkflowDiagram';

export interface DtoKnowledgeAnswer {
  updatedAt?: string | null;
  expiresAt?: string | null;
  inScope: boolean;
  project: string;
  question: string;
  summary: string;
  businessFlow: string[];
  technicalFlow: DtoFlowNode[];
  apis: DtoApiInfo[];
  database: DtoDatabaseInfo[];
  integrations: DtoIntegrationInfo[];
  scheduledJobs: DtoScheduledJobInfo[];
  technicalDetails: DtoTechnicalDetail[];
  sources: DtoSourceReference[];
  confidence: 'high' | 'medium' | 'low';
  keyFindings: string[];
  roles: DtoRoleInfo[];
  risks: string[];
  followUpQuestions: string[];
  enoughEvidence: boolean;
  workflowExample?: string;
  workflowDiagram?: DtoWorkflowDiagram;
}
