import {Injectable, signal} from '@angular/core';
import {SearchMode} from '@shared/enums/knowledge/SearchMode';

import {QuestionHistoryEntry} from '@shared/schema/general/QuestionHistoryEntry';
const STORAGE_KEY = 'projects-knowledge-question-history-v1';
const HISTORY_LIMIT = 5;
const validMode = (mode: unknown): mode is SearchMode => mode === 'basic' || mode === 'advanced' || mode === 'workflow';

/** Local question text only: separate each project/scope and never store answers or call the API. */
@Injectable({providedIn: 'root'})
export class QuestionHistoryService {
  readonly persistent = signal(true);
  private readonly entries = signal(this.read());

  forProject(projectId: string): readonly QuestionHistoryEntry[] {
    return this.entries().get(projectId) ?? [];
  }

  remember(projectId: string, question: string, mode: SearchMode): void {
    const text = question.trim();
    if (!projectId || !text || !validMode(mode)) return;
    const next = new Map(this.entries());
    next.set(
      projectId,
      [{question: text, mode}, ...this.forProject(projectId).filter((entry) => entry.question !== text)].slice(
        0,
        HISTORY_LIMIT
      )
    );
    this.save(next);
  }

  clear(projectId: string): void {
    if (!projectId || !this.entries().has(projectId)) return;
    const next = new Map(this.entries());
    next.delete(projectId);
    this.save(next);
  }

  private save(entries: Map<string, QuestionHistoryEntry[]>): void {
    this.entries.set(entries);
    try {
      if (entries.size) localStorage.setItem(STORAGE_KEY, JSON.stringify([...entries]));
      else localStorage.removeItem(STORAGE_KEY);
      this.persistent.set(true);
    } catch {
      this.persistent.set(false);
    } // Keep this session usable if storage is blocked or full.
  }

  private read(): Map<string, QuestionHistoryEntry[]> {
    const result = new Map<string, QuestionHistoryEntry[]>();
    let saved: string | null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      this.persistent.set(false);
      return result;
    }
    try {
      const parsed: unknown = JSON.parse(saved ?? '[]');
      if (!Array.isArray(parsed)) return result;
      for (const group of parsed) {
        if (!Array.isArray(group) || typeof group[0] !== 'string' || !group[0] || !Array.isArray(group[1])) continue;
        const entries: QuestionHistoryEntry[] = [];
        for (const value of group[1]) {
          if (!value || typeof value.question !== 'string' || !value.question.trim() || !validMode(value.mode))
            continue;
          const question = value.question.trim();
          if (!entries.some((entry) => entry.question === question)) entries.push({question, mode: value.mode});
          if (entries.length === HISTORY_LIMIT) break;
        }
        if (entries.length) result.set(group[0], entries);
      }
    } catch {
      /* Ignore malformed local data without blocking questions. */
    }
    return result;
  }
}
