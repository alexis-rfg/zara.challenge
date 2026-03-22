# Zara Challenge — Mobile Phone Catalog

A web application for browsing, searching, and managing a mobile phone catalog.
Built as the Zara / Inditex frontend technical challenge.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick start](#quick-start)
3. [Running the app](#running-the-app)
4. [Running tests](#running-tests)
5. [Project structure](#project-structure)
6. [Architecture](#architecture)
7. [Technical decisions](#technical-decisions)
8. [Dependency management — pnpm workspace & catalog](#dependency-management--pnpm-workspace--catalog)
9. [API](#api)
10. [CI/CD](#cicd)

---

## Prerequisites

| Tool | Minimum version | Notes |
|------|----------------|-------|
| **Node.js** | 18 | Declared in `package.json` under `"engines"` and in `.nvmrc` |
| **pnpm** | 9 | This project uses pnpm workspaces — `npm install` will not resolve catalog versions correctly |

```bash
# Install pnpm (if not already installed)
npm install -g pnpm

# Switch to the right Node version automatically (requires nvm or fnm)
nvm use
# or
fnm use
```

---

## Quick start

```bash
# 1. Clone
git clone <repo-url>
cd zara-challenge

# 2. Install dependencies (must use pnpm)
pnpm install

# 3. Set up environment variables
cp .env.example .env
# The .env.example already contains the public challenge API key — no edits needed.

# 4. Start the dev server
pnpm dev
# Opens http://localhost:3000
```

---

## Running the app

### Development mode

```bash
pnpm dev
```

Starts a local server at `http://localhost:3000`. Assets are served **unminified** — each module arrives as a separate ES module request. Hot module replacement is active.

### Production build

```bash
pnpm build
```

Outputs to `dist/`. JavaScript is **concatenated into chunks and minified** by esbuild. CSS is compiled from SCSS and minified. Three output chunks are emitted:

| Chunk | Contents | Why separate |
|-------|----------|-------------|
| `vendor-[hash].js` | React + React DOM | Rarely changes — long cache lifetime |
| `router-[hash].js` | React Router | Changes at a different cadence than app code |
| `index-[hash].js` | Application code | Changes with every release |

### Preview the production build locally

```bash
pnpm build && pnpm preview
# Serves dist/ at http://localhost:4173
```

---

## Running tests

### Unit and integration tests (Vitest)

```bash
# All tests — single pass
pnpm test

# Only unit tests
pnpm test:unit

# Only integration tests
pnpm test:intg

# Watch mode (re-runs on save)
pnpm test:watch

# Coverage report — outputs to coverage/index.html
pnpm test:coverage

# Interactive UI (Vitest browser UI)
pnpm test:ui
```

### End-to-end tests (Playwright)

```bash
# Install browsers (one-time, first run)
pnpm exec playwright install chromium

# Run E2E tests (headless)
pnpm test:e2e

# Run E2E with browser visible
pnpm test:e2e:headed

# Interactive UI mode
pnpm test:e2e:ui

# Debug a specific test
pnpm test:e2e:debug
```

> The E2E tests use mocked API responses (`page.route()`), so they run fully offline and produce deterministic results. No real network calls are made.

### Code quality

```bash
# TypeScript type check
pnpm type-check

# ESLint (report only)
pnpm lint

# ESLint (auto-fix safe violations)
pnpm lint:fix

# Prettier (check formatting without modifying)
pnpm format:check

# Prettier (format all source files)
pnpm format

# Run type-check + lint + all tests in one pass
pnpm verify
```

---

## Project structure

```
zara-challenge/
├── .env.example                # Env template — copy to .env
├── .nvmrc                      # Node 18 version pin
├── .github/
│   └── workflows/
│       └── ci.yml              # CI: quality → build → test → e2e
├── e2e/
│   └── specs/                  # Playwright E2E suites (phone-list, detail, cart, a11y)
├── src/
│   ├── api/
│   │   ├── client.ts           # Authenticated fetch wrapper + 5-min cache + AbortController
│   │   └── products.api.ts     # getProducts(), getProductById(), deduplication
│   ├── components/
│   │   ├── BackButton/         # "← Back to products" link shown on detail page
│   │   ├── ColorFilter/        # Mobile-only client-side color filter
│   │   ├── ColorSelector/      # Color swatches using hexCode; updates hero image
│   │   ├── Layout/             # Wraps all routes — renders Navbar + <Outlet />
│   │   ├── LazyImage/          # Intersection Observer lazy-loading wrapper
│   │   ├── Navbar/             # Home icon + cart count badge (visible on all pages)
│   │   ├── PhoneCard/          # Reusable card — list and similar products
│   │   ├── SearchBar/          # Search input with results count indicator inside it
│   │   ├── SimilarProducts/    # Horizontal carousel of PhoneCards
│   │   └── StorageSelector/    # All options visible simultaneously with prices
│   ├── context/
│   │   ├── CartContext.tsx     # CartProvider + useReducer + localStorage sync
│   │   └── createCartContext.ts# React.createContext factory (testable in isolation)
│   ├── hooks/
│   │   ├── useCart.ts          # Consumes CartContext — exposes add/remove/total
│   │   ├── useColorFilter.ts   # Client-side color filter logic
│   │   ├── useDebounce.ts      # Generic debounce hook (300 ms)
│   │   ├── useProductDetail.ts # Fetches GET /products/:id with loading/error states
│   │   └── useProducts.ts      # Fetches product list; enforces limit=20 / search rules
│   ├── pages/
│   │   ├── CartPage/           # /cart — items, delete buttons, total, continue shopping
│   │   ├── NotFoundPage/       # * — 404 fallback
│   │   ├── PhoneDetailPage/    # /products/:id — full detail, selectors, add to cart
│   │   └── PhoneListPage/      # / — CSS Grid of phones + SearchBar + ColorFilter
│   ├── services/
│   │   └── product.service.ts  # Business-logic wrapper: limit=20 on load, no limit on search
│   ├── styles/
│   │   ├── global.scss         # Resets, base styles, Helvetica font, @keyframes
│   │   └── variables.scss      # Design tokens: colors, spacing, typography, breakpoints
│   ├── test/
│   │   ├── fixtures/           # JSON test data (products, details, cart, colors, storage)
│   │   ├── setup.ts            # Vitest setup — RTL matchers + fetch mock
│   │   └── README.md           # Test strategy documentation
│   ├── types/
│   │   ├── cart.types.ts       # CartItem, CartState, CartAction, CartContextType
│   │   ├── error.types.ts      # Error type definitions
│   │   └── product.types.ts    # ProductSummary, ProductDetail, ColorOption, StorageOption
│   ├── utils/
│   │   ├── carouselScroll.ts   # Horizontal overflow detection for SimilarProducts
│   │   ├── error.utils.ts      # ErrorFactory + error handling helpers
│   │   ├── localStorage.ts     # getCart(), saveCart(), clearCart()
│   │   ├── logger.ts           # createLogger() — scoped spans for structured debugging
│   │   └── logger.types.ts     # Logger type definitions
│   ├── App.tsx                 # BrowserRouter + CartProvider + route setup
│   ├── env.ts                  # requireEnv() — typed, validated env var access
│   └── main.tsx                # React root mount
├── vite-plugins/               # Custom Vite plugins (e.g. log-receiver for dev)
├── package.json                # Scripts + deps (uses catalog: for versions)
├── pnpm-workspace.yaml         # pnpm v9 catalog — all dependency versions live here
├── playwright.config.ts        # Playwright config: chromium + mobile-chrome
├── vite.config.ts              # Build config — esbuild minification, chunk splitting
└── tsconfig*.json              # TypeScript project references (app / test / e2e / node)
```

---

## Architecture

The project follows a **Clean Architecture** layering where dependencies flow strictly inward:

```
Presentation   (pages/, components/)
      ↓
Application    (hooks/, context/)
      ↓
Infrastructure (api/, services/, utils/)
      ↓
Domain         (types/)   ← zero imports
```

**Pages** depend on **hooks** (never on `fetch` directly).
**Hooks** depend on **API / service functions** (never on React components).
**Types** have zero imports — they are the stable, leaf-level foundation.

### State management

Cart state is managed with **React Context API + `useReducer`**. The context is initialized from `localStorage` on mount and synced back to `localStorage` on every state change via `useEffect`. Components consume the cart through the `useCart()` hook, which exposes a minimal surface (`items`, `addItem`, `removeItem`, `totalItems`, `totalPrice`) without leaking the raw `dispatch` function or the context object itself.

```
App mounts
    → CartProvider reads localStorage → seeds initial state

User adds a phone
    → useCart().addItem(cartItem)
    → CartContext dispatches ADD_ITEM
    → useReducer produces new state
    → useEffect syncs state → localStorage
    → Navbar re-renders with updated totalItems
```

### SOLID principles applied

| Principle | Concrete example |
|-----------|----------------|
| **Single Responsibility** | `api/client.ts` only injects the auth header and manages caching. `utils/localStorage.ts` only serialises/deserialises JSON. `CartContext` only manages cart state. |
| **Open / Closed** | `PhoneCard` is extended via props — the same component renders in the list view and in "Productos similares" without modification. |
| **Interface Segregation** | `PhoneCard` receives only `{ id, brand, name, basePrice, imageUrl }`, not the full `ProductDetail` with 20+ fields. `useCart()` exposes only what components need. |
| **Dependency Inversion** | Pages depend on hooks (abstractions), not on `fetch()` directly. `CartContext` depends on `getCart`/`saveCart` (abstractions), not on `window.localStorage` directly. |

---

## Technical decisions

### React 19

React 19 was released as stable in December 2024. It satisfies the spec's `React >= 17` requirement and is fully production-ready. Context API, hooks, JSX, and React Router v6 all work identically to React 18 — no migration cost.

### React Compiler — excluded

The React Compiler (formerly "React Forget") ships alongside React 19 but is optional. It is **not used** here: memoisation edge-cases in compiler-transformed bundles are harder to diagnose, and the performance benefit does not outweigh the debugging cost at this scale. `@vitejs/plugin-react` is used without the Babel compiler plugin — standard JSX transform only.

### Vite over Create React App

CRA is officially unmaintained. Vite satisfies both build mode requirements (dev: unminified ES modules via native browser ESM; prod: concatenated + minified via Rollup + esbuild) with significantly faster startup and HMR.

### SASS over Styled Components

SASS produces static CSS at build time — zero runtime overhead. Styled Components injects styles at runtime, adds ~15 KB to the bundle, and complicates SSR hydration. SASS with BEM naming provides the same component-scoped isolation without the trade-offs.

### `rem` units over `px` for accessibility

All spacing, typography, and layout values use `rem` so the application scales correctly with the user's browser font-size preference (WCAG 2.1 SC 1.4.4). The base reference is `1 rem = 16 px` (browser default).

```scss
// src/styles/variables.scss
$spacing-xs: 0.25rem;  // 4px
$spacing-sm: 0.5rem;   // 8px
$spacing-md: 1rem;     // 16px
$spacing-lg: 1.5rem;   // 24px
$spacing-xl: 2rem;     // 32px
```

### Native `fetch` over Axios

The API layer is a thin typed wrapper around `fetch`. Axios adds ~14 KB to the bundle for features — interceptors, automatic JSON parsing, request cancellation — that require ~30 lines with `fetch` + `AbortController`. The custom `apiClient` in `src/api/client.ts` covers all needed functionality:

- Automatic `x-api-key` header injection
- 5-minute in-memory response cache (reduces cold-start latency on the free-tier API)
- `AbortController` integration for React StrictMode double-invoke cleanup and route navigation cancellation

### Search: form submission, not `onChange`

The spec requires "real-time search" but the API is on a free-tier host with noticeable cold-start latency. Triggering a fetch on every keypress would result in a poor experience (stale responses, rapid re-renders). The implementation uses a form with an `onSubmit` handler plus an explicit clear action — users type, then press Enter or click the search icon. This satisfies the spirit of real-time search while keeping the API interaction predictable. A 300 ms debounce hook (`useDebounce`) is available and would be the next step if an `onChange` strategy were preferred.

### React Context API over Redux / Zustand

The spec mandates React Context API. Even without that constraint, the cart state is simple: an array with two mutations (add, remove). A global state library would add complexity without benefit.

### localStorage for cart persistence

The spec mandates localStorage. Cart state is read on app initialisation and written on every state change via a `useEffect` in `CartProvider`. Items are stored as JSON under the stable key `"zara-cart"`. The `utils/localStorage.ts` module handles all serialisation and guards against `JSON.parse` failures.

---

## Dependency management — pnpm workspace & catalog

This project uses a **pnpm workspace** (`pnpm-workspace.yaml`) with the **catalog** feature (pnpm 9+). Every dependency version lives in one place: the `catalog:` block in `pnpm-workspace.yaml`. `package.json` references them with the token `"catalog:"`.

```
pnpm-workspace.yaml          package.json
─────────────────────        ──────────────────
catalog:                     "dependencies": {
  react: "^19.2.4"    ←──     "react": "catalog:",
  vite:  "^6.0.3"     ←──     "vite":  "catalog:",
  ...                          ...
                             }
```

**Why this matters:**

| Benefit | Detail |
|---------|--------|
| Single source of truth | All 21 package versions are in one file — no hunting across `package.json` files |
| Eliminates version drift | Every part of the workspace sees the same resolved version |
| Cleaner diffs | Version bumps appear as one line in `pnpm-workspace.yaml`, not scattered across multiple files |
| Monorepo-ready | Adding a second package (e.g. an Express BFF) instantly inherits the catalog — no restructuring |

```bash
# Upgrade a dependency across the entire workspace:
# 1. Edit the version in pnpm-workspace.yaml
# 2. pnpm install — all packages pick up the new version automatically

# Check what is outdated:
pnpm outdated --recursive
```

---

## API

**Base URL**: `https://prueba-tecnica-api-tienda-moviles.onrender.com`

**Authentication**: Every request includes an `x-api-key` header. The key is read from the `VITE_API_KEY` environment variable in `src/env.ts` — it is never hardcoded in source.

| Endpoint | Used for |
|----------|---------|
| `GET /products?limit=20` | Initial home load — first 20 phones |
| `GET /products?search=<term>` | Search by name or brand — all matching results, no limit |
| `GET /products/:id` | Full product detail including `similarProducts` (no extra call needed) |

Full API docs: `https://prueba-tecnica-api-tienda-moviles.onrender.com/docs/`

> **Note on image URLs**: The API serves images over `http://` (not `https://`). Deploying to an HTTPS host causes mixed-content browser warnings. Mitigation options: add `Content-Security-Policy: upgrade-insecure-requests` to server response headers, or proxy image requests server-side.

---

## CI/CD

The GitHub Actions pipeline at `.github/workflows/ci.yml` runs on every push to `main` / `develop` and on pull requests targeting those branches.

```
setup
  └─ pnpm install --frozen-lockfile (cached by lockfile hash)

quality  (parallel)           build  (parallel)
  ├─ tsc --noEmit             └─ pnpm build
  ├─ tsc -p tsconfig.e2e.json     (placeholder env vars baked in)
  ├─ eslint .
  └─ prettier --check

test  (needs: setup + build)
  ├─ vitest run
  ├─ vitest run --coverage → Codecov upload
  └─ (uses dist/ artifact from build job)

e2e  (needs: quality + build + test)
  └─ playwright test  (chromium + mobile-chrome, API fully mocked)
      → playwright-report/ artifact uploaded on every run
      → test-results/ artifact uploaded on failure
```

The E2E job uses placeholder env vars (`VITE_API_BASE_URL=https://api.example.com`) because all network requests are intercepted by `page.route()` — no real API calls are made in CI.
