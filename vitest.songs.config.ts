import { defineConfig } from 'vitest/config';
import base from './vite.config.ts';

/**
 * Real-song audio tests (`npm run test:songs`): render each piece offline with the real samples and
 * compare it with its score and, for the Prelude, with Pablo Casals' recording. Needs ffmpeg and
 * downloads public-domain references into tools/songs/.cache on first run, so it is a separate gate.
 */
export default defineConfig({
  resolve: base.resolve,
  test: { include: ['tests/songs/**/*.test.ts'], testTimeout: 600_000, hookTimeout: 600_000 },
});
