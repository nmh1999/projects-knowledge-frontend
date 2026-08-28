export interface DtoDatabaseInfo {
  table: string;
  entity: string;
  repository: string;
  purpose: string;
  columns?: string[];
  relationships?: string[];
}
