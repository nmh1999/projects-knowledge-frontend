import {Component, computed, HostListener, inject, input, OnInit, output, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {LanguageService} from '@shared/service/language.service';
import {ThemeService} from '@shared/service/theme.service';
import {DesktopService} from '@shared/service/integration/desktop/desktop.service';
import {CodexService} from '@shared/service/integration/codex/codex.service';
import {DtoCodexStatus} from '@shared/schema/response/codex/DtoCodexStatus';
import {DtoCodexModel, DtoCodexSettings} from '@shared/schema/response/codex/DtoCodexSettings';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  private static readonly CODEX_SETTINGS_MAX_AGE_MS = 5 * 60 * 60 * 1000;
  private readonly desktop = inject(DesktopService);
  private readonly codex = inject(CodexService);
  private codexSettingsLoadedAt = 0;
  readonly language = inject(LanguageService);
  readonly theme = inject(ThemeService);
  readonly menuOpen = input(false);
  readonly menuToggle = output<void>();
  readonly shutdownDialogOpen = signal(false);
  readonly shuttingDown = signal(false);
  readonly shutdownComplete = signal(false);
  readonly shutdownError = signal(false);
  readonly cacheDialogOpen = signal(false);
  readonly clearingCache = signal(false);
  readonly cacheClearComplete = signal(false);
  readonly cacheClearError = signal(false);
  readonly codexStatus = signal<DtoCodexStatus | null>(null);
  readonly codexStatusLoading = signal(false);
  readonly codexDialogOpen = signal(false);
  readonly codexSettings = signal<DtoCodexSettings | null>(null);
  readonly codexSettingsLoading = signal(false);
  readonly codexSettingsError = signal(false);
  readonly codexSettingsSaving = signal(false);
  readonly selectedCodexModel = signal('');
  readonly selectedCodexEffort = signal('medium');
  readonly defaultCodexModel = computed(() => this.codexSettings()?.models.find((model) => model.defaultModel) ?? null);
  readonly selectedCodexModelDetails = computed<DtoCodexModel | null>(() => {
    const settings = this.codexSettings();
    if (!settings) return null;
    const selected = this.selectedCodexModel();
    return settings.models.find((model) => (selected ? model.id === selected : model.defaultModel)) ?? null;
  });
  readonly codexEffortOptions = computed(() => this.selectedCodexModelDetails()?.reasoningEfforts ?? []);
  readonly codexStatusText = computed(() => {
    this.language.current();
    const status = this.codexStatus();
    if (!status) return this.language.t(this.codexStatusLoading() ? 'codexChecking' : 'codexStatusUnknown');
    if (!status?.enabled) return this.language.t('codexDisabled');
    if (!status.connected) return this.language.t('codexUnavailable');
    if (!status.ready) return this.language.t('codexSignInRequired');
    const runtime = [status.model, status.reasoningEffort].filter(Boolean).join(' · ');
    return runtime ? `${this.language.t('codexReady')} · ${runtime}` : this.language.t('codexReady');
  });

  ngOnInit(): void {
    // Warm the reusable local connection and show readiness without loading the model catalog.
    this.loadCodexStatus();
  }

  openCodexSettings(): void {
    this.codexDialogOpen.set(true);
    const settingsAreFresh =
      this.codexSettings() !== null &&
      Date.now() - this.codexSettingsLoadedAt < HeaderComponent.CODEX_SETTINGS_MAX_AGE_MS;
    if (!settingsAreFresh) this.loadCodexSettings();
  }

  closeCodexSettings(): void {
    if (!this.codexSettingsSaving()) this.codexDialogOpen.set(false);
  }

  loadCodexSettings(): void {
    if (this.codexSettingsLoading()) return;
    this.codexSettingsLoading.set(true);
    this.codexSettingsError.set(false);
    this.codex.settings().subscribe({
      next: (settings) => {
        this.applyCodexSettings(settings);
        this.codexSettingsLoadedAt = Date.now();
        this.codexSettingsLoading.set(false);
      },
      error: () => {
        this.codexSettings.set(null);
        this.codexStatus.set({
          enabled: true,
          connected: false,
          ready: false,
          authenticationType: '',
          model: '',
          reasoningEffort: '',
          activeRequests: 0
        });
        this.codexSettingsError.set(true);
        this.codexSettingsLoading.set(false);
      }
    });
  }

  private loadCodexStatus(): void {
    if (this.codexStatusLoading()) return;
    this.codexStatusLoading.set(true);
    this.codex.status().subscribe({
      next: (status) => {
        this.codexStatus.set(status);
        this.codexStatusLoading.set(false);
      },
      error: () => {
        this.codexStatus.set({
          enabled: true,
          connected: false,
          ready: false,
          authenticationType: '',
          model: '',
          reasoningEffort: '',
          activeRequests: 0
        });
        this.codexStatusLoading.set(false);
      }
    });
  }

  selectCodexModel(model: string): void {
    this.selectedCodexModel.set(model);
    const details = this.selectedCodexModelDetails();
    if (!details) return;
    const efforts = details.reasoningEfforts.map((option) => option.value);
    if (!efforts.includes(this.selectedCodexEffort())) {
      this.selectedCodexEffort.set(details.defaultReasoningEffort || efforts[0] || 'medium');
    }
  }

  selectCodexEffort(effort: string): void {
    this.selectedCodexEffort.set(effort);
  }

  saveCodexSettings(): void {
    if (this.codexSettingsSaving() || !this.selectedCodexModelDetails()) return;
    this.codexSettingsSaving.set(true);
    this.codexSettingsError.set(false);
    this.codex
      .updateSettings({model: this.selectedCodexModel(), reasoningEffort: this.selectedCodexEffort()})
      .subscribe({
        next: (settings) => {
          this.applyCodexSettings(settings);
          this.codexSettingsLoadedAt = Date.now();
          this.codexSettingsSaving.set(false);
          this.codexDialogOpen.set(false);
        },
        error: () => {
          this.codexSettingsSaving.set(false);
          this.codexSettingsError.set(true);
        }
      });
  }

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
    this.closeCodexSettings();
  }

  private markShutdownComplete(): void {
    this.shuttingDown.set(false);
    this.shutdownComplete.set(true);
  }

  private applyCodexSettings(settings: DtoCodexSettings): void {
    this.codexSettings.set(settings);
    this.codexStatus.set(settings.status);
    this.selectedCodexModel.set(settings.selectedModel);
    this.selectedCodexEffort.set(settings.status.reasoningEffort);
  }
}
