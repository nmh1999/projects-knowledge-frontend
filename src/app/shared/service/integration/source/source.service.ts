import {HttpClient, HttpParams} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {getEnv} from '@environment/environment';
import {DtoSourceContent} from '@shared/schema/response/source/DtoSourceContent';
import {DtoSourceReference} from '@shared/schema/response/source/DtoSourceReference';

/** Fetches only the selected source window; validation and redaction stay server-side. */
@Injectable({providedIn: 'root'})
export class SourceService {
  private readonly httpClient = inject(HttpClient);
  private readonly controllerUrl = getEnv().backEndUrl + '/sources';

  public getSource(source: DtoSourceReference): Observable<DtoSourceContent> {
    const params = new HttpParams()
      .set('repositoryId', source.repositoryId)
      .set('filePath', source.filePath)
      .set('startLine', source.startLine)
      .set('endLine', source.endLine);
    return this.httpClient.get<DtoSourceContent>(this.controllerUrl + '/content', {params});
  }
}
