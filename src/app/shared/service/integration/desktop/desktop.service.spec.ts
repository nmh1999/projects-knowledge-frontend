import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {DesktopService} from '@shared/service/integration/desktop/desktop.service';

describe('DesktopService HTTP contract', () => {
  beforeEach(() => TestBed.configureTestingModule({providers: [provideHttpClient(), provideHttpClientTesting()]}));
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('uses a protected POST to stop the packaged desktop application', () => {
    TestBed.inject(DesktopService).shutdown().subscribe();
    const request = TestBed.inject(HttpTestingController).expectOne('/api/desktop/shutdown');
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('X-Projects-Knowledge-Desktop')).toBe('true');
    request.flush(null, {status: 202, statusText: 'Accepted'});
  });
});
