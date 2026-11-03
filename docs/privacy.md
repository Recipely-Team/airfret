# Privacy and security

- **Video never leaves the device.** Frames go from the camera straight into MediaPipe running in
  WebAssembly/WebGL in the page. Nothing is uploaded; there is no backend.
- **Everything the app loads is first-party.** The hand model (`public/models/`), the MediaPipe WASM
  (`public/mediapipe/`, copied from npm at build time) and the worklet are served from the same
  origin. Only the Inter web font comes from Google Fonts.
- **What is stored:** settings and best scores in this browser's `localStorage`. Nothing else.
- **Headers** (`vercel.json`): a Content-Security-Policy limited to self + Google Fonts,
  `Permissions-Policy` allowing the camera only for this origin, `X-Content-Type-Options`,
  `Referrer-Policy`. The camera works only over HTTPS (or `localhost`).
- **Secrets:** the project needs none. `scripts/guard-secrets.mjs` blocks commits that stage
  anything that looks like a key or an `.env` file.
