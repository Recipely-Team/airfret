import type { Settings } from '@domain/settings/settings';

/** Port for persisting settings. Never fails: unreadable storage yields defaults. */
export interface SettingsRepositoryInterface {
  load(): Settings;
  save(settings: Settings): void;
}
