// Structure gate — rules a type checker or linter cannot express.
//
//   A  one exported declaration per file (CLAUDE.md rule 1)
//   B  layer dependency rule (rule 2)
//   C  @layer aliases only — no relative imports in src/ (rule 3)
//   F  no source file over 300 lines; locale catalogues exempt (rule 5)
//   I  folders stay scannable: >15 files blocks, 11–15 warns (rule 6)
//   J  PROJECT-MAP.md is current (rule 7)
//   O  ports: *-interface.ts exports *Interface, and only ports use that suffix (rule 8)
//   T  English only — Turkish text lives in src/presentation/i18n/locales/ (rule 10)
//   U  every i18n key exists in every locale (rule 10)
//
// KNOWN_DEBT only shrinks. Adding to it needs the owner's explicit approval.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';
import { mapFingerprint } from './project-map.mjs';

const ROOT = 'src';
const KNOWN_DEBT = new Set([]);
const MAX_LINES = 300;
const FOLDER_WARN = 10;
const FOLDER_BLOCK = 15;
const EXEMPT_FOLDERS = ['__tests__', '__fixtures__'];
const LOCALES = `src${sep}presentation${sep}i18n${sep}locales`;

/** Which layers each layer may import. bootstrap/ is the composition root and may import anything. */
const ALLOWED = {
  core: ['core'],
  domain: ['core', 'domain'],
  application: ['core', 'domain', 'application'],
  infrastructure: ['core', 'domain', 'infrastructure'],
  presentation: ['core', 'domain', 'application', 'presentation'],
};

const errors = [];
const warnings = [];
const err = (rule, file, msg) => {
  const key = `${rule}:${file}`;
  if (!KNOWN_DEBT.has(key)) errors.push(`[${rule}] ${file}: ${msg}`);
};

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const files = walk(ROOT).filter((f) => f.endsWith('.ts'));
const isTest = (f) => f.split(sep).includes('__tests__');

for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const layer = file.split(sep)[1];
  const isRoot = file.includes(`${sep}bootstrap${sep}`);

  // A — one exported declaration.
  if (!isTest(file) && !file.endsWith('index.ts')) {
    const decls = [...text.matchAll(/^export (?:abstract )?(class|interface|type|enum) (\w+)/gm)].map((m) => ({ kind: m[1], name: m[2] }));
    const names = new Set(decls.map((d) => d.name));
    const otherExports = [...text.matchAll(/^export (?:async )?(?:function|const|let) (\w+)/gm)].map((m) => m[1]).filter((n) => !names.has(n));
    if (names.size > 1) err('A', file, `exports ${names.size} declarations (${[...names].join(', ')})`);
    if (decls.some((d) => d.kind === 'class') && otherExports.length) err('A', file, `a class file also exports ${otherExports.join(', ')}`);
  }

  // B, C — imports.
  for (const m of text.matchAll(/^import[^'"]*['"]([^'"]+)['"]/gm)) {
    const spec = m[1];
    if (spec.startsWith('.') && !file.endsWith('index.ts')) err('C', file, `relative import '${spec}' — use an @layer alias`);
    const target = /^@(core|domain|application|infrastructure|presentation)\//.exec(spec)?.[1];
    if (!target || isRoot || isTest(file)) continue;
    const isConstants = spec.startsWith('@infrastructure/constants/');
    if (!ALLOWED[layer]?.includes(target) && !(isConstants && layer !== 'domain')) err('B', file, `${layer} may not import ${target} ('${spec}')`);
    if (layer === 'domain' && /^(@mediapipe|vite)/.test(spec)) err('B', file, `domain imports a framework ('${spec}')`);
  }
  if (layer === 'domain' || layer === 'application') {
    if (/\b(document|window|localStorage|AudioContext|navigator)\./.test(text)) err('B', file, `${layer} touches a browser API — go through a port`);
  }

  // F — length.
  const lines = text.split('\n').length;
  if (lines > MAX_LINES && !file.startsWith(LOCALES)) err('F', file, `${lines} lines (max ${MAX_LINES})`);

  // O — ports.
  const portName = /^export interface (\w+Interface)\b/m.exec(text)?.[1];
  if (file.endsWith('-interface.ts') && !portName) err('O', file, 'a *-interface.ts file must export a *Interface port');
  if (portName && !file.endsWith('-interface.ts')) err('O', file, `${portName} must live in a *-interface.ts file`);

  // T — English only outside locale data.
  if (!file.startsWith(LOCALES) && /[ğĞışŞİ]/.test(text)) err('T', file, 'Turkish text outside src/presentation/i18n/locales/');
}

// I — folder sizes.
const dirs = new Map();
for (const f of walk(ROOT)) {
  const d = f.slice(0, f.lastIndexOf(sep));
  dirs.set(d, (dirs.get(d) ?? 0) + 1);
}
for (const [dir, count] of dirs) {
  if (EXEMPT_FOLDERS.some((x) => dir.endsWith(x))) continue;
  if (count > FOLDER_BLOCK) err('I', dir, `${count} files directly inside (max ${FOLDER_BLOCK}) — group by capability`);
  else if (count > FOLDER_WARN) warnings.push(`[I] ${dir}: ${count} files — look for a grouping`);
}

// J — project map freshness.
try {
  const map = readFileSync('PROJECT-MAP.md', 'utf8');
  if (!map.includes(`fingerprint: ${mapFingerprint()}`)) err('J', 'PROJECT-MAP.md', 'stale — run `npm run map`');
} catch {
  err('J', 'PROJECT-MAP.md', 'missing — run `npm run map`');
}

// U — locale parity.
const keysOf = (f) => new Set([...readFileSync(join(LOCALES, f), 'utf8').matchAll(/^\s*'([^']+)':/gm)].map((m) => m[1]));
const locales = readdirSync(LOCALES).filter((f) => f.endsWith('.ts'));
const reference = keysOf('en.ts');
for (const loc of locales) {
  const keys = keysOf(loc);
  for (const k of reference) if (!keys.has(k)) err('U', join(LOCALES, loc), `missing key '${k}'`);
  for (const k of keys) if (!reference.has(k)) err('U', join(LOCALES, loc), `key '${k}' not in en.ts`);
}

warnings.forEach((w) => console.warn(`warn ${w}`));
if (errors.length) {
  errors.forEach((e) => console.error(e));
  console.error(`\ncheck:structure — ${errors.length} problem(s). Rules are in CLAUDE.md; letters are listed at the top of this script.`);
  process.exit(1);
}
console.log(`check:structure — ${files.length} files OK${warnings.length ? `, ${warnings.length} warning(s)` : ''}.`);

