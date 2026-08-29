import {HttpBackend, HttpClient, HttpHeaders} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {getEnv} from '@environment/environment';

/** Desktop lifecycle requests bypass the global request loader and cancellation flow. */
@Injectable({providedIn: 'root'})
export class DesktopService {
  private readonly httpClient = new HttpClient(inject(HttpBackend));
  private readonly controllerUrl = getEnv().backEndUrl + '/desktop';

  shutdown(): Observable<void> {
    const headers = new HttpHeaders({'X-Projects-Knowledge-Desktop': 'true'});
    return this.httpClient.post<void>(`${this.controllerUrl}/shutdown`, null, {headers});
  }
}
