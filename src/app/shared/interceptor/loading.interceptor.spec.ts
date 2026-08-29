import {HttpClient, HttpContext, provideHttpClient, withInterceptors} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {fakeAsync, TestBed, tick} from '@angular/core/testing';
import {take} from 'rxjs';
import {loadingInterceptor} from './loading.interceptor';
import {HttpLoadingService} from '@shared/service/http-loading.service';
import {RequestCancelledError} from '@shared/service/request-cancelled.error';
import {BACKGROUND_REQUEST} from '@shared/interceptor/background-request.context';

describe('HTTP cancellation', () => {
  let client: HttpClient;
  let http: HttpTestingController;
  let loading: HttpLoadingService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([loadingInterceptor])), provideHttpClientTesting()]
    });
    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
    loading = TestBed.inject(HttpLoadingService);
  });
  afterEach(() => http.verify());

  it('aborts concurrent GET and POST requests with individual IDs and excludes cancellation calls from loading', fakeAsync(() => {
    const errors: unknown[] = [];
    client.get('/api/projects').subscribe({error: (error) => errors.push(error)});
    client.post('/api/questions', {}).subscribe({error: (error) => errors.push(error)});
    const requests = [http.expectOne('/api/projects'), http.expectOne('/api/questions')];
    const ids = requests.map((request) => request.request.headers.get('X-Request-ID'));
    expect(ids[0]).toMatch(/^[0-9a-f-]{36}$/);
    expect(ids[0]).not.toEqual(ids[1]);
    expect(loading.pendingCount()).toBe(2);
    loading.cancelAll();
    expect(requests.every((request) => request.cancelled)).toBeTrue();
    expect(errors.every((error) => error instanceof RequestCancelledError)).toBeTrue();
    expect(errors.length).toBe(2);
    expect(loading.active()).toBeFalse();
    expect(loading.pendingCount()).toBe(0);
    for (const id of ids) {
      const cancel = http.expectOne((request) => request.url.endsWith('/requests/' + id + '/cancel'));
      expect(cancel.request.method).toBe('POST');
      expect(cancel.request.headers.has('X-Request-ID')).toBeFalse();
      cancel.flush(null, {status: 204, statusText: 'No Content'});
    }
    expect(loading.notice()).toBe('requestCancelled');
    tick(5000);
  }));

  it('does not send cancellation for successful, failed, or already completed requests', fakeAsync(() => {
    client.get('/api/projects').pipe(take(1)).subscribe();
    http.expectOne('/api/projects').flush([]);
    expect(loading.pendingCount()).toBe(0);
    expect(loading.active()).toBeTrue();
    loading.cancelAll();
    expect(loading.notice()).toBe('');
    tick(450);
    expect(loading.active()).toBeFalse();
    client.get('/api/sources').subscribe({error: () => {}});
    http.expectOne('/api/sources').flush({}, {status: 500, statusText: 'Error'});
    tick(450);
    expect(loading.active()).toBeFalse();
  }));

  it('warns if the server cannot acknowledge cancellation', fakeAsync(() => {
    client.get('/api/projects').subscribe({error: () => {}});
    http.expectOne('/api/projects');
    loading.cancelAll();
    http.expectOne((request) => request.url.endsWith('/cancel')).flush({}, {status: 503, statusText: 'Offline'});
    expect(loading.notice()).toBe('cancellationUnconfirmed');
    expect(loading.active()).toBeFalse();
    tick(5000);
  }));

  it('does not let late cancellation feedback affect a new request', fakeAsync(() => {
    client.get('/api/first').subscribe({error: () => {}});
    http.expectOne('/api/first');
    loading.cancelAll();
    const cancel = http.expectOne((request) => request.url.endsWith('/cancel'));
    client.get('/api/retry').subscribe();
    cancel.flush({}, {status: 500, statusText: 'Error'});
    expect(loading.notice()).toBe('');
    expect(loading.pendingCount()).toBe(1);
    expect(loading.active()).toBeTrue();
    http.expectOne('/api/retry').flush({});
    tick(450);
    expect(loading.active()).toBeFalse();
  }));

  it('also stops backend work when a pending subscription is disposed', fakeAsync(() => {
    const subscription = client.get('/api/sources').subscribe();
    const request = http.expectOne('/api/sources');
    subscription.unsubscribe();
    expect(request.cancelled).toBeTrue();
    http.expectOne((request) => request.url.endsWith('/cancel')).flush(null);
    expect(loading.notice()).toBe('');
    tick(450);
  }));

  it('keeps background requests out of the full-screen loader and still cancels disposed backend work', fakeAsync(() => {
    const subscription = client
      .get('/api/projects/sample', {context: new HttpContext().set(BACKGROUND_REQUEST, true)})
      .subscribe();
    const request = http.expectOne('/api/projects/sample');
    const requestId = request.request.headers.get('X-Request-ID');
    expect(requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(loading.pendingCount()).toBe(0);
    expect(loading.active()).toBeFalse();
    subscription.unsubscribe();
    expect(request.cancelled).toBeTrue();
    http.expectOne((candidate) => candidate.url.endsWith('/requests/' + requestId + '/cancel')).flush(null);
    expect(loading.notice()).toBe('');
    tick(450);
  }));

  it('cancels other HTTP URLs locally without exposing request IDs or calling their servers', fakeAsync(() => {
    client.get('https://example.invalid/resource').subscribe({error: () => {}});
    const request = http.expectOne('https://example.invalid/resource');
    expect(request.request.headers.has('X-Request-ID')).toBeFalse();
    loading.cancelAll();
    expect(request.cancelled).toBeTrue();
    tick(450);
  }));
});
