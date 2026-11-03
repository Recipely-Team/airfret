import { DEFAULT_SETTINGS } from '@domain/settings/default-settings';
import type { Settings } from '@domain/settings/settings';
import type { SettingsRepositoryInterface } from '@domain/settings/settings-repository-interface';
import { StorageKey } from '@infrastructure/constants/storage';

/**
 * **LocalStorageSettingsRepository** — settings in this browser's localStorage.
 *
 * @remarks
 * - Private windows and blocked storage throw on access; both fall back to defaults silently.
 */
export class LocalStorageSettingsRepository implements SettingsRepositoryInterface {
  load(): Settings {
    try {
      const raw = localStorage.getItem(StorageKey.settings);
      return raw ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  save(settings: Settings): void {
    try {
      localStorage.setItem(StorageKey.settings, JSON.stringify(settings));
    } catch {
      // Storage unavailable: settings live for this session only.
    }
  }
}
