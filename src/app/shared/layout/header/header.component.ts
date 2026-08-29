import {DOCUMENT} from '@angular/common';
import {Component, HostListener, inject, input, output, signal} from '@angular/core';
import {LanguageService} from '@shared/service/language.service';
import {ThemeService} from '@shared/service/theme.service';
import {DesktopService} from '@shared/service/integration/desktop/desktop.service';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  private readonly document = inject(DOCUMENT);
  private readonly desktop = inject(DesktopService);
  readonly language = inject(LanguageService);
  readonly theme = inject(ThemeService);
  readonly menuOpen = input(false);
  readonly menuToggle = output<void>();
  readonly desktopEnabled = signal(
    new URLSearchParams(this.document.defaultView?.location.search ?? '').get('desktop') === 'true'
  );
  readonly shutdownDialogOpen = signal(false);
  readonly shuttingDown = signal(false);
  readonly shutdownComplete = signal(false);
  readonly shutdownError = signal(false);
  readonly cacheDialogOpen = signal(false);
  readonly clearingCache = signal(false);
  readonly cacheClearComplete = signal(false);
  readonly cacheClearError = signal(false);

  openCacheDialog(): void {
    this.cacheClearComplete.set(false);
    this.cacheClearError.set(false);
    this.cacheDialogOpen.set(true);
  }

  closeCacheDialog(): void {
    if (!this.clearingCache()) this.cacheDialogOpen.set(false);
  }

  clearCache(): void {
    if (this.clearingCache()) return;
    this.clearingCache.set(true);
    this.cacheClearError.set(false);
    this.desktop.clearCache().subscribe({
      next: () => {
        this.clearingCache.set(false);
        this.cacheClearComplete.set(true);
      },
      error: () => {
        this.clearingCache.set(false);
        this.cacheClearError.set(true);
      }
    });
  }

  openShutdownDialog(): void {
    this.shutdownError.set(false);
    this.shutdownDialogOpen.set(true);
  }

  closeShutdownDialog(): void {
    if (!this.shuttingDown() && !this.shutdownComplete()) this.shutdownDialogOpen.set(false);
  }

  shutdown(): void {
    if (this.shuttingDown() || this.shutdownComplete()) return;
    this.shuttingDown.set(true);
    this.shutdownError.set(false);
    this.desktop.shutdown().subscribe({
      next: () => this.markShutdownComplete(),
      error: (response) => {
        // The local server may close the connection while the accepted response is in flight.
        if (response.status === 0) {
          this.markShutdownComplete();
          return;
        }
        this.shuttingDown.set(false);
        this.shutdownError.set(true);
      }
    });
  }

  @HostListener('document:keydown.escape')
  closeShutdownDialogFromKeyboard(): void {
    this.closeShutdownDialog();
    this.closeCacheDialog();
  }

  private markShutdownComplete(): void {
    this.shuttingDown.set(false);
    this.shutdownComplete.set(true);
  }
}
