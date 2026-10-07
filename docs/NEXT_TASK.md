# Next task — SS-01: Screenshot Studio annotations

Status: **TODO**. Prepared 6 October 2026. Dependencies: F-01–03 and IP-01 are done. This brief is a proposed next implementation; it does not start application work or authorize later milestones.

## User outcome

Paste or import a screenshot, draw an arrow, add a text label, outline a region, and highlight an area. Apply the annotation as a new graph output, then crop/resize/convert/copy/download without re-uploading. Select the original or an earlier image to make a different branch.

## Scope

- Add an **Annotate** operation for PNG/JPEG/WebP in the shared workspace/registry. This starts Screenshot Studio; it does not complete the whole family.
- Provide text, arrow, rectangle outline, and translucent rectangular highlight tools. Useful initial controls: stroke/fill color, stroke width, text size and content, and highlight opacity.
- Keep a draft layer over the active image. Select, move, resize, delete and undo/redo draft elements. Apply commits one operation; cancel discards the draft. Distinguish draft undo from selecting existing graph outputs.
- Use source-image coordinates, including text/style sizing, independent of display scale. Keep interaction working on scaled portraits, landscape images, and mobile touch. Expose keyboard-accessible element selection/properties and delete/nudge actions.
- Render a PNG at the original dimensions with alpha preserved. Rasterize annotations into output pixels. A later transformation sees that normal output object. Persist the operation parameters so its provenance survives refresh; do not promise in-place editing of already applied annotations in this task.
- Keep processing local, with a visible busy/error state and no image-byte network transfer. Preserve source and active selection when execution fails.

Blur/redaction, freehand drawing, frames, combining images, compare, templates, cloud capture, recipes, and batch controls are separate tasks. Do not add them to SS-01 implicitly.

## Engineering entry points

Read `src/core/types.ts`, `registry.ts`, `engine.ts`, `src/executors/local.ts`, `render.ts`, `src/state/workspace.ts`, `src/pages/Workspace.tsx`, `src/ui/Properties.tsx`, `CropOverlay.tsx`, and `src/storage/objects.ts` before designing changes.

Current `Parameters` accepts only primitive values; annotation elements need typed structured data. Extend the parameter model and per-operation validation deliberately, with versioned serializable element schemas. Avoid unvalidated JSON strings merely to fit the current type. Keep existing persisted image operations compatible; handle invalid or unsupported annotation schemas explicitly. Do not restructure the full repo or introduce a backend.

Evaluate Konva, Fabric.js, or a small overlay approach against selection/resize/text/undo requirements, bundle size, license, rendering consistency, and accessible controls. Record the chosen approach and reason in `ARCHITECTURE.md`. Lazy-load editor code where practical. If drawing occurs through a library, ensure export/worker fonts and render coordinates match the preview. A documented main-thread render path is acceptable where worker text/rendering support requires it.

The registry must declare compatibility, parameters, output MIME, execution and capabilities. Do not advertise batch support until the operation's parameter behavior and batch execution exist. Keep live preview outside graph commits, and ensure switching active objects or tools handles unsaved drafts predictably without silently applying them.

## Acceptance checks

1. Import a screenshot → add all four element types → edit/move/resize/delete → draft undo/redo → apply. Exactly one new output becomes selected, with correct original dimensions, visible annotations and retained original.
2. Select the original → make a different annotation → apply. Both branches and all intermediate objects remain available.
3. Annotated output → resize → WebP → download; supported clipboard copy works or reports browser restrictions. Refresh recovers output bytes, graph relationships, and valid operation parameters.
4. Cancel creates no node. Switching active images/tools handles drafts as designed. Invalid coordinates/styles/text bounds/schema or rendering failure preserve active object/history and show an actionable error.
5. Verify source/display coordinate mapping on scaled portrait/landscape and at 390px mobile width. Mouse and touch placement/selection work. Keyboard can select, change properties, nudge and delete; focus and control labels remain usable.
6. Check transparent PNG compositing and text rendering, long/empty labels, zero-size elements, edge placements, color/opacity limits and malformed stored parameters. Screenshot comparison should confirm preview/output agreement; use pixel-level checks for deterministic shapes where meaningful.
7. Confirm no image bytes or annotation content are sent over the network. Clean up preview URLs and any editor workers/listeners; storage failures must remain visible.
8. Run formatting, typecheck, focused geometry/schema/render tests, production build, and relevant browser regressions including crop/Remove BG. Record actual outcomes, not assumed passing results.

## Completion handoff

Mark SS-01 `IN PROGRESS` when implementation starts within an authorized request. Mark `DONE` only after the above checks pass; record completion evidence in `DEVELOPMENT_TRACKER.md` and `IMPLEMENTATION_STATUS.md`. Update product/UI availability to show Screenshot Studio as partially available. Document schema/render/storage/privacy changes as needed.

Replace this brief with **SS-02: region blur and opaque redaction** once SS-01 is complete. That task must explicitly distinguish cosmetic blur from irreversible pixel overwrite in the exported output, and disclose that Transform retains the original input until session cleanup.
