import {DtoSourceLine} from '@shared/schema/response/source/DtoSourceLine';

export interface DtoSourceContent {
  repositoryId: string;
  filePath: string;
  startLine: number;
  endLine: number;
  lines: DtoSourceLine[];
}
