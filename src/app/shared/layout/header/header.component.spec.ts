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

    expect(fixture.nativeElement.querySelector('.cache-button')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.shutdown-button')).not.toBeNull();
  });
});
