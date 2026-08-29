import {HttpClient, HttpContext} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {finalize, Observable, shareReplay} from 'rxjs';
import {getEnv} from '@environment/environment';
import {DtoProject} from '@shared/schema/response/project/DtoProject';
import {BACKGROUND_REQUEST} from '@shared/interceptor/background-request.context';

/** Project discovery and cached overview retrieval; listing never starts analysis. */
@Injectable({providedIn: 'root'})
export class ProjectService {
  private readonly httpClient = inject(HttpClient);
  private readonly controllerUrl = getEnv().backEndUrl + '/projects';
  private readonly backgroundRequest = new HttpContext().set(BACKGROUND_REQUEST, true);
  private readonly pendingOverviews = new Map<string, Observable<DtoProject>>();

  public getProjects(): Observable<DtoProject[]> {
    return this.httpClient.get<DtoProject[]>(this.controllerUrl);
  }

  public refreshProjects(): Observable<DtoProject[]> {
    return this.httpClient.post<DtoProject[]>(`${this.controllerUrl}/refresh`, {});
  }

  public getProject(projectId: string): Observable<DtoProject> {
    const pending = this.pendingOverviews.get(projectId);
    if (pending) return pending;

    // Re-selecting a project joins its existing analysis instead of starting another HTTP/model request.
    const request = this.httpClient
      .get<DtoProject>(`${this.controllerUrl}/${projectId}`, {context: this.backgroundRequest})
      .pipe(
        finalize(() => this.pendingOverviews.delete(projectId)),
        shareReplay({bufferSize: 1, refCount: false})
      );
    this.pendingOverviews.set(projectId, request);
    return request;
  }

  public refreshProjectOverview(projectId: string): Observable<DtoProject> {
    return this.httpClient.post<DtoProject>(
      `${this.controllerUrl}/${projectId}/overview/refresh`,
      {},
      {
        context: this.backgroundRequest
      }
    );
  }
}
