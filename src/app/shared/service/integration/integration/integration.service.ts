import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {getEnv} from '@environment/environment';
import {Language} from '@shared/enums/Language';
import {ReqIntegrationDetails} from '@shared/schema/request/knowledge/ReqIntegrationDetails';
import {DtoKnowledgeAnswer} from '@shared/schema/response/knowledge/DtoKnowledgeAnswer';

/** Integration details reuse the backend's configured persistent cache. */
@Injectable({providedIn: 'root'})
export class IntegrationService {
  private readonly httpClient = inject(HttpClient);
  private readonly controllerUrl = getEnv().backEndUrl + '/integrations';

  public getIntegrationDetails(
    projectId: string,
    name: string,
    language: Language = 'en'
  ): Observable<DtoKnowledgeAnswer> {
    const request: ReqIntegrationDetails = {projectId, name, language};
    return this.httpClient.post<DtoKnowledgeAnswer>(this.controllerUrl + '/details', request);
  }

  public refresh(request: ReqIntegrationDetails): Observable<DtoKnowledgeAnswer> {
    return this.httpClient.post<DtoKnowledgeAnswer>(this.controllerUrl + '/details/refresh', request);
  }
}
