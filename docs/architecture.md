# Architecture

## Overview

The application is a client-side React SPA that consumes a single REST API. There is no custom backend — Node 18 is declared as a runtime requirement (via `package.json` `"engines"` and `.nvmrc`) to satisfy the challenge spec and to leave the door open for a thin BFF proxy without restructuring.

```
Browser (React SPA)
    ↕  https
API  https://prueba-tecnica-api-tienda-moviles.onrender.com
    ↕
Free-tier render.com host (cold start latency ~2–5 s)
```

---

## Layer model

Dependencies flow strictly inward. No lower layer ever imports from a higher layer.

```
┌─────────────────────────────────────────────────┐
│  Presentation  (pages/, components/)             │
│  What the user sees and interacts with.          │
│  No business logic, no direct fetch calls.       │
└──────────────────────┬──────────────────────────┘
                       │ imports
┌──────────────────────▼──────────────────────────┐
│  Application   (hooks/, context/)                │
│  Orchestrates data fetching and shared state.    │
│  No JSX, no styling, no DOM manipulation.        │
└──────────────────────┬──────────────────────────┘
                       │ imports
┌──────────────────────▼──────────────────────────┐
│  Infrastructure  (api/, services/, utils/)       │
│  Talks to the outside world (network, storage).  │
│  No React — plain TypeScript modules.            │
└──────────────────────┬──────────────────────────┘
                       │ imports
┌──────────────────────▼──────────────────────────┐
│  Domain        (types/)                          │
│  Type definitions only. Zero imports.            │
│  The stable foundation that never changes shape. │
└─────────────────────────────────────────────────┘
```

---

## Component tree

```
App
├── CartProvider              ← single global cart state provider
│   └── BrowserRouter
│       └── Layout            ← renders Navbar + <Outlet />
│           ├── Navbar         ← home icon + cart badge on every page
│           └── <route outlet>
│               ├── /                → PhoneListPage
│               │   ├── SearchBar    ← form + results count indicator
│               │   ├── ColorFilter  ← mobile-only client-side filter
│               │   └── PhoneCard[]  ← CSS Grid, each is a <Link>
│               ├── /products/:id   → PhoneDetailPage
│               │   ├── BackButton
│               │   ├── LazyImage    ← hero image, swaps on color pick
│               │   ├── ColorSelector  ← hex swatches
│               │   ├── StorageSelector ← pills with prices
│               │   ├── "Añadir al carrito" button
│               │   └── SimilarProducts
│               │       └── PhoneCard[] ← each is a <Link>
│               ├── /cart           → CartPage
│               │   ├── CartItem[] (image, specs, price, delete)
│               │   ├── total price
│               │   └── "Continuar comprando" button
│               └── *               → NotFoundPage
```

---

## Data flow

### Phone list page

```
PhoneListPage mounts
    → useProducts(search='', limit=20)
        → product.service.fetchProducts({ limit: 20 })
            → apiClient.get('/products?limit=20')
                → fetch + x-api-key header
                → (cache miss) real HTTP call
                → (cache hit, <5 min) returns cached response
        → returns { phones: ProductSummary[], loading, error }
    → CSS Grid renders PhoneCard × 20
    → SearchBar shows "20 results"

User types a search term and presses Enter
    → useProducts(search='samsung')
        → product.service.fetchProducts({ search: 'samsung' })
            → apiClient.get('/products?search=samsung')   ← no limit
        → returns matching results
    → SearchBar shows "N results for 'samsung'"
```

### Phone detail page

```
PhoneDetailPage mounts (route: /products/:id)
    → useProductDetail(id)
        → apiClient.get('/products/:id')
        → returns { product: ProductDetail, loading, error }
    → renders hero image from colorOptions[0].imageUrl

User selects a color swatch
    → selectedColor state updates
    → hero <img> src = colorOptions[selectedIndex].imageUrl

User selects a storage option
    → selectedStorage state updates
    → displayed price = storageOptions[selectedIndex].price
    → "Añadir al carrito" button enables (both selections made)

User clicks "Añadir al carrito"
    → useCart().addItem(cartItem)   ← CartItem captures resolved values at this moment
        → CartContext ADD_ITEM dispatch
        → useReducer → new state
        → useEffect → localStorage.setItem('zara-cart', JSON.stringify(state))
        → Navbar badge re-renders with new totalItems
```

### Cart page

```
CartPage mounts
    → useCart() reads CartContext (pre-seeded from localStorage on app init)
    → renders items list

User clicks delete on an item
    → useCart().removeItem(index)
        → REMOVE_ITEM dispatch
        → new state → localStorage sync
        → total price recalculated

User clicks "Continuar comprando"
    → navigate('/')   ← NOT router.back(), always goes to home
```

---

## API integration

### `src/api/client.ts`

```
apiClient.get(path, params?, signal?)
    1. Builds URL: baseUrl + path + query string
    2. Checks in-memory cache (key = full URL)
       → cache hit and entry age < 5 min: return cached data
       → cache miss or stale: proceed
    3. fetch(url, { headers: { 'x-api-key': VITE_API_KEY }, signal })
    4. Response not ok → throw ApiError(status, message)
    5. response.json() → store in cache → return data
    6. AbortError → rethrow as-is (React cleanup, not a real error)
    7. Network error → throw ApiError
```

The 5-minute cache exists because the API runs on a free-tier render.com host with cold-start latency of 2–5 seconds. Navigating back to the list page after viewing a detail does not trigger another cold-start wait.

### `src/services/product.service.ts`

Enforces the business rule from the spec:

```
fetchProducts({ search, limit, offset })
    if search is non-empty → call with search param, NO limit
    if search is empty     → call with limit=20 (spec: "show first 20")
```

This keeps the business rule in one place and out of both the API client and the hook.

---

## State management

### CartContext internals

```typescript
type CartState = {
  items: CartItem[];
};

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: { index: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] };

// Pure reducer — no side effects, fully testable
function cartReducer(state: CartState, action: CartAction): CartState
```

`CartProvider` does two things at mount:
1. Reads `localStorage.getItem('zara-cart')` and dispatches `LOAD_CART`
2. Returns a memoised context value so child components only re-render when `items` actually changes

`useCart()` is the public hook. Components never import `CartContext` directly.

### Derived values

`totalItems` and `totalPrice` are computed inside the context value memo — they are not stored in state, which eliminates the risk of them going stale.

---

## Build pipeline

```
pnpm dev                     pnpm build
───────────────              ───────────────────────────────────
Vite dev server              tsc -b (type-check all projects)
  native ESM                     ↓
  no bundling                 Vite build
  HMR active                   Rollup: tree-shake, split chunks
  SCSS compiled on demand        vendor.js   (react, react-dom)
  source maps via devSourcemap   router.js   (react-router-dom)
                                 index.js    (app code)
                                 ↓
                               esbuild minifier
                                 JS: identifier mangling, dead code
                                 CSS: whitespace, shorthand merging
                               ↓
                             dist/
                               index.html
                               assets/vendor-[hash].js
                               assets/router-[hash].js
                               assets/index-[hash].js
                               assets/index-[hash].css
                               assets/[image]-[hash].webp
```

Source maps are emitted as separate `.map` files so browser DevTools can show original source without exposing it to end users who do not open DevTools.

---

## Layer enforcement

The four-layer model is enforced by convention and verified during code review. The rule is:

```
Presentation   →   Application   →   Infrastructure   →   Domain
(pages/        →   (hooks/       →   (api/, services/  →   (types/)
 components/)       context/)        utils/, env.ts)
```

**Allowed imports per layer:**

| Layer | May import from |
|-------|----------------|
| Domain (`types/`) | Nothing |
| Infrastructure (`api/`, `services/`, `utils/`) | Domain only |
| Application (`hooks/`, `context/`) | Infrastructure + Domain |
| Presentation (`components/`, `pages/`) | Application + Domain |

**Key rule**: Presentation modules never import from `src/api/` directly. They call hooks (Application), which call service functions (Infrastructure), which call the API boundary.

**Example of a fixed violation**:
`useColorFilter` previously imported `getProducts` and `getProductById` from `@/api/products.api` (skipping the service layer). Fixed by adding `fetchAllProducts` and `fetchProductDetail` to `src/services/product.service.ts` and updating the hook to import from `@/services/product.service`.

```
Before (violation):
useColorFilter → @/api/products.api    ← Application importing Infrastructure API directly

After (correct):
useColorFilter → @/services/product.service → @/api/products.api
```

**Acceptable cross-cutting exceptions**:
- `Layout.tsx` imports `createLogger` from `@/utils/logger`. Logging is a cross-cutting concern; injecting it via props or context adds ceremony without benefit.
- All components import from `@/types/` (Domain) regardless of layer — types are zero-cost abstractions.

---

## SOLID in practice

### Single Responsibility

Each module changes for exactly one reason:

```
src/api/client.ts           → HTTP transport changes (auth, caching, errors)
src/api/products.api.ts     → Product endpoint URL/shape changes
src/services/product.service.ts → Business rules change (search, limit, all-products)
src/hooks/useProducts.ts    → Product list UI state changes (loading, error)
src/hooks/useColorFilter.ts → Color filter UI interaction changes
src/context/CartContext.tsx → Cart state machine changes
src/utils/localStorage.ts   → Cart storage format changes
src/utils/logger.ts         → Logging infrastructure changes
```

### Open / Closed

Adding new behaviour without modifying existing code:

- New API endpoint → add a function to `products.api.ts`, zero changes to `client.ts`
- New error type → add to `ErrorCode` enum in `error.types.ts`, `ErrorFactory` switch picks it up
- New cart action → add union member to `CartAction`, add a case to `cartReducer`
- New locale → add a JSON file and a line in `i18n/index.ts`, no component changes

### Interface Segregation

Every consumer receives only the surface it needs:

```typescript
// PhoneCard only cares about display data
type PhoneCardProps = { product: ProductSummary }

// ColorSelector only cares about its own interaction
type ColorSelectorProps = {
  colors: ColorOption[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

// useCart() surface — components never see the raw reducer
type CartContextType = {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (item: CartItem) => void;
  removeItem: (index: number) => void;
}
```

### Dependency Inversion

High-level code depends on the service interface, not the fetch implementation:

```
PhoneListPage
  → useProducts (hook abstraction)
      → fetchProducts (service abstraction)
          → getProducts (API boundary)
              → apiClient (fetch abstraction)
                  → fetch (platform primitive)
```

Each layer depends only on the abstraction one step below. Replacing `fetch` with `XMLHttpRequest` requires changing only `apiClient`. Replacing the REST API with GraphQL requires changing only `products.api.ts` and `product.service.ts`.

---

## Testing architecture

```
         ┌──────────────────────────────────────────┐
         │  E2E (Playwright)          e2e/specs/     │
         │  Real Chromium browser                    │
         │  Production bundle (vite preview)         │
         │  API intercepted via page.route()         │
         │  phone-list · detail · cart · a11y        │
         └──────────────────────────────────────────┘
               ↑ validates full user flows + browser rendering

         ┌──────────────────────────────────────────┐
         │  Integration (Vitest + RTL)               │
         │  Real React providers, mocked fetch       │
         │  App routing, Layout, CartContext, Pages  │
         └──────────────────────────────────────────┘
               ↑ validates component wiring + state management

         ┌──────────────────────────────────────────┐
         │  Unit (Vitest + RTL)                      │
         │  All dependencies mocked                  │
         │  Components, hooks, utils, api layer      │
         └──────────────────────────────────────────┘
               ↑ validates isolated behaviour
```

### E2E architecture: Page Object Model

Each of the three application views has a corresponding POM class in `e2e/pages/`. POM classes own all selectors and expose only high-level actions; spec files contain only assertions.

```
e2e/
├── fixtures/
│   ├── api-mock.ts      — intercepts /products**, returns fixture JSON
│   └── test.ts          — extended Playwright base test; auto-applies mocks
└── pages/
    ├── PhoneListPage.ts — goto · search · clearSearch · clickCard · getCartItemCount
    ├── PhoneDetailPage.ts — goto(id) · selectColor · selectStorage · addToCart · getImageSrc
    └── CartPage.ts      — goto · removeItem · getItemCount · getItemNames
```

**POM selector priority** (most to least resilient):
1. ARIA role + label (`getByRole('button', { name: 'Añadir al carrito' })`)
2. ARIA label alone (`getByLabel('Search products')`)
3. Text content (`getByText('Continuar comprando')`)
4. CSS class (`.phone-card`, `.navbar__cart-count`) — only when no semantic alternative exists

**Why mocked API in E2E?**
The free-tier API backend has 2–5 s cold-start latency and no uptime guarantee. `api-mock.ts` intercepts all requests matching `/products` and returns the same three-product fixture used by Vitest integration tests. Tests run in ~2 s total and are fully deterministic offline.

**Why the production bundle?**
CI builds `dist/` then runs `vite preview`. E2E tests exercise the real minified output — dead-code elimination, chunk splitting, and tree-shaking are all exercised. A bug introduced only by the Rollup build cannot slip through.

### Accessibility E2E coverage

`accessibility.spec.ts` (39 tests) layers three verification strategies:

1. **Automated axe scan** — `checkA11y(page, undefined, { runOnly: ['wcag21aa'] })` runs on every route with both empty and populated states
2. **Manual ARIA assertions** — verifies specific attributes axe cannot catch by looking at the rendered DOM (e.g. `aria-checked` state on custom radio buttons, `aria-live` on search results)
3. **Color vision simulation** — injects CSS SVG color-matrix filters (Machado 2009) for deuteranopia, protanopia, and tritanopia; then performs the full color-swatch interaction to confirm selection state is communicated programmatically

### Key unit/integration mocking conventions

```typescript
// API key environment
vi.mock('@/env', () => ({ env: () => ({ apiKey: 'test', baseUrl: 'https://test.api' }) }))

// Logger — prevents output noise in test runs
vi.mock('@/utils/logger', () => ({
  createLogger: () => ({
    startSpan: () => ({ finish: vi.fn(), fail: vi.fn() }),
    error: vi.fn(), info: vi.fn(), debug: vi.fn(), warn: vi.fn(),
  }),
}))

// React Router navigation
vi.mock('react-router-dom', async (importOriginal) => ({
  ...await importOriginal(),
  useNavigate: () => mockNavigate,
}))

// img with alt="" has role="presentation" in the a11y tree — query by selector
document.querySelector<HTMLImageElement>('img[alt=""]')
```
