import {HttpClient, HttpContext} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {getEnv} from '@environment/environment';
import {BACKGROUND_REQUEST} from '@shared/interceptor/background-request.context';
import {DtoCodexStatus} from '@shared/schema/response/codex/DtoCodexStatus';
import {DtoCodexSettings} from '@shared/schema/response/codex/DtoCodexSettings';
import {ReqCodexSettings} from '@shared/schema/request/codex/ReqCodexSettings';

@Injectable({providedIn: 'root'})
export class CodexService {
  private readonly httpClient = inject(HttpClient);
  private readonly controllerUrl = getEnv().backEndUrl + '/codex';
  private readonly backgroundRequest = new HttpContext().set(BACKGROUND_REQUEST, true);

  status(): Observable<DtoCodexStatus> {
    return this.httpClient.get<DtoCodexStatus>(this.controllerUrl + '/status', {context: this.backgroundRequest});
  }

  settings(): Observable<DtoCodexSettings> {
    return this.httpClient.get<DtoCodexSettings>(this.controllerUrl + '/settings', {
      context: this.backgroundRequest
    });
  }

  updateSettings(request: ReqCodexSettings): Observable<DtoCodexSettings> {
    return this.httpClient.put<DtoCodexSettings>(this.controllerUrl + '/settings', request, {
      context: this.backgroundRequest
    });
  }
}
