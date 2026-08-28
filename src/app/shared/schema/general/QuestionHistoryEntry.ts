import {SearchMode} from '@shared/enums/knowledge/SearchMode';

export interface QuestionHistoryEntry {
  question: string;
  mode: SearchMode;
}
