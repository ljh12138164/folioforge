# Internationalization (i18n) & Localized Copywriting

## Background
PixelForge is a dual-application monorepo containing `apps/image-web` (an offline image converter supporting 16 formats) and `apps/pdf-web` (an offline client-side PDF toolbox featuring 19 operations), sharing `@pixelforge/ui`.
Previously, both applications only provided hardcoded Simplified Chinese (`zh-CN`) user interfaces. To support global users and multilingual environments without compromising privacy, zero-server-upload guarantees, or static export capabilities, full internationalization (i18n) across both web apps and the shared UI package was required. In addition, the copywriting across all locales must adhere to humanized software writing standards (`humanizer-zh`), avoiding stiff machine translation or empty marketing jargon.

## Scope
- Shared UI layer (`packages/ui`):
  - Add locale definitions (`Locale`), supported locales list, `localStorage` persistence (`pixelforge-locale`), and real-time custom event sync (`pixelforge-locale-change`).
  - Introduce `LocalePicker` dropdown component matching the existing UI aesthetic and ARIA specifications.
  - Update `ThemePicker` to adapt labels across all supported locales while maintaining default Chinese button labels for backward compatibility.
- Image Web application (`apps/image-web`):
  - Create type-safe translation dictionaries for 8 locales: `zh-CN`, `en-US`, `zh-TW`, `ja-JP`, `ko-KR`, `es-ES`, `de-DE`, `fr-FR`.
  - Localize SiteHeader, Home, Workbench (App), Image Comparison view, and Guide page.
- PDF Web application (`apps/pdf-web`):
  - Create type-safe translation dictionaries for 8 locales covering all 19 tools, groups, search, tags, FAQ, workbench modes, toolbar, and export controls.
  - Localize SiteHeader, ToolsHome, Workbench (PdfApp), and Guide page.
- Testing & Static Export:
  - Default SSR / initial render guarantees `zh-CN` fallback, preventing test regressions in existing unit tests and Playwright test assertions.
  - Ensure zero build errors in Next.js static HTML export (`output: 'export'`).

## Out of scope
- Server-side dynamic URL prefixing (e.g. `/en/pdf`), as both apps strictly use Next.js static exports (`output: 'export'`) for offline/PWA deployment.
- Translating non-UI backend engine log strings inside WebAssembly / C / Rust core bindings.

## Acceptance criteria
1. Both `apps/image-web` and `apps/pdf-web` provide a language selector in the site header.
2. Selecting a language dynamically switches all UI texts across header, homepage, workbench, comparison/tools, and guides without page reload.
3. Locale choice is persisted in `localStorage` under `pixelforge-locale`.
4. Copywriting adheres to native software conventions without machine-translation stiffness or buzzwords.
5. All architecture boundaries (`node scripts/check-architecture.mjs`) remain strictly enforced.
6. All existing unit tests pass (`pnpm test:unit`).
7. Next.js static builds succeed without errors (`pnpm build:pdf`).

## Feasibility
- **Feasibility Assessment**: Feasible.
- **Constraints & Bottlenecks**:
  - Next.js static export (`output: 'export'`) disallows `i18n` config in `next.config.js`. Client-side React context/hooks with default `zh-CN` SSR rendering ensures 100% compatibility with static hosting and automated tests.
  - Strict dependency boundaries: `image-web` and `pdf-web` cannot import each other's code or engines; shared logic resides cleanly in `@pixelforge/ui`.

## Implementation
1. `packages/ui/src/i18n.ts`: Defined `Locale` (`zh-CN`, `en-US`, `zh-TW`, `ja-JP`, `ko-KR`, `es-ES`, `de-DE`, `fr-FR`), storage functions, and `useLocale()` hook.
2. `packages/ui/src/LocalePicker.tsx`: Created accessible dropdown.
3. `packages/ui/src/ThemePicker.tsx`: Localized theme names with fallback.
4. `apps/image-web/src/i18n/index.ts`: Built 8-locale dictionary and `useImageI18n()` hook.
5. `apps/image-web/src/SiteHeader.tsx`, `Home.tsx`, `App.tsx`, `ImageComparison.tsx`, `GuideContent.tsx`: Integrated localization.
6. `apps/pdf-web/src/i18n/index.ts`: Built 8-locale dictionary and `usePdfI18n()` hook.
7. `apps/pdf-web/src/SiteHeader.tsx`, `tools/ToolsHome.tsx`, `pdf/PdfApp.tsx`, `GuideContent.tsx`: Integrated localization.

## Verification
- `node scripts/check-architecture.mjs`: PASSED (both image-web and pdf-web boundaries verified).
- `pnpm test:unit`: PASSED (21/21 in image-web, 22/22 in pdf-web).
- `pnpm build:pdf`: PASSED (Static pages 8/8 generated, offline cache built).

## Risks
- Client-side locale initialization might cause hydration mismatch if SSR text differed from client text; solved by initializing SSR and default client state to `zh-CN`, switching only after `useEffect` / user interaction.
