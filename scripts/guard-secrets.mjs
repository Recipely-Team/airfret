// Blocks a commit that stages something that looks like a credential.
// Usage: node scripts/guard-secrets.mjs --staged

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const PATTERNS = [
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'private key'],
  [/\bAKIA[0-9A-Z]{16}\b/, 'AWS access key'],
  [/\bgh[pousr]_[A-Za-z0-9]{36,}\b/, 'GitHub token'],
  [/\bsk-[A-Za-z0-9_-]{20,}\b/, 'API secret key'],
  [/\bAIza[0-9A-Za-z_-]{35}\b/, 'Google API key'],
  [/\b(?:vercel|VERCEL)_?TOKEN\s*[:=]\s*['"]?[A-Za-z0-9]{20,}/, 'Vercel token'],
];
const BLOCKED_FILES = [/(^|\/)\.env(\..*)?$/, /\.pem$/, /\.p12$/, /(^|\/)\.vercel\//];
const BINARY = /\.(task|wasm|png|jpg|ico|woff2?)$/;

const files = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' }).split('\n').filter(Boolean);
const problems = [];
for (const f of files) {
  if (BLOCKED_FILES.some((r) => r.test(f)) && !f.endsWith('.env.example')) problems.push(`${f}: this kind of file never belongs in git`);
  if (BINARY.test(f)) continue;
  let text = '';
  try {
    text = readFileSync(f, 'utf8');
  } catch {
    continue;
  }
  for (const [re, what] of PATTERNS) if (re.test(text)) problems.push(`${f}: looks like a ${what}`);
}
if (problems.length) {
  problems.forEach((p) => console.error(`guard-secrets: ${p}`));
  process.exit(1);
}
