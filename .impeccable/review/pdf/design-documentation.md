# PDF and tool directory design documentation

Disposition: preserve the incumbent system. This is the user's same-UI extension, not a new visual world or an approved system rewrite. DESIGN.md and application sources were not changed by this pass. `.impeccable/design.json` is absent on disk; none was created.

Checked `DESIGN.md`, `PRODUCT.md`, `.impeccable/design-extension.md`, `.impeccable/surfaces/pdf.md`, `.impeccable/review/pdf/finish-review.md`, `apps/web/src/styles.css`, `apps/web/src/SiteHeader.tsx`, `apps/web/src/pdf/PdfApp.tsx`, `apps/web/src/pdf/pdf.css`, `apps/web/src/tools/ToolsHome.tsx`, and `apps/web/src/tools/tools.css`. Sampled the desktop PDF and mobile directory captures directly. All seven finish-review capture files are present; their visual review remains recorded in finish-review.md.

## System summary

- Palette: shared gray-green canvas, white panels, forest-green actions and selections, and brown-red errors; the existing dark theme keeps green accents.
- Type: shared sans stack, 14px body and 12px supporting copy; PDF headings are 32px/26px, directory headings 30–46px, and numeric metadata uses tabular figures.
- Layout: inherited two-column workspace with a PDF-specific 324px settings column; at 760px settings follow pages and directory entries become one column.
- Controls: shared primary buttons, fine borders, quiet rounded surfaces, Lucide line icons, green selection states, and visible keyboard focus.
- Motion: short control transitions and task spinners inherit the reduced-motion override; actual document previews remain the principal visual content.

## Drift not canonized or repaired

The legacy DESIGN.md describes a 340px settings column while incumbent HEAD CSS already uses 348px; its plain prose also lacks the current frontmatter format. The inherited body radial gradient, alternate mono metadata stack, and hover/control motion are broader than its texture/type/motion wording. The earlier design-extension.md has stale color and title values and describes the former homepage. These predate this extension (the CSS cases were checked against HEAD), and the missing sidecar is an existing documentation gap. None is promoted into new global rules or repaired because this pass is scoped to preserving the user-pinned system.
