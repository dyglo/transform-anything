# 32. FIRST TASK — INSPECT THEN EXECUTE

This is the first delegated cloud implementation task for Transform.

Do NOT treat this as a planning-only task and do NOT stop after producing an implementation plan.

You have permission to inspect the repository, establish the architecture, document the complete product specification, and then proceed directly into implementation.

Follow this sequence.

## STEP 1 — INSPECT THE REPOSITORY

Before changing code, inspect the entire current workspace/repository.

Determine:

- what code already exists
- current framework and project structure
- package manager
- dependencies
- configuration
- existing routes/pages
- existing components
- existing styling/design system
- existing tests
- Cloudflare configuration if present
- existing documentation
- existing Git state
- anything that should be preserved

Do NOT restart, replace, re-scaffold, or delete useful existing work simply because another architecture would be easier.

The repository is the source of truth.

---

## STEP 2 — ESTABLISH THE PERMANENT PROJECT SPECIFICATION

Before significant implementation, ensure the complete Transform vision described in this prompt exists permanently inside the repository.

Create or update an appropriate documentation structure containing at minimum the equivalent of:

- `docs/PRODUCT_SPEC.md`
- `docs/ARCHITECTURE.md`
- `docs/TRANSFORMATION_SYSTEM.md`
- `docs/TRANSFORMATION_CATALOG.md`
- `docs/ROADMAP.md`
- `docs/IMPLEMENTATION_STATUS.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/SECURITY_PRIVACY.md`
- `AGENTS.md`

You may improve the exact structure if the existing repository already has a documentation convention.

The documentation must preserve **ALL 10 transformation families and the complete long-term product vision**, regardless of how many are implemented during this task.

Do not reduce the documented scope to the first implementation slice.

Future Codex sessions must be able to understand the entire project by reading the repository.

---

## STEP 3 — ESTABLISH THE CORE ARCHITECTURE

Implement the minimum production-quality foundation required for the shared transformation system.

This should include, where appropriate:

- Transform Object model
- object/source abstraction
- input detection
- transformation contract
- transformation registry
- capability resolution
- transformation engine
- executor abstraction
- local/browser executor
- transformation graph/history model
- non-destructive object creation
- export architecture
- error model
- temporary object lifecycle
- workspace state architecture

Preserve the architectural rule:

**Transform Object → Registry → Transformation Engine → Executor → New Transform Object → Graph**

Do NOT create isolated transformation applications.

Do NOT create separate upload/process/download implementations for individual tools.

---

## STEP 4 — ESTABLISH THE CLOUDFLARE-FIRST BOUNDARY

Use the infrastructure principle defined earlier in this specification:

**Browser first → Cloudflare second → specialized external compute only when genuinely necessary.**

Do not deploy unnecessary infrastructure merely because it may eventually be needed.

Establish clean interfaces/boundaries for:

- Cloudflare Workers
- R2
- D1 where persistent relational data is genuinely needed
- KV where appropriate
- Queues
- Workflows
- Durable Objects only where justified
- Browser Run for future Web Capture
- external processors only where Cloudflare/browser execution is unsuitable

If credentials or Cloudflare resources are unavailable, do NOT stop the project.

Implement the architectural boundary, document the missing infrastructure requirement, and continue with functionality that can run locally.

---

## STEP 5 — BUILD THE PRODUCT SHELL

Build the production-quality foundation of the actual Transform web application.

The primary experience should communicate:

> **Anything in. Anything out.**

The homepage should prioritize universal input:

- drag/drop
- file browsing
- clipboard paste
- text paste where applicable
- URL input

The ten transformation families should remain discoverable but secondary to the input-first experience.

Do NOT turn the homepage into a giant grid of hundreds of converter tools.

Create the shared workspace architecture needed for:

- active Transform Object
- compatible transformations
- preview
- transformation parameters
- transformation history
- export
- continued transformation

The interface should be polished, responsive, accessible and production-grade.

---

# 33. FIRST COMPLETE VERTICAL SLICE

After the shared foundation exists, immediately implement a real end-to-end transformation workflow.

Use **Image/Screenshot** as the first vertical slice unless repository inspection reveals a strong technical reason not to.

This first slice should prove:

**Upload/Paste Image**
↓
**Input Detection**
↓
**Transform Object**
↓
**Capability Resolution**
↓
**Transformation Registry**
↓
**Local Executor**
↓
**Transformation**
↓
**New Transform Object**
↓
**Transformation Graph**
↓
**Continue Transforming**
↓
**Export**

Implement useful real operations such as:

- Crop
- Resize
- Compress/Optimize
- Convert
- Rotate where appropriate

Clipboard screenshot/image input should work where browser APIs permit.

Every completed operation must create a valid output object that can immediately be used by another compatible transformation.

For example:

**Screenshot → Crop → Resize → Compress → WebP → Download**

must work without requiring the user to download and re-upload intermediate results.

Do not implement fake transformations.

Do not create non-functional buttons representing planned capabilities.

Planned functionality belongs in the transformation catalog/roadmap until it actually works.

---

# 34. IMPLEMENTATION CONTINUATION

Once the first vertical slice works, do NOT stop merely because the architecture has been proven.

Continue implementing as much useful Transform functionality as can reasonably be completed during this cloud task.

Use the dependency order established from repository inspection and the product specification.

Prefer:

**complete working vertical slices**

over:

**many superficial unfinished features.**

However, all ten families must remain represented in the permanent product specification and roadmap:

1. Screenshot Studio
2. Compare
3. Image Prep
4. ShareCard
5. Document Clean
6. Data → Visual
7. Mockup
8. File Transformer
9. Text → Visual
10. Web Capture

Implementation can happen one family at a time.

The architecture must remain capable of supporting all ten without redesigning the core system.

---

# 35. AUTONOMOUS EXECUTION

This task is being delegated to the cloud environment.

I may not be present to approve intermediate implementation decisions.

Therefore:

**Do not stop for ordinary engineering decisions.**

Make reasonable production-quality decisions yourself when they are already constrained by this specification.

This includes decisions such as:

- internal naming
- folder organization
- component boundaries
- appropriate libraries
- state-management details
- TypeScript types
- test structure
- UI implementation details
- reversible architectural details

Evaluate alternatives and choose the strongest practical option.

Do not repeatedly ask for confirmation.

Only stop when there is a genuine blocker requiring information, credentials, destructive action, financial commitment, or a product decision that cannot reasonably be inferred from this specification.

If one feature is blocked, document the blocker and continue with other unblocked work.

---

# 36. CONTINUOUS PROJECT HANDOFF

Treat the repository documentation as part of the implementation.

As work progresses:

Update `IMPLEMENTATION_STATUS.md`.

Update `TRANSFORMATION_CATALOG.md`.

Update `ROADMAP.md`.

Record architectural decisions where appropriate.

Keep `AGENTS.md` useful for future Codex sessions.

Use clear statuses such as:

- Planned
- Foundation
- In Progress
- Implemented
- Tested
- Blocked

Do NOT mark functionality implemented simply because UI exists.

A transformation should only be considered implemented when the actual processing works.

At the end of this cloud task, the next Codex session should be able to continue by reading the repository rather than requiring this master prompt again.

---

# 37. VALIDATION

Continuously validate the implementation.

Before finishing the task, run all applicable:

- formatting
- linting
- TypeScript/type checking
- unit tests
- integration tests
- browser/E2E tests
- production build

Test actual transformation chains rather than only individual functions.

At minimum, verify the first vertical slice end-to-end.

Test responsive behavior where practical.

Fix regressions introduced by this task.

Do not leave the repository knowingly broken merely because a task limit is approaching.

---

# 38. FINAL REPORT

When execution reaches the practical limit of this cloud task, report:

### Repository Inspection

What existed before implementation.

### Architecture Established

Core Transform architecture actually implemented.

### Product Experience

Homepage/workspace/input/output experience built.

### Transformations Implemented

Real working transformations only.

### Transformation Chains Verified

Actual end-to-end chains successfully tested.

### Cloudflare Foundation

What is implemented, prepared, deferred or blocked.

### Ten-Family Status

Status of each of the 10 required transformation families.

### Validation

Build, typecheck, lint and test results.

### Documentation

Project-specification and handoff files created/updated.

### Remaining Work

Important unfinished functionality.

### Blockers

Only genuine blockers.

### Exact Next Task

The best continuation point for the next Codex session.

The final repository—not this chat—must be the durable source of truth.

---

# FINAL EXECUTION RULE

Do not stop after inspection.

Do not stop after architecture design.

Do not stop after documentation.

Do not wait for me to approve a plan.

Proceed:

**INSPECT → DOCUMENT → ARCHITECT → IMPLEMENT → TEST → UPDATE STATUS → CONTINUE**

while preserving the complete Transform product vision:

> **Anything in. Anything out.**
>
> Any supported digital object can become another object, and every output can immediately become the input to the next transformation.
