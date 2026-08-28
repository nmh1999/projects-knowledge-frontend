import { Component, inject } from '@angular/core';
import { HttpLoadingService } from '../../core/services/http-loading.service';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-http-loading-indicator',
  standalone: true,
  template: `@if (loading.active()) {
    <div class="http-loading" role="status" aria-live="polite">
      <div class="spinner" aria-hidden="true"><span></span><span></span></div>
      <strong>{{ language.t('loading') }}</strong>
    </div>
  }`,
  styles: [`
    .http-loading{position:fixed;z-index:9999999;inset:0;background:rgba(255,255,255,.5)}
    .spinner{position:absolute;top:50%;left:50%;width:60px;height:60px;transform:translate(-50%,-50%)}
    .spinner span{position:absolute;inset:0;border-radius:50%;background:#0b2945;opacity:.6;animation:bounce 2s infinite ease-in-out}
    .spinner span:last-child{animation-delay:-1s}
    strong{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}
    @keyframes bounce{0%,100%{transform:scale(0)}50%{transform:scale(1)}}
  `]
})
export class HttpLoadingIndicatorComponent {
  readonly loading = inject(HttpLoadingService);
  readonly language = inject(LanguageService);
}
