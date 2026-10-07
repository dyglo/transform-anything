# Roadmap

Updated: 7 October 2026. [DEVELOPMENT_TRACKER.md](DEVELOPMENT_TRACKER.md) owns task status; [NEXT_TASK.md](NEXT_TASK.md) defines the next implementation. The complete ten-family scope is in [PRODUCT_SPEC.md](PRODUCT_SPEC.md).

## 1. Foundation and core Image Prep — delivered

Shared object/storage model, registry/validation, local executor, branching operation graph, reference hero, accessible responsive workspace, image input/export, 24-hour local recovery and Cloudflare configuration. Crop/resize/rotate/conversion/quality, manual crop handles, and Remove BG are delivered. Metadata tools and further background controls remain IP-04; all image features are not claimed complete.

## 2. Visual workflows — next

**SS-01 annotations and SS-02 blur/opaque redaction are tested**, with a lazy Canvas/DOM editor and shared raster output. Next is **SS-03 frames/combine and multi-input execution**, then CP-01 Compare and MK-01 Mockup. The SS-01 library evaluation and renderer decision are recorded in ARCHITECTURE.md.

Introduce IN-01 typed text/data input before SC-01 ShareCard and TV-01 Text → Visual. This exposes their dependency explicitly rather than building a separate text upload pipeline. URL-based cards remain a later cloud-capable task.

## 3. Local formats and reusable workflows

DC-01 local PDF merge/split/reorder/extract/page images, including true multi-output execution. DV-01 data cleaning/charts/tables; FT-01 explicit browser-supported conversions beyond current images. BT-01 real bulk controls/ZIP export and RC-01 personal local recipes. IP-04 additional image metadata/background tools. Each capability is independently validated; libraries and format support are chosen at implementation time.

## 4. Secure cloud slice

CL-01 introduces only the cloud infrastructure needed by the first concrete remote workflow. WC-01 Browser Run capture adds URL objects, strict destination/redirect/subresource controls, temporary R2 outputs, job failure/cleanup and rate limits. Workers orchestrate; Queues/Workflows are evaluated for durable jobs; D1 is used only for necessary persisted metadata. KV, Durable Objects and external processors remain conditional. SC-02 can reuse this secure URL capability for cards.

Provisioning and publishing require a separate user request. The existence of environment configuration does not mean this milestone is deployed or operational.

## 5. Advanced processing and persistence

DC-02 advanced documents and real PDF redaction/signatures; FT-02 specialized media/document/format executors. Evaluate browser/Cloudflare limits before introducing native external compute. P-01 opt-in saved projects/history/preferences/accounts, and P-02 sharing/public recipes follow demonstrated need and explicit privacy design. Preserve anonymous quick workflows and isolate authentication from the transformation engine.

## Release rule

No feature is presented as available until its full input → transformation → graph → export workflow and acceptance checks pass. A roadmap priority is a proposal, not evidence of completion or authorization to implement every milestone. Future agents record status and verification after each feature, then update the next-task brief.
