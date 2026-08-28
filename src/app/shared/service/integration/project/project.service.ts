import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {getEnv} from '@environment/environment';
import {DtoProject} from '@shared/schema/response/project/DtoProject';

/** Project discovery and cached overview retrieval; listing never starts analysis. */
@Injectable({providedIn: 'root'})
export class ProjectService {
  private readonly httpClient = inject(HttpClient);
  private readonly controllerUrl = getEnv().backEndUrl + '/projects';

  public getProjects(): Observable<DtoProject[]> {
    return this.httpClient.get<DtoProject[]>(this.controllerUrl);
  }

  public getProject(projectId: string): Observable<DtoProject> {
    return this.httpClient.get<DtoProject>(`${this.controllerUrl}/${projectId}`);
  }

  public refreshProjectOverview(projectId: string): Observable<DtoProject> {
    return this.httpClient.post<DtoProject>(`${this.controllerUrl}/${projectId}/overview/refresh`, {});
  }
}
