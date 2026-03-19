# Zara Challenge — Mobile Phone Catalog

A web application for browsing, searching, and purchasing mobile phones. Built for the Zara/Inditex frontend technical challenge.

**Live demo**: _[deploy URL here]_

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Running the app](#running-the-app)
4. [Running tests](#running-tests)
5. [Project structure](#project-structure)
6. [Architecture](#architecture)
7. [Technical decisions](#technical-decisions)
8. [Dependency management — pnpm workspace & catalog](#dependency-management--pnpm-workspace--catalog)
9. [API](#api)

---

## Prerequisites

- **Node.js >= 18** — the project declares this constraint in `package.json` under `"engines"`. Use [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm) to manage Node versions.
- **npm >= 9** (bundled with Node 18)

```bash
# If using nvm, switch to the correct version automatically:
nvm use
# or manually:
nvm install 18 && nvm use 18
```

---

## Installation

```bash
# Clone the repository
git clone <repo-url>
cd zara-challenge

# Install dependencies
npm install

# Copy the environment file and add your API key
cp .env.example .env
# The API key is already set in .env.example for this challenge
```

---

## Running the app

### Development mode

```bash
npm run dev
```

Starts a local server at `http://localhost:3000`. Assets are served **unminified** — each module is a separate HTTP request. Hot module replacement is active.

### Production build

```bash
npm run build
```

Outputs to `dist/`. JavaScript is **concatenated into chunks and minified** by esbuild. CSS is compiled from SCSS and minified.

### Preview the production build locally

```bash
npm run build
npm run preview
# Serves dist/ at http://localhost:4173
```

---

## Running tests

```bash
# All tests (single run)
npm run test

# Watch mode (during development)
npm run test:watch

# Coverage report
npm run test:coverage
# Opens coverage/index.html for the HTML report
```

### Linting and formatting

```bash
# Check for lint errors
npm run lint

# Auto-fix safe lint violations
npm run lint:fix

# Format all source files
npm run format

# Check formatting without modifying files (used in CI)
npm run format:check

# TypeScript type check without building
npm run type-check
```

---

## Project structure

```
src/
├── api/
│   ├── client.ts              # Base fetch wrapper — injects x-api-key on every request
│   └── products.api.ts        # getProducts(), getProductById()
├── components/
│   ├── Navbar/                # Site navigation — home icon + cart count badge
│   ├── PhoneCard/             # Reusable card — used in list and similar products
│   ├── SearchBar/             # Search input with results count indicator inside it
│   ├── ColorSelector/         # Color swatches using hex codes
│   ├── StorageSelector/       # Storage option pills — all options visible simultaneously
│   └── SimilarProducts/       # Grid of clickable PhoneCards at the bottom of detail
├── context/
│   └── CartContext.tsx        # CartProvider + useCart hook + useReducer + localStorage sync
├── hooks/
│   ├── useProducts.ts         # Fetches list with debounced search
│   ├── useProductDetail.ts    # Fetches single product by id
│   └── useDebounce.ts         # Generic debounce hook (300ms)
├── layout/
│   └── Layout.tsx             # Wraps all routes — renders Navbar + <Outlet />
├── pages/
│   ├── PhoneListPage/         # / — CSS Grid of phones + search bar
│   ├── PhoneDetailPage/       # /phone/:id — full detail, selectors, add to cart
│   ├── CartPage/              # /cart — cart items, total, delete, continue shopping
│   └── NotFoundPage/          # * — 404 fallback
├── styles/
│   ├── _variables.scss        # CSS custom properties + SASS compile-time vars
│   ├── _reset.scss            # Box-sizing, margin reset
│   ├── _breakpoints.scss      # Mobile/tablet/desktop media query mixins
│   ├── _typography.scss       # font-family: Helvetica, Arial, sans-serif; on body
│   └── main.scss              # @use all partials
├── types/
│   └── index.ts               # ProductSummary, ProductDetail, CartItem — no imports
├── utils/
│   ├── localStorage.ts        # getCart(), saveCart(), clearCart()
│   └── formatPrice.ts         # formatPrice(1329) → "€1,329"
├── env.ts                     # Typed, validated env var access — the ONLY place import.meta.env is read
├── App.tsx                    # React Router v6 setup
└── main.tsx                   # React root + CartProvider
```

---

## Architecture

The project follows a **Clean Architecture** layering where dependencies flow inward only:

```
Presentation  (pages/, components/)
     ↓
Application   (hooks/, context/)
     ↓
Infrastructure (api/, utils/)
     ↓
Domain        (types/)
```

**Pages** depend on **hooks** (never on `fetch` directly).
**Hooks** depend on **API functions** (never on React components).
**Types** have zero imports — they are the stable foundation.

### State management

Cart state is managed with **React Context API + useReducer**. The context is initialized from `localStorage` on mount and synced back on every state change via `useEffect`. Components access the cart through the `useCart()` hook, which exposes a minimal interface (`items`, `addItem`, `removeItem`, `totalItems`, `totalPrice`) without leaking the raw `dispatch` function.

### SOLID principles applied

| Principle | Example |
|-----------|---------|
| **Single Responsibility** | `api/client.ts` only adds the auth header. `utils/localStorage.ts` only reads/writes JSON. `CartContext` only manages cart state. |
| **Open/Closed** | `PhoneCard` is extended via props — the same component renders in the list, in similar products, and potentially elsewhere without modification. |
| **Interface Segregation** | `PhoneCard` receives only `{ id, brand, name, basePrice, imageUrl }` — not the full `ProductDetail` with 20+ fields. `useCart()` exposes only what components need. |
| **Dependency Inversion** | Pages depend on hooks (abstractions), not on `fetch()` directly. `CartContext` depends on `getCart`/`saveCart` (abstractions), not on `window.localStorage` directly. |

---

## Technical decisions

### React 19 — without the compiler

React 19 was released as **stable** in December 2024 and is the version used in this project. It satisfies the spec requirement of `React >= 17` and is production-ready:

- **Stable release**: Full semantic versioning, no RC/beta caveats — has been stable for over a year.
- **No breaking changes for this use case**: Context API, hooks, JSX, and React Router all work identically to React 18.
- **Ecosystem support**: `react-router-dom` v6, `@testing-library/react` v16, and `eslint-plugin-react-hooks` v5 all have explicit React 19 support.

### React Compiler — excluded

The React Compiler (formerly "React Forget") is an optional build-time transform that ships alongside React 19 and automatically inserts memoization. It is **not used** in this project:

- Memoization edge cases in production are harder to diagnose in a compiler-transformed bundle.
- The compiler's interaction with third-party libraries is not yet exhaustively documented.
- The performance benefit does not outweigh the debugging cost at this stage.

`@vitejs/plugin-react` is used without the Babel compiler plugin — standard JSX transform only.

### Vite over Create React App

CRA is officially unmaintained. Vite satisfies both build mode requirements (dev: unminified ES modules, prod: concatenated + minified via Rollup + esbuild) with faster startup and HMR.

### SASS over Styled Components

SASS produces static CSS at build time — zero runtime overhead. Styled Components injects styles at runtime, adding ~15 KB to the bundle and complicating SSR. SASS `.module.scss` provides the same component-scoped isolation without the trade-offs.

### `rem` units over `px` for accessibility

All spacing, typography, and layout values use `rem` units instead of `px` to ensure the application scales correctly with user browser font size preferences:

**Why `rem`:**
- **Accessibility**: Respects user's browser font size settings (WCAG 2.1 Success Criterion 1.4.4)
- **Consistent scaling**: All components scale together harmoniously when users zoom or change font size
- **Better responsive design**: Media query breakpoints in `rem` adapt to user preferences
- **Easy mental math**: `1rem = 16px` (browser default), making conversions straightforward

**Conversion reference:**
```scss
// Design tokens in src/styles/variables.scss
$spacing-xs: 0.25rem;   // 4px
$spacing-sm: 0.5rem;    // 8px
$spacing-md: 1rem;      // 16px
$spacing-lg: 1.5rem;    // 24px
$spacing-xl: 2rem;      // 32px

$font-size-sm: 0.875rem;   // 14px
$font-size-base: 1rem;     // 16px
$font-size-lg: 1.125rem;   // 18px

$max-width: 75rem;      // 1200px
```

**Example impact:**
If a user sets their browser font size to 20px (125% zoom):
- `rem`-based design: Everything scales up proportionally — layout remains balanced
- `px`-based design: Text grows but spacing stays fixed — layout breaks

### Native `fetch` over Axios

The API layer is a thin typed wrapper around `fetch`. Axios adds ~14 KB to the bundle for features (interceptors, automatic JSON, request cancellation) that can be implemented in ~30 lines with `fetch` + `AbortController`.

### React Context API over Redux/Zustand

The spec mandates React Context API. Even without that constraint, the cart state is simple enough — an array with two operations (add, remove) — that a global state library would add complexity without benefit.

### localStorage for cart persistence

The spec mandates localStorage. Cart state is read on app init and written on every state change via a `useEffect` in `CartProvider`. Items are stored as JSON with a stable key (`"zara-cart"`).

---

## Dependency management — pnpm workspace & catalog

This project uses a **pnpm workspace** (declared in `pnpm-workspace.yaml`) with a **catalog** — a pnpm 9+ feature that centralises every package version in one place and replaces inline version specifiers in `package.json` with the token `"catalog:"`.

### How it works

```
pnpm-workspace.yaml          package.json
─────────────────────        ──────────────────────────────────
catalog:                     "dependencies": {
  react: "^19.2.4"     ←──    "react": "catalog:",
  vite:  "^6.0.3"      ←──    "vite":  "catalog:",
  ...                          ...
                             }
```

`pnpm install` resolves `"catalog:"` by looking up the version in the catalog and writes the resolved specifier into `pnpm-lock.yaml`. The installed version in `node_modules` is identical to what you would get by writing the version string directly.

### Benefits

#### Single source of truth for versions
All 21 package versions live in one block inside `pnpm-workspace.yaml`. There is no need to open `package.json` to update a version — one edit propagates everywhere in the workspace automatically.

#### Eliminates version drift across packages
In a monorepo with multiple `package.json` files, the same library can drift to different versions in different packages, causing subtle runtime bugs and inflated `node_modules`. The catalog makes every package reference the same resolved version, so `react` is always `19.2.4` everywhere — not `19.2.4` in one package and `19.0.0` in another.

#### Cleaner `package.json` diffs
Version bumps previously produced noisy diffs scattered across multiple `package.json` files. With a catalog, bumping `vite` is a single line change in `pnpm-workspace.yaml` regardless of how many packages use it. Code reviewers see one change, not ten.

#### Prevents accidental version mismatches
Without a catalog, a developer running `pnpm add some-lib` in one package will install the latest version there, while other packages stay pinned to an older one. The catalog makes the mismatch immediately visible — the new version appears in `pnpm-workspace.yaml` and reviewers can decide whether all packages should adopt it.

#### `pnpm-lock.yaml` stays consistent
Because every `"catalog:"` specifier resolves to exactly one version entry in the lockfile, deduplication is maximised. The same package is not listed multiple times at different versions, which reduces lockfile churn and speeds up installs on CI.

#### Straightforward upgrades
```bash
# Preview what is outdated across the whole workspace:
pnpm outdated --recursive

# Bump a single package in the catalog and reinstall:
# 1. Edit the version in pnpm-workspace.yaml
# 2. Run pnpm install — all packages pick up the new version automatically
```

#### Works today, scales to a monorepo
Even though this project is a single package, the workspace is already in place. Adding a second package (e.g. an Express BFF, a shared types package, a Storybook) requires only declaring the new path in `pnpm-workspace.yaml` — the catalog immediately covers its dependencies too, with no restructuring.

### Files involved

| File | Role |
|------|------|
| `pnpm-workspace.yaml` | Declares workspace packages and the default catalog |
| `package.json` | Uses `"catalog:"` as the specifier for every dependency |
| `pnpm-lock.yaml` | Records the resolved version for each `catalog:` reference |

---

## API

**Base URL**: `https://prueba-tecnica-api-tienda-moviles.onrender.com`

**Authentication**: Every request includes `x-api-key` header. The key is read from the `VITE_API_KEY` environment variable — never hardcoded.

> **Note**: API images are served over `http://` (not `https://`). Deploying to an HTTPS host will produce mixed-content browser warnings. Solutions: add `Content-Security-Policy: upgrade-insecure-requests` to server response headers, or proxy image requests server-side.

| Endpoint | Usage |
|----------|-------|
| `GET /products?limit=20` | Initial home load — first 20 phones |
| `GET /products?search=<term>` | Search by name or brand — all matching results, no limit |
| `GET /products/:id` | Full product detail including `similarProducts` |

Full API documentation: `https://prueba-tecnica-api-tienda-moviles.onrender.com/docs/`
