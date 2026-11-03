import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

const LAYERS = ['core', 'domain', 'application', 'infrastructure', 'presentation'];

/** The production security headers from vercel.json, served locally too so CSP breakage shows up in dev. */
const vercel = JSON.parse(readFileSync('vercel.json', 'utf8')) as { headers: { source: string; headers: { key: string; value: string }[] }[] };
const SECURITY_HEADERS = Object.fromEntries((vercel.headers[0]?.headers ?? []).map((h) => [h.key, h.value]));

export default defineConfig({
  resolve: {
    alias: Object.fromEntries(LAYERS.map((l) => [`@${l}`, fileURLToPath(new URL(`./src/${l}`, import.meta.url))])),
  },
  server: { port: 5180, headers: SECURITY_HEADERS },
  preview: { port: 5181, headers: SECURITY_HEADERS },
  build: { target: 'es2022' },
  test: {
    include: ['src/**/__tests__/**/*.test.ts'],
    coverage: {
      include: ['src/**'],
      exclude: ['src/**/__tests__/**', 'src/**/__fixtures__/**'],
      // Per-layer minimums sit just under the measured numbers: they only ever go up.
      // DOM and Web Audio code (presentation, infrastructure) is covered by docs/qa/manual.md.
      thresholds: {
        'src/core/**': { lines: 100 },
        'src/domain/**': { lines: 98, branches: 85 },
        'src/application/**': { lines: 93, branches: 75 },
      },
    },
  },
});
