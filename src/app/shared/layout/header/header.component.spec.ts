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
    const component = fixture.componentInstance;
    const labels = TestBed.inject(LanguageService);
    component.desktopEnabled.set(true);
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
});
