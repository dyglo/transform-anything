# Next task — SS-03: frame/background/padding and combine images

Status: **TODO**. Prepared 7 October 2026. Dependencies: F-01–03, IP-01, SS-01 and SS-02 are verified. The current task completes at this handoff; this brief defines the next local vertical slice.

## User outcome

Import one or more screenshots, add a background/padding/frame or combine selected images in a horizontal/vertical arrangement, apply to a new image, then annotate/redact/resize/convert/export without re-uploading. Every original remains a graph root and the composition references every input.

## Scope and entry points

1. Read core/types.ts, registry.ts, engine.ts, executors/local.ts, state/workspace.ts, storage/objects.ts and Workspace.tsx. Graph operations have input/output arrays, but the engine/executor accept exactly one image. Extend actual contracts deliberately; do not treat arrays as already functional multi-input support.
2. Introduce validated required input counts/types and selection-based capability resolution. Adapt existing single-image operations without regressions. Immutable parameter snapshots, typed failures and graph atomicity must remain intact. A composition creates one new PNG; PDF-style multi-output stays later.
3. Add a shared composition renderer for background color/transparent padding, optional rounded/frame styling, horizontal and vertical combining with gap/alignment and explicit unequal-size fit rules. Bound all outputs by existing dimension/pixel budgets before allocation. Preserve alpha where intended; no silent stretching or cropping.
4. Reuse the workspace preview/parameters/history/export and shared registry/executor path. Accessible multi-input selection must clearly distinguish active preview from inputs used in an operation. Draft changes never commit; Apply creates the complete graph output; Cancel/failure retains sources and active selection.
5. Keep all processing local. No resource deployment, API, new cloud bindings, accounts or remote template assets are needed. Compare/Mockup can reuse the resulting multi-input/composition foundation later; do not claim those families complete.

## Acceptance checks

- Single screenshot → padded/background/framed PNG → redact → resize → WebP → download, with exact dimensions/alpha/preview agreement and retained source.
- Two different-size images → horizontal and vertical composition → new PNG references both source IDs → crop/annotation/export without re-uploading.
- Single-image existing transformations retain contracts and pass all previous chains. Multi-input incompatible MIME/count/missing bytes/oversize allocation/encoding failure leave graph unchanged with clear errors.
- Both source branches remain selectable. Refresh recovers composition bytes and multi-input relationships. Clear/expiry removes graph and bytes; storage/quota failures remain visible.
- Mouse, touch and keyboard input selection/parameters at desktop and 390px mobile width. No horizontal page overflow or hidden required controls. Output contains only composed pixels.
- Validate all bounds and preview/export agreement with pixel checks, including transparent PNG, uneven dimensions, gaps/alignment, edge placement and rounded/frame behavior.
- No user bytes or content sent over the network. Clean up image bitmaps, preview URLs/listeners/workers.
- Run Prettier, ESLint, typecheck, unit/integration tests, browser regressions and production build. Run browser tests with stable sources; do not trigger builds mid-run.

## Completion and handoff

Mark SS-03 IN PROGRESS before behavior edits. Record actual verification before DONE. Update catalog/product/architecture/privacy/status/roadmap and AGENTS.md as contracts change. Replace this brief with CP-01 Compare once the multi-input composition slice passes. Keep all ten families represented and claims limited to real processing.
