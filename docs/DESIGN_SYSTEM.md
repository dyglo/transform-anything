# Design system

## Product structure

Anything in. Anything out. Preserve `public/hero-bg.png`, reference hero composition and Transform branding. Universal input precedes secondary ten-family discovery. Currently supported input is explicitly PNG/JPEG/WebP; text and URL input remain planned and must never appear as working controls.

`src/styles.css` is the existing design source: light neutral workspace, dark ink, muted copy, green primary actions and rounded panels. Use its CSS custom properties and shared button/field/panel classes; do not introduce a competing styling system. Lucide supplies consistent icons. Tailwind is configured, but existing CSS owns the page layouts.

Desktop uses actions left, image preview center, properties right and graph/history below. Mobile stacks panels with horizontally scrollable history. Image geometry always uses source pixels, independent of CSS scale. Checkerboard communicates transparency. Pending edits are labeled draft; Apply commits a new object; Cancel discards the draft.

## Interaction and accessibility

Every input needs a visible label and accessible name. Native form controls and Radix primitives provide keyboard interaction; custom move/resize handles must also support arrows (1px) and Shift+arrows (10px). Keep visible focus, sufficient contrast, touch targets, skip navigation and reduced-motion rules. Do not rely on color alone for selection, capability status or errors.

Busy controls prevent duplicate work. Processing failures preserve selected object and graph and show actionable errors. Storage failure is a visible notice. Available/partial/planned labels follow real processing and validation evidence. No inert planned-tool buttons or fabricated marketing claims.

## Visual editing and export

Use the same source-pixel renderer for preview and committed PNG. DOM controls sit above Canvas for accessible selection, movement and resizing. Drafts are tab-local; pending work warns before reload. Export always uses committed active-object bytes, never unapplied preview.

Redaction must have an explicit original-retention disclosure. Blur is cosmetic and must never be described as secure redaction. Opaque masks have fixed opacity; transparency is preserved outside the covered region.
