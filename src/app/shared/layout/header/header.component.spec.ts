import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {HeaderComponent} from '@shared/layout/header/header.component';
import {LanguageService} from '@shared/service/language.service';

describe('HeaderComponent desktop shutdown', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
  });
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('confirms shutdown and explains that the browser tab can be closed', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    const labels = TestBed.inject(LanguageService);
    fixture.detectChanges();
    flushInitialCodexStatus();

    fixture.nativeElement.querySelector('.shutdown-button').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.shutdown-dialog h2').textContent).toContain(
      labels.t('closeApplicationTitle')
    );

    fixture.nativeElement.querySelector('.confirm-shutdown').click();
    const request = TestBed.inject(HttpTestingController).expectOne('/api/desktop/shutdown');
    request.flush(null, {status: 202, statusText: 'Accepted'});
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.shutdown-dialog h2').textContent).toContain(
      labels.t('applicationClosed')
    );
    expect(fixture.nativeElement.querySelector('.shutdown-actions')).toBeNull();
  });

  it('confirms clearing every cache and reports completion', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    const labels = TestBed.inject(LanguageService);
    fixture.detectChanges();
    flushInitialCodexStatus();

    fixture.nativeElement.querySelector('.cache-button').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#cache-title').textContent).toContain(labels.t('clearCacheTitle'));

    fixture.nativeElement.querySelector('.confirm-cache').click();
    const request = TestBed.inject(HttpTestingController).expectOne('/api/desktop/cache');
    request.flush(null, {status: 204, statusText: 'No Content'});
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#cache-title').textContent).toContain(labels.t('cacheCleared'));
  });

  it('always shows cache and shutdown controls without a desktop query parameter', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    flushInitialCodexStatus();

    expect(fixture.nativeElement.querySelector('.cache-button')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.shutdown-button')).not.toBeNull();
  });

  it('loads Codex settings on demand without starting a model request', async () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    flushInitialCodexStatus();

    fixture.nativeElement.querySelector('.codex-status').click();
    const request = TestBed.inject(HttpTestingController).expectOne('/api/codex/settings');
    expect(request.request.method).toBe('GET');
    request.flush(settingsResponse());
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.codex-dialog')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.codex-status').classList).toContain('ready');
    expect(fixture.nativeElement.querySelector('.codex-status small').textContent).toContain('gpt-test');
    expect(fixture.nativeElement.querySelector('#codex-model').value).toBe('gpt-test');
  });

  it('saves a supported effort for new Codex requests', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    flushInitialCodexStatus();
    fixture.nativeElement.querySelector('.codex-status').click();
    TestBed.inject(HttpTestingController).expectOne('/api/codex/settings').flush(settingsResponse());
    fixture.detectChanges();

    fixture.componentInstance.selectCodexEffort('high');
    fixture.componentInstance.saveCodexSettings();
    const request = TestBed.inject(HttpTestingController).expectOne('/api/codex/settings');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({model: '', reasoningEffort: 'high'});
    request.flush({...settingsResponse(), status: {...settingsResponse().status, reasoningEffort: 'high'}});
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.codex-dialog')).toBeNull();
    expect(fixture.nativeElement.querySelector('.codex-status small').textContent).toContain('gpt-test');
  });

  function settingsResponse() {
    return {
      status: {
        enabled: true,
        connected: true,
        ready: true,
        authenticationType: 'chatgpt',
        model: 'gpt-test',
        reasoningEffort: 'medium',
        activeRequests: 0
      },
      selectedModel: '',
      models: [
        {
          id: 'gpt-test',
          displayName: 'GPT Test',
          description: 'Test model',
          defaultModel: true,
          defaultReasoningEffort: 'medium',
          reasoningEfforts: [
            {value: 'medium', description: 'Balanced'},
            {value: 'high', description: 'Deeper'}
          ]
        }
      ]
    };
  }

  function flushInitialCodexStatus(): void {
    TestBed.inject(HttpTestingController).expectOne('/api/codex/status').flush(settingsResponse().status);
  }
});
