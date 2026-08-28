import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {getEnv} from '@environment/environment';
import {Language} from '@shared/enums/Language';
import {SearchMode} from '@shared/enums/knowledge/SearchMode';
import {ReqQuestion} from '@shared/schema/request/knowledge/ReqQuestion';
import {DtoKnowledgeAnswer} from '@shared/schema/response/knowledge/DtoKnowledgeAnswer';

/** Sends the selected answer format; Basic does not request a full Advanced response. */
@Injectable({providedIn: 'root'})
export class QuestionService {
  private readonly httpClient = inject(HttpClient);
  private readonly controllerUrl = getEnv().backEndUrl + '/questions';

  public ask(
    projectId: string,
    question: string,
    language: Language = 'en',
    mode: SearchMode = 'advanced'
  ): Observable<DtoKnowledgeAnswer> {
    const request: ReqQuestion = {projectId, question, language, mode};
    return this.httpClient.post<DtoKnowledgeAnswer>(this.controllerUrl, request);
  }
}
