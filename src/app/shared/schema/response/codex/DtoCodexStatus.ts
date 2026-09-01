export interface DtoCodexStatus {
  enabled: boolean;
  connected: boolean;
  ready: boolean;
  authenticationType: string;
  model: string;
  reasoningEffort: string;
  activeRequests: number;
}
