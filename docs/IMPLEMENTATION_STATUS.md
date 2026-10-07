# Implementation status

Updated: 6 October 2026. Task statuses live in [DEVELOPMENT_TRACKER.md](DEVELOPMENT_TRACKER.md). The next proposed implementation is [SS-01: Screenshot Studio annotations](NEXT_TASK.md); it has not started.

## Implemented

- React/Vite/TypeScript/Tailwind application with Radix Select, Switch and clear-session confirmation; Zustand session state.
- Transform landing hero using the unchanged landscape; input, product explanation, and truthful ten-family roadmap.
- Image import, draggable crop corners and selection with synchronized numeric fields, aspect-aware resize, rotation, PNG/JPEG/WebP conversion, JPEG/WebP quality controls.
- Remove BG: real local U²-Net inference, lazy same-origin model/runtime assets, loading/processing feedback, and original-size transparent PNG output through the common engine.
- Shared registry, resolver, executor contract, worker rendering, non-destructive graph and branching.
- Multiple import roots, download, PNG clipboard export, 24-hour IndexedDB recovery, clear session, visible failures and preview URL cleanup.
- Local/staging/production Cloudflare Workers Static Assets configuration, no cloud resource provisioning.
- Focused engine/storage/render tests and browser workflow tests.
- Documentation consolidated under `docs/`, including full family scope, retained source briefs, a stable task ledger, next-task acceptance checks, and root agent handoff/update conventions.

## Deferred

Annotation, compare, broader canvas editing, bulk transforms/ZIP export, recipes, text/URL/PDF/data/media capabilities, sharing, accounts, remote storage/processing, jobs, web capture and persistent projects. Cloud storage reference types are architectural extension points, not functional cloud implementations.

## Verification

Verified on 6 October 2026:

- Type checking and source formatting checks passed.
- 19 unit tests passed: registry/parameter validation, graph branching, executor failures, storage recovery/expiry, encoder fallback, transparency, main-thread Canvas fallback, crop bounds/corner anchoring, background model preprocessing, and soft-matte normalization.
- Eight browser acceptance scenarios passed, covering desktop/mobile landing, chained WebP export and JPEG branch, refresh/clear, invalid and corrupt inputs, clipboard denial, quota failure, clipboard paste, fallback processing, preview URL cleanup, expired-byte deletion, scaled portrait crop dragging/movement/keyboard adjustment, real mobile touch cropping, real background inference with alpha/chaining/export/recovery, and model-load failure preserving history.
- Browser workflow recorded no non-GET network requests during image processing and no page errors.
- Production and staging builds selected their correct Cloudflare targets; the production Wrangler deployment dry run passed with no bindings. No resources were provisioned and nothing was deployed.
- Hero reviewed at the reference aspect ratio (1293 × 828) and on a 390px mobile viewport. Workspace desktop/mobile screenshots reviewed.
- Automated accessibility audits found no violations after contrast fixes; hero contrast over the image background requires manual review because the scanner cannot resolve its pseudo-element background.

Browser screenshots and accessibility reports are saved under ignored `artifacts/`. The supplied raster reference supports composition matching, not a claim of source-level or font-level identity. Live account deployment is intentionally unverified.

## Current limitations and extension points

- Core Image Prep is working; this does not complete the full ten-family product. Annotation, blur/redaction, frames and Compare are not implemented.
- Graph operation records support input/output arrays, but the current executor executes one image into one output. True multi-input/output execution, batch controls and recipes need additional implementation.
- Remove BG is automatic segmentation; fine hair and complex scenes may need editing. Its first use loads about 18 MiB of same-origin model/runtime assets, and requires Worker/OffscreenCanvas support. Output retains original dimensions; processing failure leaves the original active.
- Current parameters are primitive values. Annotation requires a deliberate structured, versioned schema extension and compatible persistence handling.
- Other object/storage/execution types in interfaces are extension points. Text/PDF/data/URL inputs, cloud storage/jobs/auth and remote executors are not working implementations.
- Documentation maintenance marks verified features done and identifies the next task; it does not automatically start that task.
