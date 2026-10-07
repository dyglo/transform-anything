# Repository inspection — 7 October 2026

Inspected the existing repository before application edits. Git started clean on `1d569d9` (Initial commit: Transform Anything app). Preserve all supplied assets, model licenses, React pages, engine, storage and tests.

- npm with committed package-lock; React 19, TypeScript, Vite, React Router, Zustand, Tailwind 4, Radix and Lucide. ONNX Runtime powers local background removal. No backend/database service dependency.
- Routes: `/` landing, `/workspace`, fallback route. Hero landscape and branding already exist. Desktop actions/preview/properties/history layout stacks on mobile.
- Core: typed objects and storage references, MIME capability registry, validation, executor dispatch, operation records with input/output arrays, graph branching. Executors currently consume one image and return one image.
- Local image import validates PNG/JPEG/WebP MIME, size, actual decoding and dimensions. Real crop/resize/rotate/convert/optimize, background worker and Canvas annotation renderer already exist.
- IndexedDB atomically stores graph and bytes; serialized writes, lazy 24-hour expiry, clear-session, export and object URL cleanup exist.
- Tests: Vitest engine/storage/render/crop/background/annotation suites; Playwright workspace/crop/background/annotation suites. Prettier exists; no dedicated lint command existed.
- Cloudflare Vite plugin, Workers Static Assets, Wrangler local/staging/production modes and empty Worker. No R2/D1/KV/job bindings. Cloud environment exposes no credentials or identities; remote provisioning/deployment unavailable and unnecessary for this slice.
- Existing documentation preserves all ten families and historical source briefs. Status files disagree: annotation implementation exists but tracker/next-task still describe it as unfinished; bulk task is marked in progress without bulk implementation. Reconcile only after current verification.

Continuation: verify existing full image slice; deliver SS-02 blur/opaque redaction within shared annotation workflow. Preserve roadmap order. See sources/CLOUD_IMPLEMENTATION_REQUEST.md for the current task's durable source.
