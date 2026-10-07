# Security and privacy

The current release performs all image transformations locally. No analytics, file upload, cloud job, authentication, or third-party asset requests are added. Static application and landscape requests are expected; image processing/export never sends file bytes over the network. Remove BG additionally fetches same-origin static model/WASM files only when used. Model bytes are SHA-256 checked before inference. Inference and compositing run in a dedicated browser worker, terminated on completion, failure, or its three-minute timeout. No user image is passed to a remote endpoint.

Anonymous graph/bytes are stored in origin-scoped IndexedDB for 24 hours after session creation. Startup removes expired data; Clear session deletes both stores. Expiration is lazy: a browser app cannot physically delete data while closed. Persistence failures preserve the in-memory session and display a warning to download before leaving. Clearing storage failures are reported rather than claimed successful.

Inputs are signature-checked, assigned detected MIME, and fully decoded; invalid files receive clear errors. Limits: 25 MiB, 40 megapixels, 16,384px per side. Decode may allocate before dimensions are known; this is not a hardened codec sandbox. Canvas re-encoding intentionally does not preserve original metadata. Original bytes remain available until session cleanup.

Clipboard reads/writes require browser support, secure context, and user permission. Paste events and download remain fallbacks. JPEG white-background behavior and lossless PNG quality limitations are visible in the UI. Clipboard copy uses PNG for interoperability.

Future cloud objects require unguessable references, explicit ownership, authorization, expiry checks, lifecycle policies, and cleanup monitoring. Do not log file contents. Future capture requires safe protocols, public-network destinations only, redirected/subresource request enforcement, request/size/time budgets, rate limits, and tests against SSRF. No URL is fetched by this release.

SS-01 annotation text and geometry are local content. Applied parameters are stored alongside the origin-scoped session graph under the same 24-hour expiry and clear-session policy; PNG pixels use the separate bytes store. Drafts are tab memory only and are discarded on Cancel or workspace unmount/session clear. Pending drafts warn on browser reload/close; apply before navigating away. Text is rendered as Canvas text and React-controlled textarea content, never HTML, scripts, URLs or remote font requests. Annotation schemas are bounded and version-validated. Malformed recovered provenance produces a warning while preserving all image objects. The original image remains available even after rasterized annotations.

## SS-02 redaction and blur

Opaque redaction writes full-opacity replacement pixels into the output PNG. Fractional boundaries are expanded to complete pixels so antialiasing cannot expose the covered source at an edge. Output contains raster pixels, with no recoverable annotation layers or original file attachment. Conversion/export uses the selected committed image. Users must cover the complete sensitive area; this is image-region processing, not automatic sensitive-content detection.

Original and intermediate objects deliberately remain selectable and stored under the same 24-hour anonymous session policy. Visible editor copy instructs users to download the redacted output and clear the session to remove originals from this browser. Clear failures remain visible. Expiry is lazy, and downloaded originals/backups/browser-managed data are outside app deletion guarantees. No history or original is bundled with downloads.

Blur is cosmetic and must not be used as secure redaction. Blur parameters contain geometry/radius, not extracted content. Processing/drafts/provenance stay local. Version and memory-budget validation apply before processing; temporary pixel buffers become collectible after rendering. Transparency outside selected regions remains unchanged.
