import {DtoCodexStatus} from '@shared/schema/response/codex/DtoCodexStatus';

export interface DtoCodexReasoningEffort {
  value: string;
  description: string;
}

export interface DtoCodexModel {
  id: string;
  displayName: string;
  description: string;
  defaultModel: boolean;
  defaultReasoningEffort: string;
  reasoningEfforts: DtoCodexReasoningEffort[];
}

export interface DtoCodexSettings {
  status: DtoCodexStatus;
  selectedModel: string;
  models: DtoCodexModel[];
}
