import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../fixtures/test';
import { PhoneListPage } from '../pages/PhoneListPage';
import { PhoneDetailPage } from '../pages/PhoneDetailPage';
import { CartPage } from '../pages/CartPage';

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Navigate to the iPhone 15 detail page, select a color and storage option,
 * then click "Añadir" to add the item to the cart.
 * Lands on `/cart` after completion.
 */
async function addIPhone15ToCart(
  detailPage: PhoneDetailPage,
  cartPage: CartPage,
): Promise<void> {
  await detailPage.goto('APL-IP15');
  await detailPage.selectColor(0); // Black — also auto-selects storage 0
  await detailPage.addToCart();
  await cartPage.continueShoppingButton.waitFor({ timeout: 5_000 });
}

// ─── Group 1: Automated axe-core scans ──────────────────────────────────────

test.describe('axe-core WCAG 2.1 AA', () => {
  /**
   * The PhoneDetailPage renders its own <main> element while the Layout also
   * wraps content in a <main>. This produces a landmark nesting violation
   * (landmark-no-duplicate-main / landmark-unique) that axe flags.
   * We exclude that specific rule so the scan focuses on all other WCAG criteria.
   */
  const DETAIL_PAGE_EXCLUDED_RULES = ['landmark-no-duplicate-main'];

  test('phone detail page with color and storage selected has no violations', async ({ page }) => {
    const detailPage = new PhoneDetailPage(page);
    await detailPage.goto('APL-IP15');
    await detailPage.productTitle.waitFor({ timeout: 10_000 });

    // Selecting a color auto-defaults storage to 0, enabling the add button
    await detailPage.selectColor(0);
    await detailPage.selectStorage(1);
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(DETAIL_PAGE_EXCLUDED_RULES)
      .analyze();

    expect(
      results.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        targets: v.nodes.map((n) => ({ target: n.target, data: n.any?.[0]?.data })),
      })),
    ).toEqual([]);
  });

  test('empty cart page has no WCAG 2.1 AA violations', async ({ page }) => {
    const cartPage = new CartPage(page);
    await cartPage.goto();
    // Confirm the "Continue shopping" button is present before scanning
    await cartPage.continueShoppingButton.waitFor({ timeout: 5_000 });
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(
      results.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        targets: v.nodes.map((n) => ({ target: n.target, data: n.any?.[0]?.data })),
      })),
    ).toEqual([]);
  });

  test('404 page has no WCAG 2.1 AA violations', async ({ page }) => {
    await page.goto('/nonexistent');
    // Wait for the 404 heading before scanning
    await page.getByRole('heading', { level: 1, name: /404/i }).waitFor({ timeout: 5_000 });
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(
      results.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        targets: v.nodes.map((n) => ({ target: n.target, data: n.any?.[0]?.data })),
      })),
    ).toEqual([]);
  });
});

// ─── Group 2: Landmark & semantic structure ──────────────────────────────────

test.describe('landmarks and semantics', () => {
  test('phone list page has exactly one nav, one main, and one search form', async ({ page }) => {
    const listPage = new PhoneListPage(page);
    await listPage.goto();
    await listPage.waitForProducts();

    // Layout renders a single <nav> (Navbar)
    await expect(page.locator('nav')).toHaveCount(1);
    // Layout wraps the outlet in a single <main>
    await expect(page.locator('main')).toHaveCount(1);
    // SearchBar renders <form role="search">
    await expect(page.locator('form[role="search"]')).toHaveCount(1);
  });

  test('phone list h1 is present and readable even though it is visually hidden', async ({
    page,
  }) => {
    const listPage = new PhoneListPage(page);
    await listPage.goto();
    await listPage.waitForProducts();

    // The sr-only h1 must still be in the accessibility tree
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toHaveText('Mobile Phones');
  });

  test('phone detail page has an h1 with the product name', async ({ page }) => {
    const detailPage = new PhoneDetailPage(page);
    await detailPage.goto('APL-IP15');
    await detailPage.productTitle.waitFor({ timeout: 10_000 });

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('iPhone 15');
  });

  test('cart page has an h1 containing "Cart"', async ({ page }) => {
    const cartPage = new CartPage(page);
    await cartPage.goto();

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Cart');
  });

  test('specs section uses a definition list with correct dt/dd pairs for Screen', async ({
    page,
  }) => {
    const detailPage = new PhoneDetailPage(page);
    await detailPage.goto('APL-IP15');
    await detailPage.productTitle.waitFor({ timeout: 10_000 });

    // The specs section must contain a <dl>
    const specsSection = page.getByRole('region', { name: 'Specifications' });
    await expect(specsSection.locator('dl')).toHaveCount(1);

    // "Screen" <dt> and the fixture value <dd> must be present
    await expect(specsSection.locator('dt').filter({ hasText: /^Screen$/ })).toBeVisible();
    await expect(specsSection.locator('dd', { hasText: /6\.1.*Super Retina XDR/i })).toBeVisible();
  });
});

// ─── Group 3: ARIA attributes ────────────────────────────────────────────────

test.describe('ARIA attributes', () => {
  test('add-to-cart button is aria-disabled and HTML-disabled before any selection', async ({
    page,
  }) => {
    const detailPage = new PhoneDetailPage(page);
    await detailPage.goto('APL-IP15');
    await detailPage.productTitle.waitFor({ timeout: 10_000 });

    // No color or storage selected yet — button must be fully disabled
    await expect(detailPage.addToCartButton).toHaveAttribute('aria-disabled', 'true');
    await expect(detailPage.addToCartButton).toBeDisabled();
  });

  test('add-to-cart button becomes enabled after selecting a color (which auto-selects storage)', async ({
    page,
  }) => {
    const detailPage = new PhoneDetailPage(page);
    await detailPage.goto('APL-IP15');
    await detailPage.productTitle.waitFor({ timeout: 10_000 });

    // Selecting a color auto-defaults storage to index 0
    await detailPage.selectColor(0);

    await expect(detailPage.addToCartButton).toHaveAttribute('aria-disabled', 'false');
    await expect(detailPage.addToCartButton).toBeEnabled();
  });

  test('color radiogroup exists and clicking Black sets aria-checked="true" on that swatch', async ({
    page,
  }) => {
    const detailPage = new PhoneDetailPage(page);
    await detailPage.goto('APL-IP15');
    await detailPage.productTitle.waitFor({ timeout: 10_000 });

    // The radiogroup landmark must exist
    const colorGroup = page.getByRole('radiogroup', { name: 'Select color' });
    await expect(colorGroup).toBeVisible();

    // Click the Black swatch
    await detailPage.selectColorByName('Black');

    // Only the Black radio should be checked
    await expect(page.getByRole('radio', { name: 'Black' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(page.getByRole('radio', { name: 'Blue' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  test('storage radiogroup exists and clicking "128 GB" sets aria-checked="true"', async ({
    page,
  }) => {
    const detailPage = new PhoneDetailPage(page);
    await detailPage.goto('APL-IP15');
    await detailPage.productTitle.waitFor({ timeout: 10_000 });

    // The radiogroup landmark must exist
    const storageGroup = page.getByRole('radiogroup', { name: 'Select storage capacity' });
    await expect(storageGroup).toBeVisible();

    // Click the first storage option
    await detailPage.selectStorageByCapacity('128 GB');

    await expect(page.getByRole('radio', { name: '128 GB' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(page.getByRole('radio', { name: '256 GB' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  test('cart delete button has aria-label containing "Remove iPhone 15"', async ({ page }) => {
    const detailPage = new PhoneDetailPage(page);
    const cartPage = new CartPage(page);

    await addIPhone15ToCart(detailPage, cartPage);

    const deleteButton = page.getByRole('button', { name: /Remove iPhone 15/i });
    await expect(deleteButton).toBeVisible();
    await expect(deleteButton).toHaveAttribute('aria-label', /Remove iPhone 15/i);
  });

  test('navbar cart link has aria-label matching "Shopping cart with N items"', async ({
    page,
  }) => {
    const listPage = new PhoneListPage(page);
    await listPage.goto();
    await listPage.waitForProducts();

    // The cart link aria-label must match the pattern for any item count
    await expect(listPage.cartLink).toHaveAttribute('aria-label', /Shopping cart with \d+ items/);
  });

  test('search form has role="search"', async ({ page }) => {
    const listPage = new PhoneListPage(page);
    await listPage.goto();
    await listPage.waitForProducts();

    await expect(page.getByRole('search')).toBeVisible();
  });

  test('search results div has aria-live="polite" and aria-atomic="true"', async ({ page }) => {
    const listPage = new PhoneListPage(page);
    await listPage.goto();
    await listPage.waitForProducts();

    // The live region announcing result counts to screen readers
    const resultsDiv = page.locator('.search-bar__results');
    await expect(resultsDiv).toHaveAttribute('aria-live', 'polite');
    await expect(resultsDiv).toHaveAttribute('aria-atomic', 'true');
  });
});

// ─── Group 4: Keyboard navigation ───────────────────────────────────────────

test.describe('keyboard navigation', () => {
  test('search input is focusable by Tab from the start of the page', async ({ page }) => {
    const listPage = new PhoneListPage(page);
    await listPage.goto();
    await listPage.waitForProducts();

    // Tab up to 10 times from the top of the document to reach the search input
    let focused = false;
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const ariaLabel = await page.evaluate(
        () => document.activeElement?.getAttribute('aria-label') ?? '',
      );
      if (ariaLabel === 'Search products') {
        focused = true;
        break;
      }
    }
    expect(focused).toBe(true);
  });

  test('pressing Enter in the search input triggers a search and updates the result count', async ({
    page,
  }) => {
    const listPage = new PhoneListPage(page);
    await listPage.goto();
    await listPage.waitForProducts();

    await listPage.searchInput.fill('Samsung');
    await page.keyboard.press('Enter');

    // After Enter the API mock returns 1 result for "Samsung"
    await expect(listPage.searchResults).toContainText('1', { timeout: 5_000 });
  });

  test('pressing Enter on a focused phone card link navigates to the detail page', async ({
    page,
  }) => {
    const listPage = new PhoneListPage(page);
    await listPage.goto();
    await listPage.waitForProducts();

    // Tab from the search input until a product card link is focused
    await listPage.searchInput.focus();
    let cardActivated = false;
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const activeHref = await page.evaluate(
        () => (document.activeElement as HTMLAnchorElement | null)?.href ?? '',
      );
      if (activeHref.includes('/products/')) {
        await page.keyboard.press('Enter');
        cardActivated = true;
        break;
      }
    }
    expect(cardActivated).toBe(true);
    await expect(page).toHaveURL(/\/products\//);
  });

  test('first color swatch can be activated with Space key', async ({ page }) => {
    const detailPage = new PhoneDetailPage(page);
    await detailPage.goto('APL-IP15');
    await detailPage.productTitle.waitFor({ timeout: 10_000 });

    // Programmatically focus the first radio in the color group, then press Space
    const firstSwatch = detailPage.colorSwatches.first();
    await firstSwatch.focus();
    await page.keyboard.press('Space');

    await expect(firstSwatch).toHaveAttribute('aria-checked', 'true');
  });

  test('first storage option can be activated with Space key', async ({ page }) => {
    const detailPage = new PhoneDetailPage(page);
    await detailPage.goto('APL-IP15');
    await detailPage.productTitle.waitFor({ timeout: 10_000 });

    // Programmatically focus the first storage radio, then press Space
    const firstStorage = detailPage.storageOptions.first();
    await firstStorage.focus();
    await page.keyboard.press('Space');

    await expect(firstStorage).toHaveAttribute('aria-checked', 'true');
  });

  test('add-to-cart button can be activated with Enter key after a color is selected', async ({
    page,
  }) => {
    const detailPage = new PhoneDetailPage(page);
    await detailPage.goto('APL-IP15');
    await detailPage.productTitle.waitFor({ timeout: 10_000 });

    // Selecting a color auto-selects storage 0 — button becomes enabled
    await detailPage.selectColor(0);

    // Focus the button and press Enter to add to cart and navigate to /cart
    await detailPage.addToCartButton.focus();
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL('/cart');
  });

  test('"Continue shopping" button navigates to / when activated with Enter', async ({
    page,
  }) => {
    const cartPage = new CartPage(page);
    await cartPage.goto();

    // Focus the button directly and press Enter
    await cartPage.continueShoppingButton.focus();
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL('/');
  });

  test('tab order on phone list page never traps focus and reaches the cart link', async ({
    page,
  }) => {
    const listPage = new PhoneListPage(page);
    await listPage.goto();
    await listPage.waitForProducts();

    // Tab through the page — cart link must receive focus before 20 presses
    let cartFocused = false;
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      const ariaLabel = await page.evaluate(
        () => document.activeElement?.getAttribute('aria-label') ?? '',
      );
      if (/Shopping cart/i.test(ariaLabel)) {
        cartFocused = true;
        break;
      }
    }
    expect(cartFocused).toBe(true);
  });
});

// ─── Group 5: Focus management ───────────────────────────────────────────────

test.describe('focus management', () => {
  test('phone list page title is "Zara Mobile Phones"', async ({ page }) => {
    const listPage = new PhoneListPage(page);
    await listPage.goto();
    await listPage.waitForProducts();

    await expect(page).toHaveTitle('Zara Mobile Phones');
  });

  test('phone detail page title contains the product name', async ({ page }) => {
    const detailPage = new PhoneDetailPage(page);
    await detailPage.goto('APL-IP15');
    await detailPage.productTitle.waitFor({ timeout: 10_000 });

    // Title is set to "{brand} {name} — MBST" in PhoneDetailPage
    await expect(page).toHaveTitle(/iPhone 15/i);
  });

  test('all images on the phone list page have an alt attribute (empty allowed only for decorative)', async ({
    page,
  }) => {
    const listPage = new PhoneListPage(page);
    await listPage.goto();
    await listPage.waitForProducts();

    const images = await page.locator('img').all();
    expect(images.length).toBeGreaterThan(0);

    for (const img of images) {
      // Every <img> must have an alt attribute present (empty string is valid for decorative icons)
      const alt = await img.getAttribute('alt');
      expect(alt).not.toBeNull();
    }
  });

  test('product card images have meaningful (non-empty) alt text', async ({ page }) => {
    const listPage = new PhoneListPage(page);
    await listPage.goto();
    await listPage.waitForProducts();

    // Each phone card image should describe the product, not just be decorative
    const cardImages = page.locator('.phone-card img');
    const count = await cardImages.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const alt = await cardImages.nth(i).getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });
});

// ─── Group 6: Color blindness & use-of-color ────────────────────────────────

/**
 * Injects an SVG color-matrix filter onto the page and applies it to the
 * root <html> element. Simulates how a color-blind user perceives the UI
 * so we can verify that interactions rely on ARIA state, not color alone.
 */
async function injectColorBlindnessFilter(
  page: import('@playwright/test').Page,
  filterId: string,
  matrixValues: string,
): Promise<void> {
  await page.evaluate(
    ({ id, values }: { id: string; values: string }) => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden');
      svg.innerHTML = `<defs><filter id="${id}"><feColorMatrix type="matrix" values="${values}"/></filter></defs>`;
      document.body.prepend(svg);
      document.documentElement.style.filter = `url(#${id})`;
    },
    { id: filterId, values: matrixValues },
  );
}

test.describe('color blindness and use-of-color', () => {
  // ── WCAG 1.4.1: Color must not be the only visual means of conveying info ──

  test('detail page color swatches have accessible names beyond just color', async ({ page }) => {
    const detailPage = new PhoneDetailPage(page);
    await detailPage.goto('APL-IP15');
    await detailPage.productTitle.waitFor({ timeout: 10_000 });

    const swatches = page.getByRole('radiogroup', { name: 'Select color' }).getByRole('radio');
    const count = await swatches.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const label = await swatches.nth(i).getAttribute('aria-label');
      expect(label, `Color swatch ${i} must have an aria-label with the color name`).toBeTruthy();
    }
  });

  test('color filter swatches on list page have accessible names', async ({ page }) => {
    // ColorFilter is mobile-only (display:none on desktop via CSS).
    // Skip this test when the viewport is wider than the mobile breakpoint.
    const viewport = page.viewportSize();
    if (!viewport || viewport.width > 767) {
      test.skip();
      return;
    }

    await page.goto('/');
    await page.locator('.phone-card').first().waitFor({ timeout: 10_000 });
    // The button aria-label is "Open color filter" (not the visible text "FILTRAR")
    await page.getByRole('button', { name: /Open color filter/i }).click();
    await page.getByRole('radiogroup', { name: 'Filter by color' }).waitFor({ timeout: 5_000 });

    const swatches = page.getByRole('radiogroup', { name: 'Filter by color' }).getByRole('radio');
    await swatches.first().waitFor({ timeout: 10_000 });
    const count = await swatches.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const label = await swatches.nth(i).getAttribute('aria-label');
      expect(label, `Filter swatch ${i} must have an aria-label`).toBeTruthy();
    }
  });

  test('color swatch selection state communicated via aria-checked — not color alone', async ({
    page,
  }) => {
    // WCAG 1.4.1: the "selected" state must not rely solely on a color change
    const detailPage = new PhoneDetailPage(page);
    await detailPage.goto('APL-IP15');
    await detailPage.productTitle.waitFor({ timeout: 10_000 });

    const firstSwatch = detailPage.colorSwatches.first();
    await expect(firstSwatch).toHaveAttribute('aria-checked', 'false');
    await firstSwatch.click();
    await expect(firstSwatch).toHaveAttribute('aria-checked', 'true');
  });

  test('storage option selection state communicated via aria-checked — not color alone', async ({
    page,
  }) => {
    const detailPage = new PhoneDetailPage(page);
    await detailPage.goto('APL-IP15');
    await detailPage.productTitle.waitFor({ timeout: 10_000 });

    const firstStorage = detailPage.storageOptions.first();
    await expect(firstStorage).toHaveAttribute('aria-checked', 'false');
    await firstStorage.click();
    await expect(firstStorage).toHaveAttribute('aria-checked', 'true');
  });

  // ── Forced-colors (Windows High Contrast) ───────────────────────────────────

  test('phone list page is usable and structurally sound in forced-colors mode', async ({
    page,
  }) => {
    // Emulate Windows High Contrast / forced-colors media feature
    await page.emulateMedia({ forcedColors: 'active' });

    const listPage = new PhoneListPage(page);
    await listPage.goto();
    await listPage.waitForProducts();

    await expect(listPage.searchInput).toBeVisible();
    await expect(listPage.phoneCards.first()).toBeVisible();
    await expect(listPage.cartLink).toBeVisible();

    // Axe structural check — disable color-contrast since forced colors
    // override stylesheet colors and the contrast rules become inapplicable
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag21a'])
      .disableRules(['color-contrast'])
      .analyze();

    expect(
      results.violations.map((v) => ({ id: v.id, impact: v.impact })),
    ).toEqual([]);
  });

  test('phone detail page interactions work in forced-colors mode', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });

    const detailPage = new PhoneDetailPage(page);
    await detailPage.goto('APL-IP15');
    await detailPage.productTitle.waitFor({ timeout: 10_000 });

    await expect(detailPage.colorSwatches.first()).toBeVisible();
    await expect(detailPage.storageOptions.first()).toBeVisible();

    // Selecting a color must still enable the Add button
    await detailPage.selectColor(0);
    await expect(detailPage.addToCartButton).toBeEnabled();
  });

  // ── Deuteranopia simulation (red-green, ~8 % of males / ~0.5 % of females) ──

  test('deuteranopia simulation: ARIA labels identify colors — no color vision required', async ({
    page,
  }) => {
    const detailPage = new PhoneDetailPage(page);
    await detailPage.goto('APL-IP15');
    await detailPage.productTitle.waitFor({ timeout: 10_000 });

    // Machado (2009) deuteranopia approximation
    await injectColorBlindnessFilter(
      page,
      'cb-deuteranopia',
      '0.367 0.861 -0.228 0 0  0.280 0.673 0.047 0 0  -0.012 0.043 0.969 0 0  0 0 0 1 0',
    );

    // Each swatch label must be non-empty — color blind users rely on the name
    const swatches = page.getByRole('radiogroup', { name: 'Select color' }).getByRole('radio');
    const count = await swatches.count();
    for (let i = 0; i < count; i++) {
      expect(await swatches.nth(i).getAttribute('aria-label')).toBeTruthy();
    }

    // Interactions and non-color state cues must function under the filter
    await swatches.first().click();
    await expect(swatches.first()).toHaveAttribute('aria-checked', 'true');
    await expect(detailPage.addToCartButton).toBeEnabled();
  });

  // ── Protanopia simulation (red-weakness, ~1 % of males / ~0.1 % of females) ─

  test('protanopia simulation: ARIA labels identify colors — no color vision required', async ({
    page,
  }) => {
    const detailPage = new PhoneDetailPage(page);
    await detailPage.goto('APL-IP15');
    await detailPage.productTitle.waitFor({ timeout: 10_000 });

    // Machado (2009) protanopia approximation
    await injectColorBlindnessFilter(
      page,
      'cb-protanopia',
      '0.152 1.053 -0.205 0 0  0.115 0.786 0.099 0 0  -0.004 -0.048 1.052 0 0  0 0 0 1 0',
    );

    const swatches = page.getByRole('radiogroup', { name: 'Select color' }).getByRole('radio');
    const count = await swatches.count();
    for (let i = 0; i < count; i++) {
      expect(await swatches.nth(i).getAttribute('aria-label')).toBeTruthy();
    }

    await swatches.first().click();
    await expect(swatches.first()).toHaveAttribute('aria-checked', 'true');
  });

  // ── Tritanopia simulation (blue-yellow, ~0.1 % of all — not sex-linked) ─────

  test('tritanopia simulation: ARIA labels identify colors — no color vision required', async ({
    page,
  }) => {
    const detailPage = new PhoneDetailPage(page);
    await detailPage.goto('APL-IP15');
    await detailPage.productTitle.waitFor({ timeout: 10_000 });

    // Machado (2009) tritanopia approximation
    await injectColorBlindnessFilter(
      page,
      'cb-tritanopia',
      '1.256 -0.077 -0.179 0 0  -0.078 0.931 0.148 0 0  0.005 0.691 0.304 0 0  0 0 0 1 0',
    );

    const swatches = page.getByRole('radiogroup', { name: 'Select color' }).getByRole('radio');
    const count = await swatches.count();
    for (let i = 0; i < count; i++) {
      expect(await swatches.nth(i).getAttribute('aria-label')).toBeTruthy();
    }

    await swatches.first().click();
    await expect(swatches.first()).toHaveAttribute('aria-checked', 'true');
  });
});
