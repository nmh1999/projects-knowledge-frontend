import {inject} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {HttpBackend, HttpClient, HttpEventType, HttpInterceptorFn} from '@angular/common/http';
import {Observable, timeout} from 'rxjs';
import {getEnv} from '@environment/environment';
import {HttpLoadingService} from '@shared/service/http-loading.service';
import {RequestCancelledError} from '@shared/service/request-cancelled.error';

/** Abort browser I/O immediately; a separate untracked request stops owned backend work. */
export const loadingInterceptor: HttpInterceptorFn = (request, next) => {
  const loading = inject(HttpLoadingService);
  const control = new HttpClient(inject(HttpBackend));
  const base = new URL(getEnv().backEndUrl, inject(DOCUMENT).baseURI);
  const target = new URL(request.url, base);
  const apiPath = base.pathname.replace(/\/$/, '');
  const isBackend =
    target.origin === base.origin && (target.pathname === apiPath || target.pathname.startsWith(apiPath + '/'));

  return new Observable((observer) => {
    const requestId = crypto.randomUUID();
    let settled = false;
    let cancellationSent = false;
    const stopBackend = (reportFailure: () => void = () => {}) => {
      if (!isBackend || cancellationSent) return;
      cancellationSent = true;
      control
        .post(base.origin + apiPath + '/requests/' + requestId + '/cancel', null)
        .pipe(timeout(5000))
        .subscribe({error: reportFailure});
    };
    const id = loading.begin((reportFailure) => {
      stopBackend(reportFailure);
      observer.error(new RequestCancelledError());
    });
    const subscription = next(isBackend ? request.clone({setHeaders: {'X-Request-ID': requestId}}) : request).subscribe(
      {
        next: (event) => {
          if (event.type === HttpEventType.Response) settled = true;
          observer.next(event);
        },
        error: (error) => {
          settled = true;
          observer.error(error);
        },
        complete: () => {
          settled = true;
          observer.complete();
        }
      }
    );
    return () => {
      subscription.unsubscribe();
      loading.end(id);
      if (!settled) stopBackend();
    };
  });
};
