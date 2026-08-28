import {DtoRepository} from '@shared/schema/response/project/DtoRepository';
import {DtoProjectOverview} from '@shared/schema/response/project/DtoProjectOverview';

export interface DtoProject {
  id: string;
  name: string;
  repositories: DtoRepository[];
  overview: DtoProjectOverview;
  overviewUpdatedAt?: string | null;
}
