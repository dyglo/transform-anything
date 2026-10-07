# Transformation system

`TransformObject` describes identity, media type, dimensions/metadata, creation time, size, name, storage reference and preview reference. Storage is a discriminated union: Blob, IndexedDB, R2, or external executor object. The first release resolves only local references; cloud references fail explicitly.

`OperationRecord` contains input IDs, output IDs, transformation ID and version, parameter snapshot, and timestamp. Relationships belong to operations rather than a single parent field, supporting ordered multi-input and multi-output operations.

`TransformationDefinition` declares accepted MIME types, output types, family, defaults, validation, execution requirement, and batch/preview/non-destructive capabilities. Capability resolution validates input counts, unique identities and every MIME type against the selected input array. Implemented operations: crop, resize, rotate, convert, optimize, remove background, annotate, frame, combine. Optimize is JPEG/WebP-only; smaller output is not guaranteed on already optimized files.

`Executor` supports an execution requirement, consumes ordered object arrays and produces object arrays. Its optional execution context reports progress without exposing processing internals to transformations. The engine validates compatibility and parameters, selects an executor, verifies output MIME, then returns a result for a graph commit. Exceptions do not commit nodes. The engine validates declared output counts, supported MIME and fresh unique identities. All outputs commit together, selecting the first output. This is separate from future batch orchestration.

Remove BG accepts PNG/JPEG/WebP and always produces PNG with preserved original dimensions and alpha. The compact U²-Net ONNX model infers a 320 × 320 soft foreground matte in a separate WASM worker. Resizing the matte and applying `destination-in` keeps source colors and existing transparency intact. SHA-256 verification, explicit load/inference/output phases, and a three-minute timeout handle unavailable, damaged, or slow runtime/model assets. No model/runtime download occurs until this operation is invoked. Further operations use the resulting object normally.

Crop is a validated pixel rectangle with draggable corners and a movable selection, synchronized with numeric fields. Mouse, pen, and touch use source-pixel coordinates derived from the displayed image bounds; pointer capture keeps gestures working outside the handle and all interactive adjustments stay inside the image. Arrow keys adjust 1px and Shift+arrows 10px. Resize optionally maintains aspect ratio. Rotation accepts 90/180/270 clockwise degrees. Conversion supports PNG/JPEG/WebP. Canvas encoders are verified against actual output MIME; unsupported encoders report an error rather than silently exporting PNG under a different extension. JPEG fills transparency white before drawing. Clipboard export locally encodes PNG where necessary without adding an otherwise unnecessary graph node.

Local inputs are decoded with image orientation applied. Processing is in a worker where available, and image bitmaps are always closed. No transform calls a processing server. R2/job/auth protocols will be designed when cloud transformations actually land; do not add speculative public API endpoints.

The original Annotate version 1 schema in Screenshot Studio, accepts all three image MIME types, produces PNG and declares local-image execution, preview and non-destructive graph behavior, with batch false. Its parameter envelope is `{ annotations: { version: 1, elements: [...] } }`. Elements contain a unique ID, kind (text/arrow/rectangle/highlight), source-pixel x/y/width/height, six-digit hex color, stroke, opacity, fontSize, text, and flipX/flipY arrow direction flags. Bounds/styles/types/unique IDs/label limits/unknown fields/version are validated before any executor is invoked. Highlight opacity is 0.05–0.8; other element opacity is 0.05–1. Stroke is 1–100px; font size 1–512px. Boxes must have positive dimensions and fit the image. Empty/whitespace text labels are rejected; text wraps and clips to the box.

Parameters now support primitives or a typed AnnotationDocument rather than JSON strings. Primitive-only historical operations retain their existing shape and storage database version. Structured snapshots are deep-cloned. Recovery validates annotation provenance, including operation version, without discarding image bytes or graph records when parameters are invalid; a visible warning invites a new branch from the source. Recovered annotations are provenance, never executed automatically. Preview drafts never create operation records or storage writes. Applied annotation outputs chain through crop, resize, convert, Remove BG and exports normally.

## SS-02 version 2 region elements

The shared Annotate operation now uses record/document version 2. All existing styles and geometry retain their shape. New `redact` elements require opacity exactly 1 and use their six-digit color. New `blur` elements require opacity exactly 1 plus integer `blurRadius` 1–64. Other kinds reject unknown `blurRadius` fields. Version 1 only accepts its original kinds; recovery accepts historical 1/1 records/documents and record 2 with document 1 or 2.

Fractional region bounds round outward at execution, covering all intersecting pixels. Redaction replaces RGB and alpha, including transparent pixels, only in that region. Blur averages premultiplied source colors/alpha in a region-local box filter; edges clamp to the region and total blur selection is limited to 4 megapixels. Both output an ordinary PNG that chains through the existing image operations. Full-resolution preview and export share the renderer. Apply validates all elements before processing; Cancel and preview never commit objects.

## Input and error boundaries

Headers identify PNG/JPEG/WebP independently of supplied MIME or filenames; full browser decoding then establishes dimensions and readability. Unsupported/corrupt content creates no object. MIME normalization changes only the Blob type, retaining original bytes.

Before execution, the engine independently clones and validates parameters. Executors receive a second copy; recorded parameters preserve what was validated even while awaiting processing. Failure uses stable TransformError codes and preserves the prior graph. Output MIME and fresh identity are checked before the result can commit.

## SS-03 execution contract

Transformation definitions now declare minimum/maximum input and output counts. Defaults and validation receive ordered object arrays; capability resolution checks all MIME types, input counts and unique identities. Executors consume ordered arrays and return arrays. Existing image operations explicitly remain one-input/one-output. The engine accepts a single-object shorthand for callers but normalizes to the same array contract.

One-to-many, many-to-one and many-to-many execution are supported in the shared contract. All output identities/counts/MIME types are checked before any graph commit. appendResult validates existing sources, unique fresh outputs, exact ordered relationships and operation identity before committing the whole result. IndexedDB persists every output in the existing atomic transaction. Single-object workflows and old operation records retain their stored shapes. Product selection and concrete compositions are delivered below; PDF operations are not yet implemented.

## SS-03 registered operations and parameters

Frame v1: one input/one PNG; `padding` 0–16,384, `border` 0–512, `radius` 0–8,192 and at most half the smaller source side; `background` transparent or six-digit color; `borderColor` six-digit color. Canvas dimensions are source dimensions plus twice (padding + border). Border lies outside the source box; corners clip the image, and background fills the canvas before compositing.

Combine v1: 2–8 unique ordered inputs/one PNG; `direction` horizontal/vertical, `gap` and `padding` 0–16,384, `background` transparent or six-digit color, `alignment` start/center/end, `sizing` native/match, and `crossSize` 1–16,384. Native keeps input pixels. Match scales to the common height for horizontal or width for vertical, preserving aspect ratio with integer-pixel rounding. Layout follows input order and never crops. Center offsets round down.

Source total and final canvas each must fit 40 megapixels; source/final sides fit 16,384px. Validation runs before decoding/allocation. Missing bytes, metadata mismatch, cancelled preview and failed/unsupported PNG encoding are typed execution failures with actionable messages. Engine compatibility rejects duplicate/count/MIME errors before processing; parameter snapshots preserve the applied layout. Outputs can continue through all existing compatible operations and export without re-uploading.
