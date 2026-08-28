import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {ProjectService} from '@shared/service/integration/project/project.service';

describe('ProjectService HTTP contract', () => {
  beforeEach(() => TestBed.configureTestingModule({providers: [provideHttpClient(), provideHttpClientTesting()]}));
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('lists projects without requesting an overview', () => {
    TestBed.inject(ProjectService).getProjects().subscribe();
    const request = TestBed.inject(HttpTestingController).expectOne('/api/projects');
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });

  it('retrieves a cached overview with GET and refreshes only with POST', () => {
    const service = TestBed.inject(ProjectService);
    const http = TestBed.inject(HttpTestingController);
    service.getProject('sample').subscribe();
    const get = http.expectOne('/api/projects/sample');
    expect(get.request.method).toBe('GET');
    get.flush({});
    service.refreshProjectOverview('sample').subscribe();
    const refresh = http.expectOne('/api/projects/sample/overview/refresh');
    expect(refresh.request.method).toBe('POST');
    refresh.flush({});
  });
});
