import {Language} from '@shared/enums/Language';
import {SearchMode} from '@shared/enums/knowledge/SearchMode';

export interface ReqQuestion {
  projectId: string;
  question: string;
  language: Language;
  mode: SearchMode;
}
