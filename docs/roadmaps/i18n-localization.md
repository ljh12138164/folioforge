# i18n Localization & UI Controls Roadmap

## Context

Related development document: [Internationalization (i18n) & Localized Copywriting](../development/i18n-localization.md)
Pull request: [#12](https://github.com/ljh12138164/folioforge/pull/12)

## Now
### Complete 8-locale localization with auto-detection and shadcn-style dropdown
- Value: Seamless experience for international users with modern UI aesthetic across both image and PDF apps.
- Evidence: PR #12, Chrome DevTools visual verification, 50/50 unit tests passing.
- Dependencies: None.
- Completion signal: PR #12 merged to `main`.

## Next
### Tool parameter select components migration
- Value: Replace tool-specific inline `<select>` controls (e.g. OCR language, compression DPI, watermark angle) with reusable shadcn-style select dropdowns.
- Evidence: User feedback highlighting native select styling contrast.
- Dependencies: Base dropdown pattern in `@pixelforge/ui`.
- Completion signal: All tool configuration `<select>` tags migrated to accessible custom Select components.

## Later
### Localized dynamic URL paths (e.g. /en/, /zh/)
- Value: Direct SEO indexing across languages when deployed behind a server or edge routing layer.
- Evidence: Out of scope for current pure client-side static export (`output: 'export'`).
- Dependencies: Next.js edge routing or server-side routing support.
- Completion signal: Search engines crawl distinct language URLs.
