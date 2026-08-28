import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {IntegrationService} from '@shared/service/integration/integration/integration.service';

describe('IntegrationService HTTP contract', () => {
  beforeEach(() => TestBed.configureTestingModule({providers: [provideHttpClient(), provideHttpClientTesting()]}));
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('sends only the selected project, integration and language', () => {
    TestBed.inject(IntegrationService).getIntegrationDetails('sample', 'Example', 'ar').subscribe();
    const request = TestBed.inject(HttpTestingController).expectOne('/api/integrations/details');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({projectId: 'sample', name: 'Example', language: 'ar'});
    request.flush({});
  });
});
