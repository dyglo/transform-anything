# Implementation status

## DEP-01 — Vercel repair, 8 October 2026

IN PROGRESS pending production acceptance. Root `vercel.json` fixes the proven `dist` versus `dist/client` mismatch and supplies production build/SPA routing. Formatting, lint, typecheck, 49 unit tests, production build and whitespace checks pass. Local dev browser run: 21 pass / one real Remove BG timeout. Production-mode Vercel preview: READY; HTTP 200 homepage/workspace and correct asset MIME; all 22 Chromium desktop/mobile scenarios pass, including real background inference, Combine → Frame → Resize → WebP/export, pixel output, recovery and failure preservation. Screenshots reviewed; browser smoke has no page errors. Playwright accepts a deployed base URL and no-upload assertions derive its origin. [PR #4](https://github.com/dyglo/transform-anything/pull/4) is open/unmerged; production still returns 404. [DEPLOYMENT.md](DEPLOYMENT.md) records deployment IDs, tested preview, actual commands/results, limits and exact post-merge checks. No production success claimed; DC-01 stays TODO.

Updated: 7 October 2026. The stable ledger is [DEVELOPMENT_TRACKER.md](DEVELOPMENT_TRACKER.md). The next task is [DC-01: first local Document/PDF slice](NEXT_TASK.md).

## Repository inspection and preservation

The clean input repository at `1d569d9` already contained React/Vite/TypeScript, npm lockfile, Zustand/Radix/Tailwind/Lucide, the supplied landscape/branding, the shared image engine, ONNX Remove BG, annotations, IndexedDB and tests. It had no deployed cloud resources or bindings. Existing work/assets/licenses were retained. See [REPOSITORY_INSPECTION.md](REPOSITORY_INSPECTION.md).

## Architecture actually implemented

Object → Registry → Engine → Executor → New Object → Graph. MIME compatibility, validated parameter contracts, local Canvas/image/background executors, fresh output objects, operation records and graph branching are real. Storage references separate bytes from metadata. IndexedDB writes graph and bytes atomically, serialized across save/clear; the local session expires 24 hours after creation with lazy cleanup. Preview/download URLs are revoked.

This task added byte-signature image detection with MIME normalization, typed engine errors, independent parameter snapshots taken before async execution, and a fresh-output identity check. Structured annotation version 1 recovery remains supported; new version 2 region parameters are validated and retained. SS-03 extends actual defaults/validation/executor contracts to ordered arrays and declared counts. Many-to-one, one-to-many and many-to-many engine/graph/storage paths are verified. Combine is a real multi-input tool; exposed image operations currently produce one reusable image.

## Product experience

Input-first landing with unchanged landscape/hero branding, browse/drop/clipboard image input and secondary ten-family discovery. Supported types and planned families are explicit. Workspace includes compatible actions, scaled preview, accessible parameters/draft controls, original/intermediate history, branching, continued transformations and copy/download. Desktop and 390px mobile interactions are verified. Original-retention/redaction disclosure is visible in the editor; pending drafts are tab-local and warn on reload.

## Real transformations

- Crop, pointer/touch crop handles, aspect-aware resize, rotate, PNG/JPEG/WebP convert, JPEG/WebP optimize.
- Local ONNX Remove BG → original-size transparent PNG; lazy same-origin model/runtime assets.
- Screenshot Studio: text, arrows, rectangle outlines, highlights, region blur and opaque redaction through the shared Annotate operation.
- Frame: padding, transparent/solid backgrounds, optional outside border and rounded source corners → PNG. Combine: 2–8 ordered images, horizontal/vertical, gaps/alignment/native or proportional common sizing → PNG.
- Blur is a deterministic premultiplied box filter with a 1–64 source-pixel radius, capped at 4 megapixels of regions per operation.
- Redaction rounds edges outward and replaces covered RGB/alpha with an opaque color. Downloads contain only committed output pixels. Original/session bytes remain until clear/expiry; blur is cosmetic.

## Transformation chains verified

1. Image → crop → resize → WebP → download; separate JPEG branch and recovery.
2. Screenshot → text/arrow/outline/highlight → new PNG → resize → WebP → copy/download; original branch and refresh.
3. Image → redaction + blur → downloaded PNG (exact full-preview/pixel comparison) → crop → resize → WebP → optimize → download → refresh → new original branch.
4. Image → real background inference → transparent PNG → resize → download → recovery.

No intermediate download/re-upload is required. Network checks observed no image/content uploads or third-party processing. The existing clipboard test checks the browser write integration; denied permission is separately exercised.

## Ten-family status

| Family            | Status                                                | Remaining work                                                                       |
| ----------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Screenshot Studio | Tested, partial; SS-01/SS-02/SS-03 done               | Freeform editing and further presets                                                 |
| Compare           | Planned                                               | Two-input selection, alignment, slider/overlay/difference                            |
| Image Prep        | Tested, partial                                       | Metadata and additional background controls                                          |
| ShareCard         | Planned                                               | Typed text input and shared compositions; URL later                                  |
| Document Clean    | Planned                                               | Local PDF input/operations proving multi-output; advanced redaction/signatures later |
| Data → Visual     | Planned                                               | Typed data input, cleaning, charts/tables                                            |
| Mockup            | Planned                                               | Licensed browser/device templates using delivered composition                        |
| File Transformer  | Tested shared image conversion; other formats planned | Real browser-supported document/media codecs                                         |
| Text → Visual     | Planned                                               | Text objects and designed visual templates                                           |
| Web Capture       | Planned; cloud prerequisite deferred                  | Secure URL/capture/job/storage slice                                                 |

## Cloudflare foundation

Workers Static Assets/Vite/Wrangler local/staging/production targets are configured and build. Production Wrangler dry run passes without bindings. R2 byte references and cloud-job/browser-capture/external executor requirements are typed extension points; ARCHITECTURE.md documents Workers/R2/D1/KV/Queues/Workflows/Durable Objects/Browser Run/external boundaries and prerequisites. No processing API or speculative resources were added.

No Cloudflare credentials or identities are configured in this environment. Live deployment and resource provisioning remain unavailable and unverified; they do not block local use. Nothing was deployed or provisioned.

## Validation — 7 October 2026

| Check                                                                    | Result                                      |
| ------------------------------------------------------------------------ | ------------------------------------------- |
| `npm run format:check`                                                   | Pass                                        |
| `npm run lint`                                                           | Pass, zero ESLint errors                    |
| `npm run typecheck`                                                      | Pass                                        |
| `npm test`                                                               | 49 unit tests pass across 11 files          |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e` | 22 browser scenarios pass                   |
| `npm run build:production`                                               | Pass; generated target transform-production |
| `npx wrangler deploy --dry-run` after production build                   | Pass; no bindings; no deployment            |
| `npm run build:staging`                                                  | Pass; generated target transform-staging    |
| `npm run build`                                                          | Pass; generated target transform-local      |
| `git diff --check` and documentation local-link check                    | Pass                                        |

Browser tests cover desktop/mobile input, pointer/touch/keyboard editing, actual output pixels and transparency, graph/branching/recovery, v1 provenance compatibility, malformed parameters, damaged/mislabelled input, model/encoding/clipboard/storage failures, expiry/clear and object URL cleanup. Desktop/mobile screenshots under ignored artifacts were reviewed. Chromium is the browser validated in this environment; other browser engines were not exercised. No new automated accessibility audit was run; keyboard/mobile/accessibility semantics are covered by the interaction checks.

Managed Playwright browser download was denied by network policy; system Chromium was used through the optional config override. Local Cloudflare dev logs report unavailable Request.cf metadata and use a placeholder; local transformation tests pass. Early browser runs were interrupted by editing/building while the dev server was active; the complete stable final run passes. Run builds after browser tests to avoid dev reloads.

## Documentation and remaining work

Created catalog, design system and repository inspection; retained the supplied cloud request under sources. Updated product, architecture, transformation system, privacy, status ledger, roadmap, next-task brief, docs index and root AGENTS.md. The entire ten-family long-term vision remains documented.

Important remaining work: Compare/Mockup, typed text/data/URL/PDF input, batches/ZIP, recipes, additional formats, secure cloud capture and opt-in persistence/sharing. They have no inert processing buttons. Existing original assets remain untouched.

## Exact next task

**DC-01: first local Document/PDF vertical slice, using the delivered multi-input/output contract.** See NEXT_TASK.md for dependencies, engineering entry points and acceptance checks. There is no blocker for this local next slice. Remote provisioning/deployment needs Cloudflare credentials and a separate release request.

## SS-03 contract increment — 7 October 2026

Historical increment (before final composition delivery): array execution, declared input/output cardinality, all-input compatibility, atomic graph commits and multi-output storage recovery are implemented. 39 unit tests, all 15 existing browser scenarios, lint/typecheck/format and production build passed for this increment. At that checkpoint concrete frame/combine operations and workspace selection remained pending; final completion evidence follows.

## SS-03 completion — 7 October 2026

DONE after final acceptance: shared geometry/validation, local PNG rendering, ordered multi-input selection and live preview, frames/padding/backgrounds/borders/rounded corners, horizontal/vertical image combining, reusable output chaining, every-parent history and atomic persistence. No new dependency, cloud binding or external processing.

Verified new chains: Combine → Frame → Resize → WebP → Optimize → Export; composition → Crop → Highlight; Frame → Redact → Resize → WebP. Full-resolution rounded-frame preview and downloaded PNG pixels match exactly. Unequal input sizes, alpha, gaps, vertical proportional fit, ordered parents, snapshots, independent original branches and refresh recovery are checked. Invalid source counts/types/IDs/dimensions, missing bytes, excessive allocation, encoding failure, cancelled preview and quota/storage recovery preserve prior work. Bitmaps, canvas backing and transient preview URLs release on failure/change/clear. Desktop, 390px keyboard and real touch selection/order/apply pass with no page overflow. Existing image/background/annotation/blur/redaction chains remain passing.

Current final verification: format check, lint, typecheck, 49 unit tests across 11 files, 22 system-Chromium browser scenarios, production build and git diff whitespace/local documentation links pass. The staging/local builds and Wrangler dry-run rows above describe earlier prerequisite verification; no new deployment occurred. Screenshots are ignored verification artifacts.

Limits: 2–8 Combine sources; source total and output each at most 40 megapixels / 16,384px sides. Full-resolution Canvas composition uses the main thread, so large supported images can occupy it while drawing; worker/caching optimization is deferred. Native size preserves pixels; common-size matching preserves aspect ratio with integer rounding; corners are rasterized. Composition drafts are transient and not recovered after refresh; applied settings/bytes are recovered. PDF import/preview/tools, real product multi-output transformations, Compare/Mockup and other families remain planned. Contract tests prove multi-output graph/byte behavior without claiming PDF exists. Only Chromium was exercised.

Next task is DC-01 local Document/PDF detection/import/preview, merge/split/reorder/extract/page-to-PNG through the common pipeline. Its priority ahead of Compare/Mockup records the user’s explicit direction; the complete ten-family vision remains intact. No local SS-03 implementation blocker remains.

## Review fixes — PRs #1–#3, 7 October 2026

Reviewed the actual stacked changes against the shared architecture and preserved the prerequisite commit ancestry. PR #1 needed no code correction. PR #2 now rejects sparse executor output arrays and non-string identities as typed INVALID_OUTPUT failures, including excessive-output regression coverage. PR #3 keeps Combine's layout, source selection and ordering while importing additional images or selecting history within the same session, and releases the backing canvas when context allocation fails. New tests reproduced both PR #3 issues before the fixes.

Fresh review validation: format, lint, typecheck, 49 unit tests / 11 files, all 22 desktop/mobile Chromium browser scenarios, production build, whitespace and local Markdown links. GitHub has no configured status checks/workflow runs on these PR heads; local results supply the validation evidence. Final integration requires the same checks on main after the strict #1 → #2 → #3 merge sequence. DC-01 remains the next task; no PDF implementation or deployment is included.
