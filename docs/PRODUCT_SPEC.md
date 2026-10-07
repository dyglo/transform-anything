# Transform product specification

Transform is a universal digital transformation workspace: input → transform → transform → output. The object is the primary navigation; tools never own independent upload/processing/download lifecycles.

Principles: input-first, non-destructive graph, no download/re-upload between steps, quick anonymous exit, browser-first processing, optional AI operations, temporary storage by default.

Ten families: Screenshot Studio, Compare, Image Prep, ShareCard, Document Clean, Data → Visual, Mockup, File Transformer, Text → Visual, Web Capture. The complete product scope remains intact; the current release implements core Image Prep and Screenshot Studio annotations. Planned cards are discovery, not working tools.

Universal input eventually accepts files, images, screenshots, documents, URLs, text, tables, and media. The initial importer accepts PNG/JPEG/WebP with browse, drop, paste-event and permission-based clipboard input. Limit 25 MiB, 40 megapixels, and 16,384px per side.

The hero preserves the supplied visual reference with Transform-specific copy and the original landscape. The universal input follows below it. Workspace: actions left, preview center, properties right, history below. Mobile stacks the panels.

Every applied operation adds a node and selects it. Selecting an earlier node permits branching. Multiple imports are separate roots. PNG lossless export has no quality setting; JPEG/WebP expose quality. Export may be copied as PNG or downloaded in the current output format. Remove BG is available for all supported image inputs and produces a same-size transparent PNG; subsequent crop/resize/conversion uses that new object without re-uploading. Background removal is automatic, with visible loading/processing phases and preservation of the original on failure.

Anonymous sessions persist only in this browser, expire 24 hours after creation, and can be cleared manually. Authentication, saved projects, recipes, remote processing, batch export, and sharing follow later.

## Full product scope

The table describes intended capabilities, not a list of currently working tools. Consult [DEVELOPMENT_TRACKER.md](DEVELOPMENT_TRACKER.md) for status. A family can reuse operations from another family without duplicating the processing pipeline.

| Family            | Intended capabilities                                                                                               | Current delivery                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Screenshot Studio | Crop/resize, arrows, text, shapes, highlight, blur, opaque redaction, frames, and image combining                   | Crop/resize, text, arrows, outlines, highlights, blur and opaque redaction tested; frames and combining planned |
| Compare           | Two-input side-by-side, overlay/opacity, slider, synchronized zoom, and pixel difference                            | Planned                                                                                                         |
| Image Prep        | Crop, resize, rotate, compress/optimize, convert, metadata inspection/removal, and background operations            | Core operations and Remove BG delivered; broader metadata/background controls planned                           |
| ShareCard         | Text, image, and eventually URL content into designed shareable cards                                               | Planned                                                                                                         |
| Document Clean    | PDF merge, split, reorder, page extraction, compression, conversion, annotations, signatures, and genuine redaction | Planned; advanced formats/redaction require separate validation                                                 |
| Data → Visual     | CSV/JSON/pasted tables/numbers into cleaned data, charts, styled tables, and graphics                               | Planned                                                                                                         |
| Mockup            | Screenshot/design into browser, device, social, and presentation compositions                                       | Planned                                                                                                         |
| File Transformer  | Supported image, document, audio, video, archive, spreadsheet, and ebook conversions                                | PNG/JPEG/WebP conversion shared with Image Prep; other formats planned                                          |
| Text → Visual     | Quotes, code, statistics, and other text into designed visuals                                                      | Planned                                                                                                         |
| Web Capture       | URL to page/section/full-page/mobile/desktop screenshot or PDF                                                      | Planned; requires a secure cloud capture slice                                                                  |

The system must allow further families without rewriting the object model or creating independent upload/process/download flows.

## Input and chaining behavior

Future input detection includes MIME, extension, dimensions, size, encoding, and structure where relevant. Distinguish object identity from representation: a PDF page can become an image, and an image can become a composition, while all source and intermediate objects remain selectable. Future clipboard input includes text, URLs, HTML, and tabular content where browser APIs permit; unsupported types must remain explicit until implemented.

Show actions only when their required input types and counts are satisfied. Multiple inputs such as Compare/PDF merge must reference all source IDs. Multiple outputs such as PDF page extraction must become individually usable objects. Do not treat typed extension points as working support: the current executor accepts one image and returns one image even though graph records already have input/output arrays.

A successful operation selects its new output; failure preserves the active object and history. Draft editor changes need a clear apply/cancel boundary. Non-destructive means original and intermediate objects are retained, not that every rasterized operation is editable in place. Batch execution, recipes, and multi-input execution still need implementation.

## Visual editing and export

Visual editing should support pointer/touch and keyboard interaction, use image coordinates independent of displayed scale, and preserve alpha unless an operation explicitly changes it. Evaluate a mature canvas editor when adding annotations; do not lock in Konva/Fabric from the source brief without evaluating fit, license, bundle size, and accessibility.

Current copy/download uses the active image. Future output formats include PDF, SVG, CSV, JSON, ZIP, and additional codecs only once compatibility and real encoders are validated. Format conversion uses the engine; exporting an already available output need not add a duplicate graph node. Future sharing requires a separate explicit privacy/storage design.

## Recipes, batches, and persistence

Personal local recipes are the first recipe milestone: versioned parameterized chains, validation against new input, visible step failures, and normal graph outputs. Shared/public/community recipes follow later. Batch work selects multiple objects, runs compatible operations with progress and per-item failures, and exports a ZIP with safe filenames. The current multiple-root importer alone does not deliver batch processing.

Saved sessions/projects/preferences and cloud files are opt-in future features. Evaluate replaceable authentication only when persistence or cloud ownership needs it. Anonymous quick use remains available. Local session expiry stays 24 hours after creation; recipes need a separate explicitly disclosed persistence policy before implementation.

## Design and release boundaries

Keep the supplied landscape and reference hero layout, Transform copy, four-link navigation, and workspace calls to action. Universal input stays beneath the hero. Retain the desktop action/preview/property/history layout and stacked mobile panels. Feature discovery must clearly distinguish working, partial, and planned capabilities. Do not fabricate testimonials, pricing, trials, or claims that all ten families work.

The broader product can later expose New, Recipes, Recent, and Tools navigation when those destinations work; do not replace the approved current landing navigation merely because historical source material suggests it.

Browser processing is preferred. Cloudflare APIs/storage/jobs are introduced only for actual requirements; specialized compute remains a replaceable executor. Every operation should disclose local versus cloud processing before sending bytes. See [SECURITY_PRIVACY.md](SECURITY_PRIVACY.md) for current guarantees and future prerequisites.

## Product acceptance principle

A feature is delivered only when input → compatible operation → validated execution → retained graph output → usable copy/download works at supported viewport sizes, with failures preserving prior work. Mark it finished only after its acceptance checks and relevant regressions pass. Availability claims follow that status, not roadmap intent.

## Screenshot Studio annotations — SS-01

Annotate accepts PNG/JPEG/WebP through the shared registry and creates one PNG at source dimensions. Text labels, arrows, rectangle outlines and translucent highlights support selection, movement, bottom-right resizing, deletion, draft undo/redo and numeric/style controls. Mouse, touch and keyboard edits use source pixels. Text uses Arial/sans-serif, wraps at character boundaries and clips to its box; resize the box or change text size to reveal overflow.

Drafts are retained per source image while switching tools/images in the workspace, with visible reminders. Apply commits exactly one operation; Cancel discards the current image draft and creates no object. Drafts live in memory only; browser reload/close warns while pending. Applied output bytes and versioned parameters recover through IndexedDB. Copy/download export committed images. Applied annotations are rasterized; select an earlier source for a new branch rather than editing the applied layer in place. At most 100 elements, 500 characters per label, and 50 draft undo steps are supported. Composition remains planned. Region blur and opaque redaction are delivered and tested in SS-02.

## Screenshot Studio regions — SS-02

Blur and opaque redaction reuse Annotate, accessible selection/move/resize/delete and draft undo/redo. Mask opacity is fixed at 1; redaction color is editable; blur radius uses source pixels. Apply creates one reusable original-size PNG through the shared registry and engine. Region masks cover full intersecting pixels. Blur is cosmetic; redaction overwrites output pixels. Original/session retention is disclosed visibly. Clear the local session after downloading the intended output when retained originals are sensitive.

Document/operation version 2 adds the two kinds without invalidating historical version 1 annotations. Blur is limited to 4 megapixels of selected regions per operation, with 1–64px radius; resize first for larger blur areas. Redaction can cover the full supported image. These controls passed the SS-02 acceptance checks recorded in IMPLEMENTATION_STATUS.md.
