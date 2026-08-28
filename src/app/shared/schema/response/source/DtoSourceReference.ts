export interface DtoSourceReference {
  repositoryId: string;
  repositoryName: string;
  filePath: string;
  fileName: string;
  symbol: string;
  startLine: number;
  endLine: number;
  excerpt: string;
}
