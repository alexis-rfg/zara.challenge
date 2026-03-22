# Technical Decisions

Architecture Decision Records (ADRs) for the Zara Challenge.
Each entry follows the format: **Context → Options considered → Decision → Rationale → Consequences**.

---

## 001 — Build tool: Vite over Create React App

**Context**
The project needs a build tool that satisfies two explicit spec requirements: development mode serving assets unminified, and production mode serving assets concatenated and minified.

**Options considered**
- Create React App (CRA)
- Vite
- Webpack (manual config)
- Parcel

**Decision**: Vite

**Rationale**
- CRA is officially unmaintained (last release 2022, React team recommendation is to migrate away)
- Vite natively serves ES modules in development — each file arrives as a separate unminified HTTP request, satisfying the dev requirement exactly
- Vite uses Rollup for production bundling (concatenation) and esbuild for minification, satisfying both prod requirements with zero config
- Cold start is dramatically faster than webpack-based CRA (ESM dev server vs full upfront bundle)

**Consequences**
- Env vars prefixed `VITE_` (not `REACT_APP_`) — documented in `.env.example`
- TypeScript compilation is handled by `tsc -b` before `vite build` for correctness (esbuild skips type checks)

---

## 002 — Styling: SASS over Styled Components

**Context**
The spec allows CSS, SASS, or Styled Components. One must be chosen and used consistently.

**Options considered**
- Plain CSS (`.css` files)
- CSS Modules (`.module.css`)
- SASS with global class names (`.scss`)
- Styled Components (CSS-in-JS)

**Decision**: SASS with BEM naming

**Rationale**
- Styled Components adds a ~15 KB runtime, dynamically generates class names, and complicates SSR hydration — all unnecessary overhead for this project
- CSS Modules would be a fine choice but adds the cognitive overhead of the `styles.className` import pattern throughout every component
- SASS compiles to static CSS at build time — zero runtime cost, native browser parsing
- BEM naming convention (`block__element--modifier`) provides component-scoped isolation without a build-time transform
- SASS variables, mixins, and `@use` imports allow a single `variables.scss` to be the source of truth for all design tokens

**Consequences**
- All design tokens in `src/styles/variables.scss`; components import via `@use '@/styles/variables' as *;`
- No CSS Modules — class name collisions prevented by discipline (BEM prefix = component name)

---

## 003 — State management: React Context API + useReducer

**Context**
The application needs a persistent shopping cart shared across all three views.

**Options considered**
- React Context API + useReducer
- Redux Toolkit
- Zustand
- Jotai
- Local component state (no sharing)

**Decision**: React Context API + useReducer

**Rationale**
- The spec explicitly requires React Context API — all other options are ruled out
- Even without the constraint: the cart state has two mutations (add, remove), one initialisation source (localStorage), and three derived values (items, totalItems, totalPrice). A global state library would add complexity without benefit
- `useReducer` produces a pure, deterministic, and unit-testable reducer function
- `useCallback` on `addItem` / `removeItem` and `useMemo` on the context value prevent unnecessary re-renders

**Consequences**
- All components access the cart through `useCart()` — the raw context is never imported directly
- Reducer lives in `src/context/CartContext.tsx`; tests for it live in `src/context/__tests__/`

---

## 004 — Cart persistence: localStorage

**Context**
The spec requires the cart to persist across page refreshes.

**Options considered**
- `localStorage`
- `sessionStorage`
- IndexedDB
- Cookie
- URL state (e.g. `?cart=...`)

**Decision**: localStorage

**Rationale**
- The spec explicitly requires localStorage
- localStorage is synchronous and simple — no async wrappers needed for this use case
- `getCart()` / `saveCart()` / `clearCart()` in `src/utils/localStorage.ts` isolate all serialisation logic and handle `JSON.parse` failures gracefully

**Consequences**
- Cart survives page refresh and tab close/reopen
- Cart does not sync across tabs (would require `storage` event listener — out of scope)
- Key `"zara-cart"` is stable and documented

---

## 005 — HTTP client: native fetch over Axios

**Context**
Every API call needs the `x-api-key` header injected automatically.

**Options considered**
- Axios (with an interceptor)
- Native `fetch` with a custom wrapper
- `ky` (small fetch wrapper)
- `@tanstack/query` with fetch

**Decision**: native `fetch` with `src/api/client.ts`

**Rationale**
- Axios adds ~14 KB to the bundle for features (interceptors, automatic JSON parsing, request cancellation with `CancelToken`) that `fetch` + `AbortController` cover natively
- The custom `apiClient` in `client.ts` is ~80 lines and covers everything needed: auth header injection, JSON parsing, typed errors, AbortController support, 5-minute in-memory cache
- `@tanstack/query` would be excellent for cache invalidation and background refetching, but adds ~20 KB and introduces a new mental model for a project that has no mutation requirements

**Consequences**
- `apiClient.get()` is the only place that calls `fetch` — all components are two layers removed from the network
- The 5-minute cache is intentional: the API runs on a free-tier host with 2–5 s cold-start latency; caching eliminates the wait on back-navigation

---

## 006 — AbortController for request cleanup

**Context**
React StrictMode double-invokes `useEffect` in development, and users may navigate away before a request completes. Without cleanup, stale responses can overwrite fresh state.

**Options considered**
- Ignore the issue (common in tutorials)
- Track a `mounted` boolean and skip `setState` on unmount
- `AbortController` + `signal` passed to `fetch`

**Decision**: AbortController

**Rationale**
- Ignoring the issue causes `setState on unmounted component` warnings in development
- The `mounted` boolean approach avoids the warning but does not actually cancel the in-flight request — it still consumes bandwidth and the API still processes it
- `AbortController` signals the browser to cancel the TCP connection; the `DOMException` (AbortError) is caught in `client.ts` and rethrown so hooks can ignore it in their error handler

**Consequences**
- Every hook that fetches passes an `AbortController.signal` to `apiClient`
- The `useEffect` cleanup function calls `controller.abort()`
- AbortErrors are explicitly filtered out in hooks: `if (error.name === 'AbortError') return;`

---

## 007 — pnpm over npm, with workspace + catalog

**Context**
The project needs a package manager. npm is the default toolchain that ships with Node; pnpm is an alternative with a fundamentally different storage model.

**Options considered**
- npm (v10)
- yarn Berry (PnP mode)
- pnpm (v9) without workspace
- pnpm (v9) with workspace + catalog

**Decision**: pnpm with workspace + catalog

**Why pnpm over npm**

| Concern | npm | pnpm |
|---------|-----|------|
| Disk usage | Each project gets its own full copy of every package | Global content-addressable store — one copy per version across all projects on the machine; packages are hardlinked into `node_modules` |
| Phantom dependencies | `node_modules` is flat — code can `require()` any transitive dep even if it is not declared | Strict isolated `node_modules` — only explicitly declared deps are importable; accessing an undeclared transitive dep throws at runtime |
| Install speed | Downloads + writes full copies on every `npm install` | After the first install of a version, subsequent installs across any project are instant (hardlink, no download) |
| Lockfile churn | `package-lock.json` re-resolves on every `npm install` in some environments | `pnpm-lock.yaml` is stable and consistently reproducible |
| Monorepo support | Workspaces work but are basic | First-class workspace support with protocol-based linking and the catalog feature |

**Why catalog (pnpm 9+)**
- All 21+ dependency versions live in one place (`pnpm-workspace.yaml` `catalog:` block) rather than scattered through `package.json`
- A version bump is a single-line diff in one file — reviewable, auditable
- Every package in the workspace that writes `"react": "catalog:"` resolves to the exact same pinned version; version drift is structurally impossible
- The workspace is already declared: adding a second package (BFF proxy, Storybook, shared types) requires only a new path entry in `pnpm-workspace.yaml`

**Consequences**
- Developers must use pnpm — `npm install` will not resolve `"catalog:"` specifiers and will produce an error
- Documented in README prerequisites: `corepack enable && corepack use pnpm@latest`
- `pnpm-lock.yaml` is committed and must not be deleted; CI uses `pnpm install --frozen-lockfile`

---

## 008 — TypeScript strict mode

**Context**
TypeScript offers a `strict` flag that enables a suite of type-safety checks.

**Decision**: strict mode enabled (`tsconfig.app.json`)

**Rationale**
- `strictNullChecks` catches the most common class of runtime errors (accessing a property on `undefined`)
- `noImplicitAny` forces every function parameter to be explicitly typed, making intent legible
- The cost (more type annotations) is paid at write time; the benefit (no runtime type errors) is paid continuously
- `@typescript-eslint/no-non-null-assertion: error` prevents `!` assertions from bypassing null checks

**Consequences**
- Stricter type annotations throughout the codebase
- `unknown` is used instead of `any` in error catch blocks
- All optional chaining (`?.`) and nullish coalescing (`??`) is deliberate, not defensive

---

## 009 — Testing: Vitest over Jest

**Context**
The project needs a unit and integration test runner.

**Options considered**
- Jest with `ts-jest`
- Jest with `babel-jest`
- Vitest

**Decision**: Vitest

**Rationale**
- Vitest is Vite-native: it reuses the same Vite config, plugin chain, and TypeScript paths (`@/`) without additional setup
- Jest requires `ts-jest` or `babel-jest` to handle TypeScript, plus a separate module name mapper for path aliases
- Vitest is faster for watch mode (native ESM, no full transpile on each run)
- The API is Jest-compatible — `describe`, `it`, `expect`, `vi.mock()` mirror `jest.fn()`, `jest.mock()` — zero learning curve

**Consequences**
- `src/test/setup.ts` is the single global setup file (extends `expect` with `@testing-library/jest-dom`)
- Coverage uses `@vitest/coverage-v8` (native V8 instrumentation — faster than Istanbul)
- Three separate Vitest configs: `vite.config.ts` (all), `vitest.config.unit.ts`, `vitest.config.intg.ts`

---

## 010 — E2E testing: Playwright with mocked API

**Context**
The application has three critical user flows that need to be validated in a real browser: search, detail page interactions, and cart management.

**Options considered**
- Cypress
- Playwright
- Playwright with real API calls
- Playwright with mocked API via `page.route()`

**Decision**: Playwright with mocked API responses

**Rationale**
- Playwright is faster than Cypress for multi-browser runs and has first-class TypeScript support
- Testing against the real free-tier API introduces flakiness (cold-start latency, rate limits, network conditions in CI)
- `page.route()` intercepts all matching requests and returns fixture JSON synchronously — tests are deterministic and run fully offline
- The production bundle is served by `vite preview` during E2E — tests exercise the real minified build, not the dev server

**Consequences**
- E2E fixtures must be kept in sync with the real API response shape
- The CI build job bakes in placeholder env vars; the E2E job must set the same values so `page.route()` intercepts the correct URLs
- Mobile Chrome is included as a second Playwright project to catch responsive breakpoint regressions

---

## 011 — Accessibility strategy

**Context**
The spec requires "correcta accesibilidad" without further detail. WCAG 2.1 AA is the industry standard for web accessibility.

**Decision**: Proactive WCAG 2.1 AA compliance + Axe automated checks

**Rationale**
- Semantic HTML first: `<nav>`, `<main>`, `<section>`, `<article>`, `<button>`, `<form>` — never `<div onClick>`
- All `<img>` elements have meaningful `alt` attributes; decorative images use `alt=""`
- ARIA labels on icon-only controls (`aria-label="Shopping cart with N items"`)
- `aria-disabled="true"` + HTML `disabled` attribute on the "Añadir al carrito" button when selections are incomplete
- `jsx-a11y` ESLint plugin catches violations at write time (pre-commit)
- `@axe-core/playwright` runs automated accessibility audits in the E2E `accessibility.spec.ts` suite — catches contrast, missing labels, and structural issues that manual review misses

**Consequences**
- All interactive elements are reachable via Tab and operable with Enter / Space
- Focus management: on route change, focus moves to the page heading
- Color contrast ratios verified against WCAG 2.1 AA (4.5:1 for normal text, 3:1 for large text)

---

## 012 — Search: form submission model

**Context**
The spec says "buscador en tiempo real" (real-time search). The implementation must decide between triggering a fetch on every keystroke (`onChange`) or on form submission (Enter key / button click).

**Options considered**
- `onChange` with debounce (e.g. 300 ms)
- Form `onSubmit` (Enter key or explicit search icon click)
- `onChange` with debounce + `onSubmit` for immediate trigger

**Decision**: Form `onSubmit`

**Rationale**
- The API runs on a free-tier host with 2–5 s cold-start latency. An `onChange` strategy would queue multiple in-flight requests per keystroke, each potentially taking several seconds
- `AbortController` mitigates stale responses but does not eliminate the cold-start cost — the first request in each burst still triggers the cold-start wait
- Form submission is the native browser pattern for search — keyboard users expect Enter to submit, screen readers announce the form role correctly
- "Real-time" in context means "results update without a full page reload" — which form submission achieves
- A `useDebounce` hook (300 ms) is implemented and available; switching to `onChange` requires only wiring it up in `SearchBar`

**Consequences**
- Users type a query and press Enter or click the search icon to trigger a fetch
- The SearchBar includes a clear button that resets to the initial 20-phone view
- The results count indicator updates immediately after each search

---

## 013 — Chunk splitting strategy

**Context**
The production build needs to be optimised for browser caching. If all application code is in one file, any change (even a single component) invalidates the entire cache.

**Decision**: Three manual chunks — vendor, router, index

```javascript
// vite.config.ts
manualChunks: {
  vendor: ['react', 'react-dom'],   // changes only on React upgrade
  router: ['react-router-dom'],     // changes only on router upgrade
  // index chunk: application code — changes with every release
}
```

**Rationale**
- `react` and `react-dom` are ~130 KB minified+gzipped and rarely change. Splitting them into `vendor` allows browsers to keep them cached across application releases
- `react-router-dom` changes at a different cadence than app code; splitting it avoids cache invalidation when only routing config changes
- The `index` chunk contains only application code (~40 KB) — the smallest possible file that changes on every release

**Consequences**
- Three JS files on initial load (parallel HTTP/2 requests — no performance penalty)
- Long-lived cache headers can be set on `vendor-*.js` and `router-*.js` without affecting the user's ability to pick up application updates

---

## 014 — Internationalisation: i18next + react-i18next

**Context**
The spec prescribes exact Spanish labels throughout the UI ("Añadir al carrito", "Productos similares", "Continuar comprando"). A LanguageSwitcher component was added so users can toggle between English and Spanish without a page reload.

**Options considered**
- Hardcoded Spanish strings everywhere
- `react-intl` (FormatJS)
- `i18next` + `react-i18next`
- `lingui`

**Decision**: i18next + react-i18next + i18next-browser-languagedetector

**Rationale**
- `react-intl` requires ICU message format and a heavier compile-time extraction pipeline — overkill for two locales and ~40 string keys
- `lingui` needs a CLI extraction step; adding a new key requires running `yarn lingui extract` before it can be used — friction during development
- i18next is the most widely adopted React i18n solution (~8 M weekly downloads), has zero config for the common case, and the TypeScript module-augmentation pattern provides fully typed `t('key')` calls — a typo in a translation key is a compile-time error
- `i18next-browser-languagedetector` reads `navigator.language` / `localStorage` automatically, so the user's OS locale is respected on first load without any manual wiring
- Fallback to `'en'` is one config line (`fallbackLng: 'en'`)

**Setup summary**

```
src/i18n/
├── index.ts            — init: LanguageDetector → initReactI18next → i18n.init(...)
└── locales/
    ├── en.json         — English strings
    └── es.json         — Spanish strings (spec labels live here)
```

TypeScript augmentation in `index.ts` keys the `CustomTypeOptions` to `typeof resources['en']`, meaning every `t('key')` call is checked against the English locale shape at compile time. Missing or misspelled keys are type errors.

**Consequences**
- All UI strings must go through `t('key')` — no hardcoded user-visible text in components
- Adding a new locale requires: a new JSON file in `locales/`, an entry in `resources`, and adding the language code to `supportedLngs`
- The `LanguageSwitcher` component calls `i18n.changeLanguage(lang)` and stores the preference in `localStorage` via the detector plugin (key: `i18nextLng`)
- Tests that render components with `t()` must wrap them in `I18nextProvider` or call `i18n.init(...)` in the test setup

---

## 015 — Structured logging system for DX

**Context**
The spec requires a clean browser console (zero `console.log` in production). During development, tracing async API calls, cart mutations, and navigation events through bare `console.log` calls is noisy and unstructured. In tests, any `console.log` that leaks into test output is confusing.

**Options considered**
- `console.log` directly in components / hooks (default)
- A thin wrapper that strips calls in production via a build-time flag
- A structured logger with in-memory buffer and devtools API
- A third-party logging SDK (Sentry, Datadog, LogRocket)

**Decision**: Custom structured logger (`src/utils/logger.ts`)

**Rationale**
- Third-party SDKs require an account, a CDN script, and ongoing cost — disproportionate for a challenge project
- A plain "strip in production" wrapper produces no output and offers no DX benefit; you lose visibility during development without gaining anything over `console.log`
- The structured approach solves three separate problems at once:
  1. **Production**: no `console.*` calls reach the browser — entries go to the in-memory buffer only
  2. **Development**: every entry is forwarded to `POST /api/dev-log` (Vite dev server endpoint) so structured JSON appears in the terminal alongside HMR output
  3. **Tests**: the module is fully mockable (`vi.mock('@/utils/logger', ...)`) — no output leaks into test runs

**Key design decisions**

| Feature | Detail |
|---------|--------|
| Structured entries | Every `LogEntry` has: `id`, `timestamp`, `level`, `scope`, `event`, `tags`, optional `context`, `correlationId`, `durationMs`, `error` |
| Scoped loggers | `createLogger({ scope: 'api.client' })` — the scope appears in every entry, making it trivial to filter by module |
| Child loggers | `logger.child({ scope: 'cache' })` produces `api.client.cache` — models the module hierarchy without boilerplate |
| Span tracing | `logger.startSpan('fetch_products')` emits a `.started` debug entry and returns `{ finish, fail }` — calling either emits a `.finished` / `.failed` entry with `durationMs` set automatically via `performance.now()` |
| Correlation IDs | Spans generate a UUID `correlationId`; both the start and end entries share it — trivially grep-able in the buffer |
| In-memory buffer | Circular buffer, capped at 200 entries — oldest evicted on overflow |
| `window.__APP_LOGGER__` | Exposed globally in non-test environments: `__APP_LOGGER__.getEntries()`, `.subscribe(fn)`, `.clear()` — inspect from the browser console without opening DevTools sources |
| Terminal forwarding | In dev mode (`import.meta.env.DEV && MODE !== 'test'`) entries are fire-and-forgot to `POST /api/dev-log`; failures are silently swallowed — the app never breaks because logging is down |

**Usage pattern**

```typescript
// In any module
const logger = createLogger({ scope: 'cart.context', tags: ['cart'] });

// Simple event
logger.info('add_item', { context: { productId: 'APL-IP15P', price: 1229 } });

// Timed span across an async operation
const span = logger.startSpan('fetch_products');
try {
  const data = await apiClient.get('/products');
  span.finish({ context: { count: data.length } });
} catch (error) {
  span.fail(error);
}
```

**Test mock pattern**

```typescript
vi.mock('@/utils/logger', () => ({
  createLogger: () => ({
    startSpan: () => ({ finish: vi.fn(), fail: vi.fn() }),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  }),
}))
```

**Consequences**
- Zero `console.log` anywhere in `src/` — ESLint `no-console` rule enforces this
- The logger is the only place that calls `console.*` (it does not — entries go to the buffer and optionally the terminal endpoint)
- All hooks and services that do async work are instrumented with `startSpan` — API latency is observable from the browser console in dev without opening the Network tab

---

## 016 — E2E strategy: Playwright + Page Object Model + mocked API

**Context**
The application has three critical multi-step user flows (search → card → detail → cart) that unit and integration tests cannot validate end-to-end in a real browser. The free-tier API backend has 2–5 s cold-start latency and no rate-limit guarantees.

**Options considered**
- Cypress with real API
- Playwright with real API
- Playwright with `page.route()` mocked API
- Selenium

**Decision**: Playwright + mocked API + Page Object Model (POM)

**Rationale — Playwright over Cypress**
- Native TypeScript support without a Babel transform step
- `page.route()` is a first-class interception API, not a plugin
- Multi-browser projects in a single config file (Desktop Chromium + mobile Pixel 5)
- Runs at Chromium CDP level — no iframe proxy, no CORS bypass needed

**Rationale — mocked API over real API**
- Real API calls introduce flakiness: cold-start latency, rate limits, network variance in CI
- Mock responses are synchronous — test assertions never race a network round-trip
- Fixtures live in `src/test/fixtures/` (shared with Vitest integration tests) — a single source of truth for test data
- The `api-mock.ts` fixture performs the same search logic as the server (case-insensitive name/brand filter), so search tests remain realistic without a live server

**Rationale — Page Object Model**
- POM separates selector knowledge from test assertions — when a class name changes, only the POM is updated, not every `spec` that uses that element
- Three POM classes mirror the three views:

```
e2e/
├── fixtures/
│   ├── api-mock.ts    — intercepts /products routes, returns fixture JSON
│   └── test.ts        — extended base test that auto-applies mocks to every spec
└── pages/             — Page Object Model classes
    ├── PhoneListPage.ts    — goto, search, clearSearch, clickCard, getCartItemCount
    ├── PhoneDetailPage.ts  — goto(id), selectColor, selectStorage, addToCart, getImageSrc
    └── CartPage.ts         — goto, removeItem, getItemCount, getItemNames
```

**POM design rules**
1. Selectors live only in the POM class — never inline in `spec` files
2. Actions return `Promise<void>` (or a specific value when queried) — never `Locator`
3. Selectors prefer ARIA roles and labels over CSS class names (more resilient to style refactors)
4. When a CSS selector must be used (e.g. `.phone-card`), it is centralised in the POM so the blast radius of a rename is exactly one file

**Production build in CI**
The E2E job runs `vite preview` (the minified production dist) not `vite dev`. This means E2E tests exercise the same bundle that gets deployed — dead-code elimination, chunk splitting, and tree-shaking are all exercised.

**Consequences**
- `playwright.config.ts` declares two projects: `chromium` (1280×720 desktop) and `mobile-chrome` (Pixel 5 viewport)
- `api-mock.ts` fixtures must be kept in sync with the real API response shape; the TypeScript types enforce this
- Parallel execution (`fullyParallel: true`) — each test file gets its own browser context, enabling safe parallelism
- CI uses `--workers=1` to avoid port conflicts on the shared runner; local runs use default (CPU-based) worker count

---

## 017 — Accessibility strategy: WCAG 2.1 AA + automated + manual coverage

**Context**
The spec requires "correcta accesibilidad" without specifying a standard. WCAG 2.1 AA is the industry baseline and the requirement for most EU public-sector digital services.

**Decision**: Layered approach — ESLint at write-time + axe-core at E2E run-time + manual ARIA verification

**Coverage by layer**

| Layer | Tool | When | What it catches |
|-------|------|------|----------------|
| Write-time | `eslint-plugin-jsx-a11y` | `pnpm lint` / editor | Missing `alt`, `<div onClick>`, label association |
| Automated | `@axe-core/playwright` | Every E2E run | Contrast, landmark structure, duplicate IDs, ARIA validity |
| Manual ARIA | `accessibility.spec.ts` | Every E2E run | `aria-disabled`, `aria-checked`, `aria-live`, `role="search"` |
| Keyboard | `accessibility.spec.ts` | Every E2E run | Tab order, Enter/Space activation, no focus traps |
| Color vision | `accessibility.spec.ts` | Every E2E run | Deuteranopia, protanopia, tritanopia, forced-colors |

**WCAG criteria explicitly verified in `accessibility.spec.ts`**

| Criterion | What is tested |
|-----------|---------------|
| 1.1.1 Non-text Content | All `<img>` elements have `alt`; product card images have non-empty alt |
| 1.3.1 Info and Relationships | `<nav>`, `<main>`, `role="search"`, `<dl>`/`<dt>`/`<dd>` spec pairs |
| 1.4.1 Use of Color | Color swatch selection state via `aria-checked`, not color alone; swatches have accessible names |
| 1.4.11 Non-text Contrast | Color blindness simulation matrices verify visual distinction still readable |
| 2.1.1 Keyboard | All interactive elements reachable and operable via Tab / Enter / Space |
| 2.1.2 No Keyboard Trap | Focus can always escape any element |
| 2.4.2 Page Titled | `document.title` changes per route |
| 4.1.2 Name, Role, Value | All buttons/inputs/selectors have accessible names; `aria-disabled` on CTA |

**Color vision simulation**
The `accessibility.spec.ts` suite injects a CSS SVG color-matrix filter on `<html>` to simulate three forms of color blindness using peer-reviewed Machado (2009) matrices:

| Condition | Population affected | Matrix applied |
|-----------|--------------------:|----------------|
| Deuteranopia (green-blind) | ~8% of males | `0.367 0.861 -0.228 / 0.280 0.673 0.047 / -0.012 0.043 0.969` |
| Protanopia (red-blind) | ~1% of males | `0.152 1.053 -0.205 / 0.115 0.786 0.099 / -0.004 -0.048 1.052` |
| Tritanopia (blue-blind) | ~0.1% of all | `1.256 -0.077 -0.179 / -0.078 0.931 0.148 / 0.005 0.691 0.304` |

Each simulation verifies that:
1. Color swatches have non-empty `aria-label` (accessible name independent of color)
2. Clicking a swatch sets `aria-checked="true"` — selection state is programmatic, not visual-only
3. The "Añadir al carrito" button enables — the full interaction flow works under color simulation

Windows High Contrast mode (`forcedColors: 'active'`) is also tested via `page.emulateMedia({ forcedColors: 'active' })`.

**Consequences**
- The `landmark-no-duplicate-main` axe rule is suppressed on the detail page because `Layout` wraps output in `<main>` and `PhoneDetailPage` also uses `<main>` — two nested `<main>` elements. This is a known structural limitation; fixing it requires a Layout refactor.
- Color blindness tests are only meaningful in a real browser (they rely on CSS rendering); they cannot run in Vitest/jsdom
- `aria-live="polite"` on the search results element means screen readers announce result count changes without interrupting the current reading flow

---

## 018 — Clean Architecture: layer model and enforcement

**Context**
React applications commonly collapse into a "big ball of mud" where components fetch data, apply business rules, and render output all in one place. The spec's requirement for testability and maintainability demands explicit separation of concerns.

**Decision**: Four-layer architecture with strict inward dependency flow

```
Presentation  →  Application  →  Infrastructure  →  Domain
(pages, components)  (hooks, context)  (api, services, utils)  (types)
```

**Layer responsibilities**

| Layer | Modules | Allowed imports |
|-------|---------|----------------|
| Domain | `src/types/` | None |
| Infrastructure | `src/api/`, `src/services/`, `src/utils/`, `src/env.ts` | Domain only |
| Application | `src/hooks/`, `src/context/` | Infrastructure + Domain |
| Presentation | `src/components/`, `src/pages/` | Application + Domain (never Infrastructure directly) |

**The critical rule**: Presentation modules never import from `src/api/` or `src/utils/` directly. They go through hooks (Application layer) which go through services (Infrastructure). This is enforced by code review and tested by the existence of service wrappers for every API function that a hook needs.

**Why a service layer when hooks could call the API directly?**

The service layer (`src/services/product.service.ts`) is thin by design. Its value is:
1. **Single place for business rules** — "show 20 on initial load, show all on search" lives in `fetchProducts`, not in `useProducts`
2. **Swappable implementation** — swapping the API client (e.g. for a BFF proxy) requires changing only the service, not every hook
3. **Layer boundary enforcement** — hooks import from `@/services`, never from `@/api`. `useColorFilter` previously violated this by importing `getProducts` and `getProductById` directly from `@/api/products.api`; fixed by adding `fetchAllProducts` and `fetchProductDetail` to the service

**Known structural compromise**
`Layout.tsx` (Presentation) imports `createLogger` (Infrastructure) directly. Logging is a cross-cutting concern; this is acceptable and widely practiced. The alternative (injecting a logger via props or context) adds ceremony without meaningful benefit for a DX utility.

**Consequences**
- `useProducts` and `useProductDetail` call `fetchProducts` / `fetchProductDetail` from `@/services`, not `getProducts` / `getProductById` from `@/api`
- `useColorFilter` calls `fetchAllProducts` and `fetchProductDetail` from `@/services`
- Adding a new data source (e.g. a BFF proxy) requires only changing `src/services/` and `src/api/` — hooks and components are untouched

---

## 019 — SOLID principles: application and enforcement

**Context**
SOLID is a set of five object-oriented design principles that improve maintainability, testability, and extensibility. Applying them in a React/TypeScript codebase requires translating the original class-centric formulation into functional module and hook design.

### S — Single Responsibility Principle

Each module has exactly one reason to change.

| Module | Single responsibility |
|--------|----------------------|
| `src/api/client.ts` | HTTP transport: auth header, caching, AbortController, JSON parsing |
| `src/api/products.api.ts` | Product API boundary: URL building, deduplication |
| `src/services/product.service.ts` | Product business rules: search-vs-limit default, full-catalog fetch |
| `src/utils/localStorage.ts` | Cart persistence: serialize/deserialize to browser storage |
| `src/utils/logger.ts` | Structured logging: buffer, devtools API, terminal forwarding |
| `src/context/CartContext.tsx` | Cart state: reducer, localStorage sync, provider |
| `src/hooks/useCart.ts` | Cart access: public API over CartContext |
| `src/hooks/useProducts.ts` | Product list data: debounced search, loading/error states |
| `src/hooks/useProductDetail.ts` | Single product data: fetch by ID, loading/error states |
| `src/hooks/useColorFilter.ts` | Color filter UI state: open/close, fetch colors, client-side filter |

**Avoided**: `PhoneDetailPage` previously had both "build a cart item from current selections" logic AND navigation embedded inline in `handleAddToCart`. This is acceptable because both actions are the direct consequence of the same user event (clicking "Añadir"); splitting them would produce a hook with a single call site.

### O — Open / Closed Principle

Modules are open for extension, closed for modification.

**Applied**:
- `apiClient<T>(endpoint, signal)` is generic — adding support for a new endpoint requires zero changes to `client.ts`
- `ErrorFactory` (`src/utils/error.utils.ts`) maps `ErrorCode` enum values to `AppError` instances. New error codes are added to the enum; the factory switch never changes shape for existing codes
- `cartReducer` handles actions via a discriminated union. Adding `CLEAR_CART` or a new action type requires no changes to existing `ADD_ITEM` / `REMOVE_ITEM` branches
- The `LoggerApi` interface (`createLogger`) is extensible via `child()` — new scoped loggers are created without modifying the core

**Known limitation**: `SPEC_ROWS` and `TECH_SPEC_ROWS` in `PhoneDetailPage.tsx` are static arrays of spec keys. Adding a new API spec field requires editing the file. This is an intentional trade-off: the spec fields are defined by the external API contract and are not expected to change; deriving them from the TypeScript type at runtime would require reflection and introduce fragility.

### L — Liskov Substitution Principle

Subtypes must be substitutable for their base types.

**Applied**:
- `ApiError extends Error` and `AppError extends Error` — both can be used anywhere a `Error` is expected. `instanceof Error` checks in catch blocks always hold
- `useProducts` and `useProductDetail` both return `{ data, loading, error }` shaped objects. Components can be written generically against this shape and work for both hooks
- `cartReducer` is a pure function `(state, action) => state` — it can be replaced with any function of the same signature without breaking `CartProvider`

### I — Interface Segregation Principle

No consumer is forced to depend on methods it does not use.

**Applied**:
- `CartContextType` exposes only `{ items, totalItems, totalPrice, addItem, removeItem }` — components never see the raw reducer or dispatch function
- `PhoneCard` accepts only `{ product: ProductSummary }` — it has no knowledge of cart, detail, or filter state
- `ColorSelector` accepts only `{ colors, selectedIndex, onSelect }` — no knowledge of storage, cart, or navigation
- `StorageSelector` accepts only `{ options, selectedIndex, onSelect }` — same principle

**The `LoggerApi` interface** has five methods. Components that only log errors never need `startSpan` or `debug`. This could be split into `ErrorLogger` and `SpanLogger` sub-interfaces, but the gain is marginal — the full interface is small and all existing callers use at most two methods. Kept as-is.

### D — Dependency Inversion Principle

High-level modules depend on abstractions, not concrete implementations.

**Applied**:
- Hooks depend on service functions (named exports from `product.service.ts`) — not on the concrete `apiClient` or `fetch`
- Components depend on `useCart()` (an abstraction over CartContext) — not on `CartContext` directly
- `useCart` depends on `CartContext` which depends on `localStorage` (via `getCart`/`saveCart`) — the hook never calls `localStorage` itself
- `createLogger` returns `LoggerApi` (a structural type) — callers depend on the interface, not the implementation details of `LOG_BUFFER` or `LOG_LISTENERS`

**Pragmatic compromise**: `src/api/client.ts` reads `env().apiKey` and `env().baseUrl` at module load time. Strictly, these should be injected as parameters. In practice, the `env()` function is itself the abstraction (it hides `import.meta.env`), and injecting it as a parameter would add boilerplate to every call site for no gain in a single-target deployment.

---

## 020 — API documentation: TypeDoc

**Context**
The codebase has 21 modules with non-trivial public APIs (hooks, services, utilities, context). Keeping a separate Markdown reference document in sync with the source would require manual updates on every function signature change. A solution that generates documentation directly from the source eliminates that maintenance burden.

**Options considered**
- Hand-written Markdown in `docs/`
- JSDoc comments with no generator (readable in editor only)
- TypeDoc (TypeScript-native, HTML output)
- Storybook (primarily for component visual docs, not API reference)
- API Extractor + API Documenter (Microsoft, geared toward library publishing)

**Decision**: TypeDoc 0.26.11

**Rationale**
- TypeDoc reads TypeScript types natively — it does not need a separate Babel or JSDoc parser. Parameter types, return types, and generics in the generated HTML come directly from the compiled type information, not from `@type` annotations
- Output stays in sync automatically: regenerating docs after a function rename produces correct output without touching a single comment
- `entryPointStrategy: "expand"` walks the entire `src/` tree and picks up every exported symbol — no manual entry-point list to maintain
- The same TSDoc comment (`/** … */`) that TypeDoc processes is also rendered inline by VS Code's IntelliSense and the TypeScript language server — one comment serves two audiences (IDE users and documentation site readers)
- `excludePrivate: true` hides implementation details (`LOG_BUFFER`, `dedupeProductsById`, etc.) — the generated site shows only the public contract

**Configuration (`typedoc.json`)**

```jsonc
{
  "entryPoints": ["./src"],
  "entryPointStrategy": "expand",   // walk full tree, no manual list
  "out": "typedoc",                  // output directory (gitignored)
  "exclude": [                       // keep docs focused on production code
    "**/*.test.ts", "**/*.test.tsx",
    "**/*.spec.ts", "**/*.spec.tsx",
    "**/node_modules/**", "**/dist/**"
  ],
  "excludePrivate": true,            // hide internal helpers
  "excludeExternals": true,          // hide re-exported third-party types
  "includeVersion": true,            // version from package.json in page title
  "readme": "README.md",             // README becomes the front page
  "tsconfig": "./tsconfig.app.json", // same compiler options as the build
  "name": "Zara Challenge Documentation",
  "categorizeByGroup": true,         // groups symbols by their source folder
  "sort": ["source-order"]           // preserves declaration order within files
}
```

**How to use it**

```bash
# Generate HTML docs once → opens typedoc/index.html
pnpm typedoc

# Regenerate on every file save (useful when writing new APIs)
pnpm typedoc:watch

# Output location
typedoc/index.html   ← entry point
typedoc/             ← full static site (gitignored, never committed)
```

The `typedoc/` directory is listed in `.gitignore` — it is a generated artifact, not source. It should be generated locally when needed or published to a static host (GitHub Pages, Netlify) as part of CI if desired.

**What to document and how**

Document every exported symbol in the Infrastructure and Application layers. Presentation layer components document their props type and any non-obvious rendering logic.

**Required JSDoc tags by module type:**

| Module type | Required tags | Optional tags |
|-------------|--------------|---------------|
| Service / API function | `@param`, `@returns`, `@throws` | `@example` |
| Custom hook | `@returns` (with shape description) | `@example`, `@remarks` |
| Utility function | `@param`, `@returns` | `@throws`, `@example` |
| Type / interface | Per-field `/** … */` inline comment | — |
| React component | Props type doc, rendering behaviour note | `@example` |

**Tag reference with real examples from this codebase:**

```typescript
/**
 * One-line summary of what the function does.
 *
 * Additional paragraphs for context, edge cases, or design rationale.
 *
 * @param id - Unique product identifier (e.g. `'APL-IP15P'`).
 * @param signal - Optional AbortSignal; cancels the underlying fetch when fired.
 * @returns Full {@link ProductDetail} including specs and similar products.
 * @throws {ApiError} Server responded with a non-2xx status (including 404).
 * @throws {DOMException} Request was cancelled via `signal` (name: 'AbortError').
 *
 * @example
 * ```ts
 * const detail = await fetchProductDetail('APL-IP15P');
 * console.log(detail.name); // "iPhone 15 Pro"
 * ```
 */
export const fetchProductDetail = async (
  id: string,
  signal?: AbortSignal,
): Promise<ProductDetail> => { … };
```

**`{@link TypeName}`** creates a hyperlink to the TypeDoc page for that type — use it whenever a param or return type is a domain type defined in `src/types/`.

**What NOT to document:**
- Implementation-only helpers that are not exported (TypeDoc ignores them automatically with `excludePrivate: true`)
- Obvious one-liner utilities where the type signature is self-documenting (e.g. `const isAbortError = (e: unknown): boolean`)
- Test files — excluded by the `typedoc.json` glob patterns

**Consequences**
- Every exported function, hook, and type in `src/` is covered by a TSDoc comment — enforced by the team convention documented here
- `pnpm typedoc` is safe to run at any time; it never modifies source files
- The generated site can be published to GitHub Pages by adding a CI step: `pnpm typedoc && gh-pages -d typedoc`
- TypeDoc version is pinned via the pnpm catalog (`pnpm-workspace.yaml`) so the output format is stable across machines
