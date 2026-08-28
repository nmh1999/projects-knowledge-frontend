import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {QuestionService} from '@shared/service/integration/question/question.service';

describe('QuestionService search modes', () => {
  beforeEach(() => TestBed.configureTestingModule({providers: [provideHttpClient(), provideHttpClientTesting()]}));
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  for (const mode of ['basic', 'advanced', 'workflow', 'database'] as const) {
    it(`sends ${mode} to the backend`, () => {
      TestBed.inject(QuestionService).ask('project', 'Which framework?', 'ar', mode).subscribe();
      const request = TestBed.inject(HttpTestingController).expectOne('/api/questions');
      expect(request.request.method).toBe('POST');
      expect(request.request.body).toEqual({projectId: 'project', question: 'Which framework?', language: 'ar', mode});
      request.flush({});
    });
  }
});
