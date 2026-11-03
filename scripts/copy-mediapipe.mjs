// Copies the MediaPipe WASM runtime into public/ so the app runs without a CDN.
import { cpSync, existsSync, mkdirSync } from 'node:fs';

const src = 'node_modules/@mediapipe/tasks-vision/wasm';
const dst = 'public/mediapipe';
if (!existsSync(src)) {
  console.error('MediaPipe not installed — run npm install first.');
  process.exit(1);
}
mkdirSync(dst, { recursive: true });
cpSync(src, dst, { recursive: true });
