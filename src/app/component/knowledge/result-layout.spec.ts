import {provideHttpClient} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {SourceViewerComponent} from '@component/knowledge/source-viewer/source-viewer.component';
import {TechnicalFlowComponent} from '@component/knowledge/technical-flow/technical-flow.component';
import {DtoSourceReference} from '@shared/schema/response/source/DtoSourceReference';

describe('Result layout with long repository content', () => {
  let savedDirection: string;
  let savedTheme: string | undefined;

  beforeEach(async () => {
    savedDirection = document.documentElement.dir;
    savedTheme = document.documentElement.dataset['theme'];
    await TestBed.configureTestingModule({
      imports: [SourceViewerComponent, TechnicalFlowComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
  });

  afterEach(() => {
    document.documentElement.dir = savedDirection;
    if (savedTheme) document.documentElement.dataset['theme'] = savedTheme;
    else delete document.documentElement.dataset['theme'];
  });

  for (const theme of ['light', 'dark']) {
    for (const direction of ['ltr', 'rtl']) {
      for (const width of [390, 1100]) {
        it(`keeps sources and actions inside ${width}px in ${theme}/${direction}`, () => {
          const fixture = TestBed.createComponent(SourceViewerComponent);
          const source: DtoSourceReference = {
            repositoryId: 'repo',
            repositoryName: 'public-marts-backend',
            fileName: 'RequestUpdateServiceImpl.java',
            filePath: 'src/main/java/' + 'longNestedPackage/'.repeat(30) + 'RequestUpdateServiceImpl.java',
            symbol: 'RequestUpdateServiceImpl.' + 'veryLongMethodName'.repeat(12),
            startLine: 10,
            endLine: 50,
            excerpt: ''
          };
          const sources = [source, {...source, startLine: 80, endLine: 100}];
          fixture.componentRef.setInput('sources', sources);
          const host = fixture.nativeElement as HTMLElement;
          host.style.width = width + 'px';
          document.documentElement.dir = direction;
          document.documentElement.dataset['theme'] = theme;
          fixture.detectChanges();

          const grid = host.querySelector<HTMLElement>('.source-grid')!;
          expect(grid.scrollWidth).toBeLessThanOrEqual(grid.clientWidth + 1);
          const buttons = [...grid.querySelectorAll<HTMLButtonElement>('button')];
          expect(buttons.length).toBe(2);
          for (const button of buttons) {
            expect(button.scrollWidth).toBeLessThanOrEqual(button.clientWidth + 1);
            const bounds = button.getBoundingClientRect();
            const gridBounds = grid.getBoundingClientRect();
            expect(bounds.left).toBeGreaterThanOrEqual(gridBounds.left - 1);
            expect(bounds.right).toBeLessThanOrEqual(gridBounds.right + 1);
          }
          expect(host.querySelector('small')?.title).toContain(source.filePath);
          const open = spyOn(fixture.componentInstance, 'open');
          buttons[1].click();
          expect(open).toHaveBeenCalledWith(sources[1]);
        });
      }

      it(`wraps technical endpoints inside cards in ${theme}/${direction}`, () => {
        const fixture = TestBed.createComponent(TechnicalFlowComponent);
        fixture.componentRef.setInput(
          'nodes',
          Array.from({length: 6}, () => ({
            type: 'api',
            name: 'Repeated lookup',
            detail: 'POST /' + 'LongEndpointWithoutSpaces'.repeat(15)
          }))
        );
        const host = fixture.nativeElement as HTMLElement;
        host.style.width = '1000px';
        document.documentElement.dir = direction;
        document.documentElement.dataset['theme'] = theme;
        fixture.detectChanges();

        const flow = host.querySelector<HTMLElement>('.flow')!;
        expect(flow.scrollWidth).toBeGreaterThan(flow.clientWidth);
        const cards = [...flow.querySelectorAll<HTMLElement>('article')];
        expect(cards.length).toBe(6);
        for (const card of cards) {
          expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth + 1);
          const text = card.querySelector<HTMLElement>('p')!;
          expect(text.scrollWidth).toBeLessThanOrEqual(text.clientWidth + 1);
        }
      });
    }
  }
});
