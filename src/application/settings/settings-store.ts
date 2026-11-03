import type { Settings } from '@domain/settings/settings';
import type { SettingsRepositoryInterface } from '@domain/settings/settings-repository-interface';

/**
 * **SettingsStore** — the current settings, persisted on every change.
 *
 * @remarks
 * - Listeners run after each `update`, so UI and audio follow one source of truth.
 */
export class SettingsStore {
  private current: Settings;
  private readonly listeners = new Set<(s: Settings) => void>();

  constructor(private readonly repo: SettingsRepositoryInterface) {
    this.current = repo.load();
  }

  get value(): Settings {
    return this.current;
  }

  update(patch: Partial<Settings>): void {
    this.current = { ...this.current, ...patch };
    this.repo.save(this.current);
    this.listeners.forEach((l) => l(this.current));
  }

  subscribe(listener: (s: Settings) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
