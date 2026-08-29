import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {ProjectService} from '@shared/service/integration/project/project.service';
import {BACKGROUND_REQUEST} from '@shared/interceptor/background-request.context';

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
    expect(get.request.context.get(BACKGROUND_REQUEST)).toBeTrue();
    get.flush({});
    service.refreshProjectOverview('sample').subscribe();
    const refresh = http.expectOne('/api/projects/sample/overview/refresh');
    expect(refresh.request.method).toBe('POST');
    expect(refresh.request.context.get(BACKGROUND_REQUEST)).toBeTrue();
    refresh.flush({});
  });

  it('shares an unfinished project overview request and starts a new one only after it completes', () => {
    const service = TestBed.inject(ProjectService);
    const http = TestBed.inject(HttpTestingController);
    const results: unknown[] = [];
    service.getProject('sample').subscribe((project) => results.push(project));
    service.getProject('sample').subscribe((project) => results.push(project));
    const first = http.expectOne('/api/projects/sample');
    http.expectNone('/api/projects/sample');
    first.flush({id: 'sample'});
    expect(results).toEqual([{id: 'sample'}, {id: 'sample'}]);

    service.getProject('sample').subscribe();
    http.expectOne('/api/projects/sample').flush({id: 'sample'});
  });

  it('bypasses the catalog cache only on an explicit refresh', () => {
    TestBed.inject(ProjectService).refreshProjects().subscribe();
    const request = TestBed.inject(HttpTestingController).expectOne('/api/projects/refresh');
    expect(request.request.method).toBe('POST');
    request.flush([]);
  });
});
