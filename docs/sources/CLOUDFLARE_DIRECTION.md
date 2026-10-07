# REPLACE THE PREVIOUS BACKEND / INFRASTRUCTURE DIRECTION WITH THIS

## CLOUDFLARE-FIRST PLATFORM ARCHITECTURE

Transform should use a **Cloudflare-first backend and infrastructure architecture**.

Do NOT introduce Supabase by default.

One of the product goals is to keep infrastructure consolidated, serverless, scalable, and cost-efficient while avoiding unnecessary backend services.

Cloudflare should be evaluated as the primary platform for nearly everything that reasonably fits its capabilities.

The architecture should still remain modular enough that a specialized external processing service can be introduced later for workloads Cloudflare is not technically suited to handle.

Do not force workloads onto Cloudflare merely for stack purity.

---

# CLOUDFLARE PLATFORM RESPONSIBILITIES

Evaluate and use the following Cloudflare services where appropriate.

## Cloudflare Workers

Workers should be the primary server-side application/API layer.

Potential responsibilities:

- API endpoints
- transformation requests
- input validation
- capability resolution
- job creation
- authorization
- signed object access
- metadata operations
- transformation orchestration
- export coordination
- rate limiting integration
- service routing

Keep Workers lightweight where possible.

Do not perform extremely expensive media processing directly inside request handlers simply because Workers are available.

---

## Cloudflare R2

R2 should be the primary object/blob storage layer.

Use it where appropriate for:

- temporary uploads
- temporary transformation outputs
- intermediate cloud-processing objects
- large files
- generated exports
- batch outputs
- saved user assets if that feature is introduced
- web captures
- processing artifacts

The object architecture should support lifecycle/cleanup policies.

Transform is **temporary by default**, so files must not accumulate indefinitely.

Conceptually:

Input
→ temporary R2 object
→ processing
→ intermediate/final object
→ user retrieves output
→ expiration/cleanup

Do not store binary files directly inside the relational database.

---

## Cloudflare D1

Use D1 only for relational application data that actually needs persistence.

Potential examples:

- users/account references
- recipes
- recipe steps
- saved transformation sessions
- transformation metadata
- job metadata
- preferences
- saved projects if introduced
- object references
- usage metadata

Do NOT use D1 merely because a database exists.

Anonymous transformations should require as little persistent database state as possible.

The application should remain capable of performing many local transformations without contacting D1 at all.

---

## Cloudflare KV

Use KV only for appropriate low-latency key/value workloads.

Potential examples:

- configuration
- feature flags
- cached transformation capability metadata
- lightweight preferences
- non-critical cacheable state

Do not use KV as a relational database.

---

## Cloudflare Queues

Use Queues for asynchronous processing where appropriate.

Potential flow:

Transformation Request
→ Worker validates
→ Job created
→ Queue
→ Processor
→ R2 output
→ job status updated
→ client receives result

Examples could include:

- document processing
- web captures
- batch operations
- larger conversions
- asynchronous exports
- other background jobs

Design jobs to support:

- retry
- failure
- cancellation where possible
- progress/state
- idempotency
- cleanup

---

## Cloudflare Workflows

Evaluate Cloudflare Workflows for transformations involving multiple durable server-side steps.

This may map especially well to Transform because the product itself is based around transformation pipelines.

Example:

Upload
→ validate
→ convert
→ generate preview
→ optimize
→ store output
→ cleanup temporary inputs

Do not confuse **user transformation graphs** with infrastructure Workflows.

The transformation graph is a core domain concept and must remain independent.

Cloudflare Workflows are simply one possible execution mechanism for durable backend jobs.

---

## Cloudflare Durable Objects

Use Durable Objects only when strong coordination/stateful behavior actually requires them.

Potential future uses:

- active transformation session coordination
- real-time job state
- collaborative sessions
- WebSocket coordination
- browser session reuse
- concurrency coordination
- distributed locks
- stateful processing coordination

Do NOT introduce Durable Objects unnecessarily into simple transformations.

---

## Cloudflare Browser Run

Evaluate Browser Run as the primary backend technology for the **Web Capture** transformation family.

Potential transformations:

URL
→ screenshot

URL
→ full-page screenshot

URL
→ mobile screenshot

URL
→ desktop screenshot

URL
→ PDF

URL
→ captured webpage representation

Browser Run may also work with R2 for storing generated captures.

Security is critical.

Web capture must include protection against:

- SSRF
- localhost access
- private network access
- unsafe protocols
- malicious redirects
- oversized pages
- runaway browser sessions
- abuse

---

## Cloudflare Images

Evaluate Cloudflare Images where it materially improves image delivery or transformation.

However, do not make core image transformations dependent on a paid remote image service when they can be performed efficiently inside the browser.

Our priority remains:

**Local transformation first.**

---

# EXECUTION HIERARCHY

When implementing a transformation, use this decision order:

### 1. Can it run efficiently and safely inside the browser?

If YES:

**Browser / Web Worker / WASM**

No upload.

This should be preferred.

Examples may include:

- image crop
- resize
- compression
- many image conversions
- annotations
- visual composition
- CSV processing
- JSON processing
- charts
- text transformations
- some PDF operations

---

### 2. Does it require lightweight server functionality?

Use:

**Cloudflare Worker**

Examples:

- metadata
- authorization
- orchestration
- signed access
- capability APIs
- lightweight transformations

---

### 3. Does it require asynchronous/durable processing?

Use the appropriate combination of:

**Worker → Queue / Workflow → Processor → R2**

---

### 4. Does it require browser automation?

Use:

**Cloudflare Browser Run**

especially for Web Capture.

---

### 5. Is Cloudflare technically unsuitable?

Only then introduce a specialized external processing service.

Potential examples may eventually include:

- extremely heavy video transcoding
- unusual codecs
- large FFmpeg workloads
- complex Office/LibreOffice conversions
- specialized native binaries
- CPU/RAM-heavy transformations

The architecture must support such external processors without changing the Transform Object or Transformation Contract.

The external service should simply become another executor.

---

# EXECUTOR ARCHITECTURE

The transformation engine should support multiple executor types.

Conceptually:

Transformation Engine
|
Capability Resolver
|
+--------------------+
| |
Local Executor Cloud Executor
| |
Browser APIs Cloudflare Worker
Web Workers |
WASM +-- Direct
Canvas |
+-- Queue
|
+-- Workflow
|
+-- Browser Run
|
+-- External Processor
|
only when necessary

Do not let transformations know unnecessary infrastructure details.

A transformation should declare what execution capabilities it requires.

The engine/executor layer decides how that operation runs.

---

# TRANSFORM OBJECT STORAGE

A Transform Object must NOT assume its bytes live in one particular place.

Objects may be:

- memory-backed
- Blob-backed
- browser IndexedDB-backed
- R2-backed
- remotely processed
- generated dynamically

Conceptually:

TransformObject
|
+-- LocalObjectReference
|
+-- R2ObjectReference
|
+-- RemoteObjectReference

The exact implementation should be properly typed rather than following this pseudocode blindly.

This separation is important because a chain might look like:

Local screenshot
→ local crop
→ local annotation
→ cloud web/document operation
→ R2 result
→ local visual operation
→ final download

The transformation graph must work regardless of where object bytes currently reside.

---

# TEMPORARY FILE LIFECYCLE

Temporary processing is a core architectural requirement.

Every cloud object should have explicit ownership and lifecycle metadata.

Examples:

- anonymous temporary
- authenticated temporary
- saved
- processing
- final temporary output

Plan automatic cleanup.

Anonymous files should expire aggressively.

Do not create permanent storage by accident.

---

# AUTHENTICATION

Do not implement authentication during the foundation unless required.

The core product should work anonymously.

When authentication becomes necessary for:

- recipes
- saved history
- saved projects
- preferences
- persistent files

evaluate the best authentication solution compatible with the Cloudflare architecture at that time.

Do not introduce an entire backend platform solely to obtain authentication.

Authentication must remain replaceable and isolated from the transformation engine.

---

# OBSERVABILITY

Use Cloudflare-native observability where practical.

The architecture should eventually expose:

- transformation success/failure
- processing latency
- Worker errors
- Queue failures
- Workflow failures
- Browser Run failures
- file cleanup failures
- transformation usage
- resource consumption

Never log sensitive file contents.

---

# DEPLOYMENT

Prefer a Cloudflare-native deployment strategy.

Evaluate the current best-supported architecture for deploying the chosen React/Next.js frontend to Cloudflare.

Do not assume Vercel is required simply because Next.js is being used.

If framework compatibility becomes a constraint, evaluate whether another React architecture is more appropriate before locking the project into Next.js.

The product architecture matters more than framework preference.

Use Wrangler configuration where appropriate and maintain:

- local development configuration
- preview/staging
- production

Environment bindings should be typed and documented.

---

# UPDATED TECHNOLOGY DIRECTION

Preferred direction:

Frontend:

- React
- TypeScript
- Tailwind CSS
- high-quality accessible component primitives

Framework:

- evaluate Next.js against Cloudflare's current production support
- choose based on actual product requirements
- do not select Next.js automatically

Workspace state:

- evaluate Zustand or equivalent

Async/server state:

- evaluate TanStack Query or equivalent

Visual editing:

- evaluate Konva, Fabric.js or another mature canvas solution

Local processing:

- Browser APIs
- Canvas
- Web Workers
- WebAssembly
- carefully selected format-specific libraries

Cloud platform:

- Cloudflare Workers
- R2
- D1 where relational persistence is actually needed
- KV where key/value storage is appropriate
- Queues for asynchronous jobs
- Workflows for durable multi-step backend processing
- Durable Objects only where coordination requires them
- Browser Run for Web Capture
- Cloudflare-native observability/security where appropriate

External infrastructure:

**None by default.**

Introduce external processing infrastructure only when a documented technical requirement cannot reasonably be satisfied by browser execution or Cloudflare.

---

# ARCHITECTURAL PRINCIPLE

The architecture should therefore follow:

**Browser first → Cloudflare second → specialized external compute only when necessary.**

Not:

**Send everything to backend.**

And not:

**Use Cloudflare for everything regardless of suitability.**

For every transformation, document its execution strategy:

- Local
- Cloudflare Worker
- Queue
- Workflow
- Browser Run
- External Processor

along with the reason for that decision.

---

# UPDATE PROJECT DOCUMENTATION

Ensure the repository's architecture documents explicitly describe this Cloudflare-first strategy.

`ARCHITECTURE.md` should include a system diagram similar to:

User
|
Transform Web App
|
+---------------- LOCAL ----------------+
| |
Web Workers / WASM / Canvas Instant Output
|
+---------------- CLOUD ----------------+
|
Cloudflare Workers
|
+------------+-------------+
| | |
D1 R2 KV
|
Queue/Workflow
|
+---------+----------+
| |
Browser Run Processing Executor
|
External Compute
only if required

Also update:

- `PRODUCT_SPEC.md`
- `TRANSFORMATION_SYSTEM.md`
- `ROADMAP.md`
- `SECURITY_PRIVACY.md`
- `IMPLEMENTATION_STATUS.md`
- `AGENTS.md`

where appropriate.

The complete ten-family Transform specification remains unchanged.

This infrastructure change does NOT reduce product scope.

Transform remains:

> **A universal transformation workspace where virtually any digital input can continuously become whatever output the user needs next.**
