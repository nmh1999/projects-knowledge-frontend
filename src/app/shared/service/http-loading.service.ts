import {Injectable, signal} from '@angular/core';

/** Tracks all active HTTP requests, including concurrent requests. */
@Injectable({providedIn: 'root'})
export class HttpLoadingService {
  private static readonly MINIMUM_VISIBLE_MS = 450;
  private readonly requestCount = signal(0);
  private readonly visible = signal(false);
  private shownAt = 0;
  private hideTimer?: ReturnType<typeof setTimeout>;
  readonly active = this.visible.asReadonly();

  begin(): void {
    if (this.requestCount() === 0) {
      if (this.hideTimer) clearTimeout(this.hideTimer);
      this.shownAt = Date.now();
      this.visible.set(true);
    }
    this.requestCount.update((count) => count + 1);
  }

  end(): void {
    this.requestCount.update((count) => Math.max(0, count - 1));
    if (this.requestCount() > 0) return;
    const remaining = Math.max(0, HttpLoadingService.MINIMUM_VISIBLE_MS - (Date.now() - this.shownAt));
    this.hideTimer = setTimeout(() => {
      if (this.requestCount() === 0) this.visible.set(false);
    }, remaining);
  }
}
