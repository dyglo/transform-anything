# Development tracker

Updated: 7 October 2026. This is the authoritative task status ledger.

**Active task: SS-03 — background/frame/padding and combine images.** SS-01 and SS-02 are DONE after current acceptance verification. The roadmap order is preserved.

## Status rules

- `TODO`: eligible planned work; not implemented.
- `IN PROGRESS`: implementation or verification is incomplete.
- `DONE`: acceptance checks passed; completion evidence recorded.
- `BLOCKED`: a specific unresolved dependency prevents progress; record it and the next action.
- `DEFERRED`: later work requiring further design, evidence, or product decisions.

Maintain stable IDs. Begin the first eligible task within the user's requested scope. Do not mark a family done merely because one shared operation works. Record validation actually performed; never carry forward an old passing test count as evidence for new code.

## Delivered tasks

All tasks below completed by 6 October 2026. Detailed existing verification is in [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md).

| ID     | Task                                                                             | Status | Implementation / completion evidence                                                                                                                                             |
| ------ | -------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-01   | App, shared objects, registry, executor and branching graph                      | DONE   | `src/core/`, `src/state/workspace.ts`, `src/executors/local.ts`; registry, validation, failure and branching tests                                                               |
| F-02   | Reference hero, universal image input, responsive workspace and family discovery | DONE   | `src/pages/`, `src/ui/InputDrop.tsx`, `src/styles.css`; desktop/reference/mobile review and browser checks                                                                       |
| F-03   | Browser storage, 24-hour recovery/cleanup and export                             | DONE   | `src/storage/objects.ts`, `src/core/export.ts`, `src/ui/useObjectUrl.ts`; refresh, expiry, clear, quota, clipboard and URL cleanup checks                                        |
| F-04   | Cloudflare local/staging/production configuration                                | DONE   | `vite.config.ts`, `wrangler.jsonc`, mode env files; builds and Wrangler dry run, no deployment/provisioning                                                                      |
| IP-01  | Crop, aspect-aware resize, rotate, PNG/JPEG/WebP conversion and quality          | DONE   | `src/core/registry.ts`, `src/executors/render.ts`, worker, properties; chain/export/branch tests, encoder and alpha checks                                                       |
| IP-02  | Drag crop corners and move crop, numeric synchronization                         | DONE   | `src/ui/CropOverlay.tsx`, `src/ui/cropGeometry.ts`; bounds/anchors, scaled portrait, keyboard and mobile touch tests                                                             |
| IP-03  | Remove BG                                                                        | DONE   | `src/executors/background.worker.ts`, `removeBackground.ts`, model assets; real alpha/chaining/export/recovery and model failure checks; dedicated worker and same-origin assets |
| DOC-01 | Complete docs index, full scope, status ledger and next-agent brief              | DONE   | `docs/` and root `AGENTS.md` reading/update rules; source briefs preserved with superseded decisions explained; document formatting/link checks                                  |

Current verification on 7 October 2026: 34 unit tests and 15 browser scenarios passed. Typecheck, ESLint, Prettier, production/staging/local builds and production Wrangler dry run pass. See IMPLEMENTATION_STATUS.md for current evidence. Earlier records below retain their historical dates.

## Ordered implementation queue

Dependencies identify prerequisites, not permission to expand a requested feature. Each row's acceptance summary must become concrete checks in `NEXT_TASK.md` before implementation.

| Order | ID    | Deliverable                                                                           | Status      | Dependencies                                                       | Acceptance summary                                                                                                                                                        |
| ----- | ----- | ------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | SS-01 | Screenshot Studio annotation editor: text, arrows, rectangles, highlights             | DONE        | F-01–03, IP-01                                                     | Draft selection/edit/move/resize, local apply to new PNG node, source preserved, mouse/touch/keyboard, chaining/export/recovery                                           |
| 2     | SS-02 | Region blur and opaque redaction                                                      | DONE        | SS-01                                                              | Accurate source-pixel regions; irreversible pixel overwrite in redacted output; blur described as cosmetic; original retained and visibly disclosed                       |
| 3     | SS-03 | Background/frame/padding and combine images                                           | IN PROGRESS | SS-01; multi-input contract work                                   | Composition bounds and alpha correct; every source referenced; multi-input graph, export and storage recovery                                                             |
| 4     | CP-01 | Compare: side-by-side, overlay/opacity, slider, synchronized zoom and difference      | TODO        | Multi-input contract work from SS-03                               | Two source selection; explicit unequal-size alignment; deterministic difference; keyboard slider; exportable comparison creates graph output                              |
| 5     | MK-01 | Mockup: browser and device frames                                                     | TODO        | SS-03                                                              | Accurate image fit/crop, licensed assets, local compositing, transparency and export; more template types remain planned                                                  |
| 6     | IN-01 | Text/CSV/JSON/pasted-table input and type-aware previews                              | TODO        | F-01–03                                                            | Validated object detection, compatible actions, explicit invalid encoding/schema errors, persisted local bytes/metadata                                                   |
| 7     | SC-01 | ShareCard: image/text cards                                                           | TODO        | SS-01, IN-01                                                       | Safe text rendering, editable templates, graph-linked PNG output; URL enrichment remains later                                                                            |
| 8     | TV-01 | Text → Visual: quote, code and statistics cards                                       | TODO        | IN-01, shared composition                                          | Text/code safely treated as content, templates and accessible editing, export and graph retention                                                                         |
| 9     | DC-01 | Document Clean: local PDF merge/split/reorder/extract and page-to-image               | TODO        | Multi-input/output executor extension                              | Selected library/license review, corrupt/encrypted PDF errors, real page order/content, multiple output objects chain to image tools                                      |
| 10    | DV-01 | Data → Visual: clean tables and basic charts                                          | TODO        | IN-01                                                              | Parsing, headers/types/missing-value handling, deterministic chart/table, downloadable data/image outputs, no executable pasted content                                   |
| 11    | FT-01 | Local File Transformer formats beyond existing images                                 | TODO        | IN-01, DC-01                                                       | Define explicit supported formats first; valid round trips, correct MIME/extension, unsupported codecs remain explicit                                                    |
| 12    | BT-01 | Bulk image transforms and ZIP export                                                  | TODO        | F-01–03, IP-01                                                     | Multi-selection, bounded processing, progress/per-item failure, cancellation, each output in graph, safe/collision-free ZIP names                                         |
| 13    | RC-01 | Personal local recipes                                                                | TODO        | Versioned operation schemas; representative visual/data operations | Save/replay versioned steps, new-input compatibility, failure isolation, storage policy and deletion, no account required                                                 |
| 14    | IP-04 | Image metadata inspection/removal and additional background controls                  | TODO        | IP-01, IP-03                                                       | Define supported metadata and controls; verify raw import metadata vs re-encoded output; no unsupported metadata-preservation claims                                      |
| 15    | CL-01 | First secure cloud job/storage slice                                                  | DEFERRED    | Actual cloud feature requirements                                  | Explicit byte-upload disclosure, typed bindings, ownership/expiry, idempotency/retry/cancel, cleanup and rate limits; provisioning separately authorized                  |
| 16    | WC-01 | Web Capture with Cloudflare Browser Run                                               | DEFERRED    | CL-01, URL input                                                   | Full network/redirect/subresource SSRF controls, resource limits, screenshot/PDF outputs in same graph, failed job cleanup                                                |
| 17    | SC-02 | URL-derived ShareCards                                                                | DEFERRED    | SC-01, WC-01 or secure metadata fetch                              | Safe URL input/fetch, source attribution, explicit remote processing and fallback, graph/export                                                                           |
| 18    | DC-02 | Advanced documents: compression/annotation/signature/redaction and Office conversions | DEFERRED    | DC-01; executor suitability evaluation                             | Distinguish signature image from digital signature; genuine PDF redaction removes sensitive content; inspect content/layers; constrained cloud/native execution if needed |
| 19    | FT-02 | Audio/video/archive/spreadsheet/ebook and heavy conversions                           | DEFERRED    | FT-01; suitability evaluation, CL-01 where needed                  | Select formats per task, bounded resources and codec support; originals retained, valid outputs and failures; external compute only with justification                    |
| 20    | P-01  | Opt-in accounts, saved projects/history/preferences and persistent recipes            | DEFERRED    | Demonstrated persistence need and privacy design                   | Replaceable auth, authorization/ownership, retention/deletion, migrations, anonymous quick workflow preserved                                                             |
| 21    | P-02  | Sharing and shared/public/community recipes                                           | DEFERRED    | RC-01, P-01, cloud access design                                   | Explicit publish intent, revocation/expiry/access controls, safe recipe validation and no accidental publication                                                          |

IN-01 precedes ShareCard and Text → Visual because they need real text input objects; this makes that prerequisite explicit within the original visual/local-format roadmap. Multi-input/output execution must become real before Compare/combine/PDF tasks; graph array fields alone are insufficient. SS-03 introduces multi-input composition; DC-01 extends execution for multiple outputs. Record those contract changes in the architecture and transformation docs.

## Completion record template

Append a record when marking a future task done:

```text
Task ID / title:
Completed on:
Scope delivered:
Changed implementation files:
Acceptance checks and outcomes:
Commands run and results:
Limitations / remaining family scope:
Docs / UI availability updated:
Next eligible task and prerequisite work:
```

## Handoff record — DOC-01

- Completed on: 6 October 2026.
- Scope: consolidated specifications under `docs/`; expanded ten-family requirements; retained original source briefs; introduced stable task statuses and explicit SS-01 brief; added agent completion/update rules.
- Validation: documentation formatting and local Markdown links checked. Runtime behavior unchanged; the image-release baseline remains the latest application verification.
- Next eligible task: SS-01. Its acceptance criteria are in [NEXT_TASK.md](NEXT_TASK.md).

## Cloud continuation start record — 7 October 2026

At task start, inspected the clean existing repository and began SS-01 baseline verification. Marked SS-02 IN PROGRESS before application edits. Its scope was local source-pixel blur and irreversible opaque output masks in the same annotation editor/engine, explicit original retention, chaining/export/recovery and pointer/touch/keyboard validation. Bulk implementation was incorrectly marked active; it remains TODO because no bulk execution or ZIP UI exists. Current user request authorizes useful continuation; no infrastructure provisioning is needed.

## Completion record — SS-01 verification and SS-02 delivery

- Completed on: 7 October 2026. SS-01 implementation already existed in the clean input repository; this task verified it and repaired stale handoff records rather than rebuilding it. SS-02 adds real blur and opaque redaction.
- Scope: all six annotation/region kinds, per-source drafts, move/resize/delete/undo/redo, shared-engine PNG output, source retention disclosure, chained exports and local recovery.
- Implementation: `src/core/annotations.ts`, `types.ts`, `registry.ts`, `regions.ts`; `src/executors/annotations.ts`, `regionPixels.ts`; `src/ui/AnnotationEditor.tsx`, `src/styles.css`, `src/state/workspace.ts`, landing discovery.
- Foundation hardening: signature-based PNG/JPEG/WebP detection and MIME normalization; independent validated parameter snapshots and typed engine failures; new-output identity check; transient quality-control NaN fallback. Added ESLint and optional system-Chromium selection for Playwright.
- Acceptance: exact full-preview/downloaded-PNG agreement; all covered pixels including fractional edges overwritten to opaque black; other pixels/alpha preserved; real blurred region changes; retained original/branching; invalid radius/translucent mask/allocation/schema rejection; cancel/undo/encoding failure preserve history; mobile touch and keyboard editing; v1 provenance recovery and malformed-record warning.
- Chains: image → crop → resize → WebP → download; annotate → resize → WebP → copy/download; redact + blur → PNG export → crop → resize → WebP → optimize → download → refresh → original branch; real Remove BG → resize → PNG download → recovery.
- Verification: `npm run typecheck`, `npm run lint`, `npm test` (34 pass); `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e` (15 pass); Prettier, production/staging/local builds and production `wrangler deploy --dry-run`. The complete current verification is in IMPLEMENTATION_STATUS.md.
- Limits: main-thread annotation/blur preview, 4 megapixels of blur regions, radius 1–64, originals retained under 24-hour local policy. Blur is cosmetic. No PDF redaction, multi-input processing, frame/combine, batch or cloud capability is claimed.
- Documentation/UI: catalog and design system created; inspection and supplied cloud request retained; product/architecture/privacy/roadmap/status aligned. BT-01 stays TODO because the input tracker incorrectly marked it active without processing/UI implementation.
- Next: SS-03; first implement actual multi-input engine/executor compatibility and transactional output graph commits, then local frame/padding/combine.
