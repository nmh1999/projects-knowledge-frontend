import {Injectable, signal} from '@angular/core';

type CancelRequest = (reportFailure: () => void) => void;

/** Owns the global loader and a separate cancellation callback for each HTTP subscription. */
@Injectable({providedIn: 'root'})
export class HttpLoadingService {
  private static readonly MINIMUM_VISIBLE_MS = 450;
  private readonly requests = new Map<number, CancelRequest>();
  private nextId = 0;
  private noticeVersion = 0;
  private readonly count = signal(0);
  private readonly message = signal<'' | 'requestCancelled' | 'cancellationUnconfirmed'>('');
  private readonly visible = signal(false);
  private shownAt = 0;
  private hideTimer?: ReturnType<typeof setTimeout>;
  readonly active = this.visible.asReadonly();
  readonly pendingCount = this.count.asReadonly();
  readonly notice = this.message.asReadonly();

  begin(cancel: CancelRequest): number {
    this.dismissNotice();
    if (this.requests.size === 0) {
      clearTimeout(this.hideTimer);
      this.shownAt = Date.now();
      this.visible.set(true);
    }
    const id = ++this.nextId;
    this.requests.set(id, cancel);
    this.count.set(this.requests.size);
    return id;
  }

  end(id: number): void {
    if (!this.requests.delete(id)) return;
    this.count.set(this.requests.size);
    if (this.requests.size) return;
    const remaining = Math.max(0, HttpLoadingService.MINIMUM_VISIBLE_MS - (Date.now() - this.shownAt));
    this.hideTimer = setTimeout(() => {
      if (!this.requests.size) this.visible.set(false);
    }, remaining);
  }

  cancelAll(): void {
    if (!this.requests.size) return;
    const version = ++this.noticeVersion;
    this.message.set('requestCancelled');
    // Snapshot first: a retry/new request must not be cancelled by an earlier click.
    [...this.requests.values()].forEach((cancel) =>
      cancel(() => {
        if (version === this.noticeVersion) this.message.set('cancellationUnconfirmed');
      })
    );
    if (!this.requests.size) {
      clearTimeout(this.hideTimer);
      this.visible.set(false);
    }
  }

  dismissNotice(): void {
    this.noticeVersion++;
    this.message.set('');
  }
}
