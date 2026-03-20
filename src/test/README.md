# Testing Strategy

This project uses a differentiated testing approach with clear separation between test types.

## Test Types

### 🔹 Unit Tests (`.unit.test.tsx`)

**Purpose:** Test individual components or functions in isolation.

**Characteristics:**

- Mock all external dependencies
- Fast execution
- High coverage of edge cases
- No real API calls or context providers

**Example:**

```typescript
// Navbar.unit.test.tsx
vi.mock('@/hooks/useCart');

it('should render cart count badge', () => {
  vi.spyOn(useCartHook, 'useCart').mockReturnValue({
    totalItems: 3,
    // ... other mocked values
  });

  render(<Navbar />);
  expect(screen.getByText('3')).toBeInTheDocument();
});
```

**Run:**

```bash
pnpm test:unit          # Run all unit tests
pnpm test:watch:unit    # Watch mode
```

---

### 🔸 Integration Tests (`.intg.test.tsx`)

**Purpose:** Test components with their real dependencies (context, hooks, etc.).

**Characteristics:**

- Use real context providers
- Mock only external services (APIs, localStorage)
- Test component interactions
- Verify data flow between components

**Example:**

```typescript
// Layout.intg.test.tsx
it('should integrate navbar with cart provider', () => {
  render(
    <CartProvider>
      <Layout />
    </CartProvider>
  );

  // Tests real cart context integration
  expect(screen.getByLabelText('Shopping cart with 0 items')).toBeInTheDocument();
});
```

**Run:**

```bash
pnpm test:intg          # Run all integration tests
pnpm test:watch:intg    # Watch mode
```

---

### 🔶 End-to-End Tests (`.e2e.test.tsx`)

**Purpose:** Test complete user flows in a real browser environment.

**Characteristics:**

- Use Playwright or similar
- Real browser automation
- Test full user journeys
- No mocking (except external APIs if needed)

**Example:**

```typescript
// checkout.e2e.test.tsx
test('user can complete checkout flow', async ({ page }) => {
  await page.goto('/');
  await page.click('text=iPhone 15');
  await page.click('button:has-text("Add to Cart")');
  await page.click('[aria-label="Shopping cart"]');
  // ... complete flow
});
```

**Run:**

```bash
pnpm test:e2e           # Run e2e tests (to be configured)
```

---

## File Organization

```
src/
├── components/
│   ├── Navbar/
│   │   ├── Navbar.tsx
│   │   ├── Navbar.scss
│   │   ├── Navbar.unit.test.tsx      # Unit tests
│   │   └── Navbar.intg.test.tsx      # Integration tests (if needed)
│   └── Layout/
│       ├── Layout.tsx
│       ├── Layout.scss
│       └── Layout.intg.test.tsx      # Integration tests
├── context/
│   ├── CartContext.tsx
│   └── __tests__/
│       └── CartContext.intg.test.tsx # Integration tests
├── utils/
│   ├── localStorage.ts
│   └── localStorage.unit.test.ts     # Unit tests
└── test/
    ├── setup.ts                       # Global test setup
    ├── fixtures/                      # Test data
    └── README.md                      # This file
```

---

## Running Tests

### All Tests

```bash
pnpm test              # Run all unit + integration tests
pnpm test:all          # Explicit all tests
pnpm test:watch        # Watch mode for all tests
```

### By Type

```bash
pnpm test:unit         # Only unit tests
pnpm test:intg         # Only integration tests
pnpm test:watch:unit   # Watch unit tests
pnpm test:watch:intg   # Watch integration tests
```

### Coverage

```bash
pnpm test:coverage     # Generate coverage report
```

### UI Mode

```bash
pnpm test:ui           # Open Vitest UI
```

---

## Best Practices

### ✅ DO

- **Unit tests:** Mock all external dependencies
- **Integration tests:** Use real providers, mock only I/O
- **Use descriptive test names:** `should display cart count when items exist`
- **Follow AAA pattern:** Arrange, Act, Assert
- **Test user behavior:** Not implementation details
- **Use semantic queries:** `getByRole`, `getByLabelText` over `getByTestId`

### ❌ DON'T

- **Don't test implementation details:** Test what users see/do
- **Don't duplicate tests:** If unit test covers it, skip in integration
- **Don't mock everything in integration tests:** Defeats the purpose
- **Don't write brittle tests:** Avoid relying on specific DOM structure

---

## Coverage Goals

- **Unit Tests:** 80%+ coverage of utilities and pure functions
- **Integration Tests:** Cover critical user flows and component interactions
- **E2E Tests:** Cover main user journeys (happy paths + critical errors)

---

## CI/CD Integration

Tests run automatically in GitHub Actions:

```yaml
- name: Run unit tests
  run: pnpm test:unit

- name: Run integration tests
  run: pnpm test:intg

- name: Generate coverage
  run: pnpm test:coverage
```

---

## Tools

- **Vitest:** Test runner (fast, Vite-native)
- **Testing Library:** Component testing utilities
- **jsdom:** Browser environment simulation
- **Playwright:** E2E testing (to be configured)

---

## Examples

See existing tests for reference:

- Unit: `src/utils/localStorage.unit.test.ts`
- Unit: `src/components/Navbar/Navbar.unit.test.tsx`
- Integration: `src/components/Layout/Layout.intg.test.tsx`
- Integration: `src/context/__tests__/CartContext.intg.test.tsx`
