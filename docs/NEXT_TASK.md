# Next task — DC-01: first local Document/PDF vertical slice

Deployment interruption, 8 October 2026: DEP-01 takes priority only for this user-requested Vercel repair. DC-01 remains TODO; do not begin it during deployment work. Complete the post-merge checks in [DEPLOYMENT.md](DEPLOYMENT.md) before claiming production recovery. The feature queue below is unchanged.

Status: **TODO**. Prepared 7 October 2026 after SS-03. Dependencies: F-01–03 and SS-03. Shared ordered multi-input/output execution, atomic graph/storage commits and composition are ready. The user explicitly prioritized proving a different family after SS-03; DC-01 moves ahead of CP-01/MK-01. Do not begin another long Screenshot Studio expansion first.

## User outcome

Import PDFs into the same input-first workspace, inspect pages, merge ordered documents, reorder/extract pages, split into reusable PDF objects and render selected pages into PNG objects that can enter Frame/Annotate/Resize/Convert/Export without re-uploading. Originals and all intermediates remain selectable.

## Scope and entry points

1. Read the task ledger, product/architecture/transformation/privacy docs, core/types.ts, registry.ts, engine.ts, detection.ts, local.ts, storage/objects.ts, workspace state and UI. The engine already consumes/returns arrays; avoid rebuilding cardinality or creating a separate PDF mini-app.
2. Evaluate maintained browser PDF manipulation/rendering libraries (e.g. pdf-lib and PDF.js): licenses, worker configuration, lazy bundles, static-asset limits, input/output verification and memory budgets. Install only what the delivered slice needs. Browser first; no cloud resources or external compute without demonstrated necessity.
3. Generalize signature-based import and type-aware preview/export for PDF while preserving PNG/JPEG/WebP detection, previews and exports. A PDF is a first-class object with detected MIME, byte storage and page metadata. Explicitly reject corrupt/encrypted/unsupported PDFs; define bounded byte/document/page/render budgets before allocation. Image controls must not appear for PDFs.
4. Register actual local merge, reorder, extract, split and selected-page-to-PNG operations with declared input/output counts. Merge is many-to-one; split/extract or page rendering proves real one-to-many outputs. Preserve input/document/page ordering, immutable parameter snapshots, output MIME/identity and atomic commit. Partial failure creates no partial graph result.
5. Provide understandable page previews/selection/order and accessible mouse/touch/keyboard controls. Every output is selectable and can continue through compatible PDF/image tools and normal export. Reuse the shared engine/state/history; never process directly inside UI event handlers.
6. Keep advanced compression, Office conversion, signatures, PDF annotations and genuine content redaction in DC-02. Image masks do not redact PDF text/layers. No fake controls, deployment, accounts or provisioning during DC-01.

## Acceptance checks

- Two known PDFs with distinguishable page contents → ordered merge → reorder/extract → valid exported PDF with verified page count/order/content; every source referenced and retained.
- One PDF → several usable PDF/PNG outputs committed atomically → select any output → further compatible operation. A rendered PNG chains through Frame/Annotate/Resize/WebP/export without re-uploading.
- Refresh recovers all PDF/image bytes, relationships, selected output and parameter snapshots. Original branches remain usable; clear/expiry deletes bytes and graph.
- Unsupported MIME/count/duplicate IDs, missing bytes, corrupt/encrypted files, invalid page selection, render/encode failure and memory limits have typed actionable errors and preserve graph/selection. Storage quota retains exportable in-memory work with a warning.
- Real output bytes open/decode correctly; text/content and visual page checks verify ordering rather than relying only on metadata. PDF page rendering must respect rotation, page bounds and transparency/background behavior.
- Desktop and 390px mobile selection/order/export, keyboard and touch, no page overflow or hidden required controls. No user content upload or third-party processing; worker/bitmap/URL cleanup verified.
- Run formatting, lint, typecheck, unit/integration, complete browser regression suite and production build with stable source files. Existing image/composition/annotation/blur/redaction chains continue to pass.

## Completion and handoff

Mark DC-01 IN PROGRESS before behavior edits. Keep stable task IDs; record actual evidence/limits before DONE. Update catalog, product, architecture, transformation system, privacy, status, tracker, roadmap and this handoff. Preserve all ten families. Choose the next eligible task from the queue after this slice is verified; do not label advanced PDF capabilities complete. Open focused, validated PRs as requested by the user.
