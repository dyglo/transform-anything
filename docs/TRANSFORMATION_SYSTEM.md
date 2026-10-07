# Transformation system

`TransformObject` describes identity, media type, dimensions/metadata, creation time, size, name, storage reference and preview reference. Storage is a discriminated union: Blob, IndexedDB, R2, or external executor object. The first release resolves only local references; cloud references fail explicitly.

`OperationRecord` contains input IDs, output IDs, transformation ID and version, parameter snapshot, and timestamp. Relationships belong to operations rather than a single parent field, allowing multi-input and multi-output operations later.

`TransformationDefinition` declares accepted MIME types, output types, family, defaults, validation, execution requirement, and batch/preview/non-destructive capabilities. Capability resolution filters the registry against the active object. Implemented operations: crop, resize, rotate, convert, optimize, remove background, annotate. Optimize is JPEG/WebP-only; smaller output is not guaranteed on already optimized files.

`Executor` supports an execution requirement and produces an object. Its optional execution context reports progress without exposing processing internals to transformations. The engine validates compatibility and parameters, selects an executor, verifies output MIME, then returns a result for a graph commit. Exceptions do not commit nodes. The initial executor processes one image, but graph operations and import collections support arrays for future batching.

Remove BG accepts PNG/JPEG/WebP and always produces PNG with preserved original dimensions and alpha. The compact U²-Net ONNX model infers a 320 × 320 soft foreground matte in a separate WASM worker. Resizing the matte and applying `destination-in` keeps source colors and existing transparency intact. SHA-256 verification, explicit load/inference/output phases, and a three-minute timeout handle unavailable, damaged, or slow runtime/model assets. No model/runtime download occurs until this operation is invoked. Further operations use the resulting object normally.

Crop is a validated pixel rectangle with draggable corners and a movable selection, synchronized with numeric fields. Mouse, pen, and touch use source-pixel coordinates derived from the displayed image bounds; pointer capture keeps gestures working outside the handle and all interactive adjustments stay inside the image. Arrow keys adjust 1px and Shift+arrows 10px. Resize optionally maintains aspect ratio. Rotation accepts 90/180/270 clockwise degrees. Conversion supports PNG/JPEG/WebP. Canvas encoders are verified against actual output MIME; unsupported encoders report an error rather than silently exporting PNG under a different extension. JPEG fills transparency white before drawing. Clipboard export locally encodes PNG where necessary without adding an otherwise unnecessary graph node.

Local inputs are decoded with image orientation applied. Processing is in a worker where available, and image bitmaps are always closed. No transform calls a processing server. R2/job/auth protocols will be designed when cloud transformations actually land; do not add speculative public API endpoints.

Annotate is version 1 in Screenshot Studio, accepts all three image MIME types, produces PNG and declares local-image execution, preview and non-destructive graph behavior, with batch false. Its parameter envelope is `{ annotations: { version: 1, elements: [...] } }`. Elements contain a unique ID, kind (text/arrow/rectangle/highlight), source-pixel x/y/width/height, six-digit hex color, stroke, opacity, fontSize, text, and flipX/flipY arrow direction flags. Bounds/styles/types/unique IDs/label limits/unknown fields/version are validated before any executor is invoked. Highlight opacity is 0.05–0.8; other element opacity is 0.05–1. Stroke is 1–100px; font size 1–512px. Boxes must have positive dimensions and fit the image. Empty/whitespace text labels are rejected; text wraps and clips to the box.

Parameters now support primitives or a typed AnnotationDocument rather than JSON strings. Primitive-only historical operations retain their existing shape and storage database version. Structured snapshots are deep-cloned. Recovery validates annotation provenance, including operation version, without discarding image bytes or graph records when parameters are invalid; a visible warning invites a new branch from the source. Recovered annotations are provenance, never executed automatically. Preview drafts never create operation records or storage writes. Applied annotation outputs chain through crop, resize, convert, Remove BG and exports normally.

## SS-02 version 2 region elements

The shared Annotate operation now uses record/document version 2. All existing styles and geometry retain their shape. New `redact` elements require opacity exactly 1 and use their six-digit color. New `blur` elements require opacity exactly 1 plus integer `blurRadius` 1–64. Other kinds reject unknown `blurRadius` fields. Version 1 only accepts its original kinds; recovery accepts historical 1/1 records/documents and record 2 with document 1 or 2.

Fractional region bounds round outward at execution, covering all intersecting pixels. Redaction replaces RGB and alpha, including transparent pixels, only in that region. Blur averages premultiplied source colors/alpha in a region-local box filter; edges clamp to the region and total blur selection is limited to 4 megapixels. Both output an ordinary PNG that chains through the existing image operations. Full-resolution preview and export share the renderer. Apply validates all elements before processing; Cancel and preview never commit objects.

## Input and error boundaries

Headers identify PNG/JPEG/WebP independently of supplied MIME or filenames; full browser decoding then establishes dimensions and readability. Unsupported/corrupt content creates no object. MIME normalization changes only the Blob type, retaining original bytes.

Before execution, the engine independently clones and validates parameters. Executors receive a second copy; recorded parameters preserve what was validated even while awaiting processing. Failure uses stable TransformError codes and preserves the prior graph. Output MIME and fresh identity are checked before the result can commit.

## SS-03 execution contract

Transformation definitions now declare minimum/maximum input and output counts. Defaults and validation receive ordered object arrays; capability resolution checks all MIME types, input counts and unique identities. Executors consume ordered arrays and return arrays. Existing image operations explicitly remain one-input/one-output. The engine accepts a single-object shorthand for callers but normalizes to the same array contract.

One-to-many, many-to-one and many-to-many execution are supported in the shared contract. All output identities/counts/MIME types are checked before any graph commit. appendResult validates existing sources, unique fresh outputs, exact ordered relationships and operation identity before committing the whole result. IndexedDB persists every output in the existing atomic transaction. Single-object workflows and old operation records retain their stored shapes. Product selection and concrete compositions are the next SS-03 increment; PDF operations are not yet implemented.
