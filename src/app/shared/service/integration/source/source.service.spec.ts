import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {SourceService} from '@shared/service/integration/source/source.service';

describe('SourceService HTTP contract', () => {
  beforeEach(() => TestBed.configureTestingModule({providers: [provideHttpClient(), provideHttpClientTesting()]}));
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('encodes source paths and preserves the selected line range', () => {
    TestBed.inject(SourceService)
      .getSource({
        repositoryId: 'sample',
        repositoryName: 'Sample',
        filePath: 'src/a & b/Example.java',
        fileName: 'Example.java',
        symbol: 'Example',
        startLine: 12,
        endLine: 24,
        excerpt: ''
      })
      .subscribe();
    const request = TestBed.inject(HttpTestingController).expectOne((req) => req.url === '/api/sources/content');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('repositoryId')).toBe('sample');
    expect(request.request.params.get('filePath')).toBe('src/a & b/Example.java');
    expect(request.request.params.get('startLine')).toBe('12');
    expect(request.request.params.get('endLine')).toBe('24');
    expect(request.request.urlWithParams).toContain('%26');
    request.flush({});
  });
});
