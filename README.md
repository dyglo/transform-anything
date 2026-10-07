# Transform

Anything in. Anything out. A browser-first transformation workspace.

## Run

Node 24 LTS recommended. `npm install`, then `npm run dev`. Open http://127.0.0.1:5173.

`npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build:production` validate the foundation. Run `npx playwright install chromium` once, then `npm run test:e2e` for browser acceptance tests. Test screenshots are written under `artifacts/`.

## First release

Reference-matched landing hero using the original `public/hero-bg.png`; anonymous PNG/JPEG/WebP import, crop, resize, rotate, conversion, lossy optimization, Remove BG, annotations/region editing, branching history, download, clipboard copy, and 24-hour local recovery. All image bytes remain on the device.

Remove BG uses a compact U²-Net model in a dedicated browser worker. It lazily loads approximately 18 MiB of model/runtime assets from this app's origin; it never uploads the image or calls a removal service. Output is a transparent PNG at original dimensions. See `public/models/README.md` for provenance, checksums, and license files. Automatic segmentation works best for clear subjects; fine hair and complex scenes may require further editing. A browser with OffscreenCanvas/worker support is required for this operation; simpler transformations retain their existing fallback.

## Deployment

Cloudflare Workers Static Assets + Vite plugin. `npm run build` creates a local-target build; `npm run build:staging` and `npm run build:production` select the named environment at build time through their mode-specific `.env` files. These files contain only public environment names, never secrets. `npm run deploy:staging` and `npm run deploy:production` require your Cloudflare authentication and publish the corresponding generated build. Nothing is provisioned by installing or developing the app. No cloud resource bindings are needed for this release. Generated deployment configuration lives under `dist/`; use the npm scripts rather than deploying the source configuration directly. API, auth, R2, D1, Queues, and Workflows remain future additions.

## Development handoff

Start with [docs/README.md](docs/README.md) for the reading order, current milestone, and documentation rules. [docs/DEVELOPMENT_TRACKER.md](docs/DEVELOPMENT_TRACKER.md) is the task status ledger; [docs/NEXT_TASK.md](docs/NEXT_TASK.md) defines the next implementation and its acceptance checks. Product, architecture, transformation, privacy, roadmap, and verified implementation details all live in `docs/`.

If the environment provides system Chromium and browser downloads are restricted, run `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e`. The override is optional; other environments keep Playwright's managed-browser default. Browser tests verify actual processing, exports, graph recovery and mobile gestures.
