import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { KnowledgeAnswer, SourceContent, SourceReference } from '../models/knowledge-answer.model';
import { Project } from '../models/project.model';
import { SearchMode } from '../models/search-mode.model';

/** Typed HTTP boundary between Angular and the local Spring Boot service. */
@Injectable({ providedIn: 'root' })
export class KnowledgeApiService {
  private readonly http = inject(HttpClient);
  getProjects(): Observable<Project[]> { return this.http.get<Project[]>('/api/projects'); }
  getProject(projectId: string): Observable<Project> { return this.http.get<Project>(`/api/projects/${projectId}`); }
  refreshProjectOverview(projectId: string): Observable<Project> {
    return this.http.post<Project>(`/api/projects/${projectId}/overview/refresh`, {});
  }
  ask(projectId: string, question: string, language: 'en' | 'ar' = 'en', mode: SearchMode = 'advanced'): Observable<KnowledgeAnswer> {
    return this.http.post<KnowledgeAnswer>('/api/questions', { projectId, question, language, mode });
  }
  getIntegrationDetails(projectId: string, name: string, language: 'en' | 'ar' = 'en'): Observable<KnowledgeAnswer> {
    return this.http.post<KnowledgeAnswer>('/api/integrations/details', { projectId, name, language });
  }
  getSource(source: SourceReference): Observable<SourceContent> {
    const params = new HttpParams().set('repositoryId', source.repositoryId).set('filePath', source.filePath)
      .set('startLine', source.startLine).set('endLine', source.endLine);
    return this.http.get<SourceContent>('/api/sources/content', { params });
  }
}
