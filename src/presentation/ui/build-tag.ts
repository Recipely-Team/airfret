import { byId } from '@presentation/ui/dom';

declare const __APP_VERSION__: string;
declare const __APP_COMMIT__: string;

/**
 * The version in the corner of every page — `v0.8.0 · 1a2b3c4` — so a player reporting a problem can say which
 * build they had. Filled once at start; the values are baked in by the build (`define` in vite.config.ts).
 */
export function showBuildTag(): void {
  const el = byId('buildTag');
  el.textContent = __APP_COMMIT__ ? `v${__APP_VERSION__} · ${__APP_COMMIT__}` : `v${__APP_VERSION__}`;
}
