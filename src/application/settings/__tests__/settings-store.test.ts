import { describe, expect, it } from 'vitest';
import { SettingsStore } from '@application/settings/settings-store';
import { DEFAULT_SETTINGS } from '@domain/settings/default-settings';
import type { Settings } from '@domain/settings/settings';
import type { SettingsRepositoryInterface } from '@domain/settings/settings-repository-interface';

class MemorySettingsRepository implements SettingsRepositoryInterface {
  saved: Settings | null = null;
  load(): Settings {
    return DEFAULT_SETTINGS;
  }
  save(settings: Settings): void {
    this.saved = settings;
  }
}

describe('SettingsStore', () => {
  it('persists every update and tells subscribers', () => {
    const repo = new MemorySettingsRepository();
    const store = new SettingsStore(repo);
    const seen: boolean[] = [];
    const unsubscribe = store.subscribe((s) => seen.push(s.isLefty));
    store.update({ isLefty: true });
    unsubscribe();
    store.update({ isLefty: false });
    expect(repo.saved?.isLefty).toBe(false);
    expect(seen).toEqual([true]);
  });
});
