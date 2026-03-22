import { test, expect } from '../fixtures/test';
import { PhoneListPage } from '../pages/PhoneListPage';

/**
 * E2E tests for the Phone List (home) page.
 *
 * All API calls are intercepted via the custom test fixture, so no real
 * network traffic is needed. The mocked catalog contains three products:
 *   - Samsung Galaxy S24  (id: SMG-S24,  basePrice: 799)
 *   - Apple iPhone 15     (id: APL-IP15, basePrice: 899)
 *   - Google Pixel 8      (id: GGL-P8,   basePrice: 699)
 */

test.describe('Phone List Page', () => {
  let phonePage: PhoneListPage;

  test.beforeEach(async ({ page }) => {
    phonePage = new PhoneListPage(page);
    await phonePage.goto();
    await phonePage.waitForProducts();
  });

  // ─── Initial load ──────────────────────────────────────────────────────────

  test.describe('initial load', () => {
    test('displays all 3 products from the mock catalog', async () => {
      await expect(phonePage.phoneCards).toHaveCount(3);
    });

    test('results count shows "3 results" on initial load', async () => {
      await expect(phonePage.searchResults).toContainText('3 results');
    });

    test('loading spinner is not visible after products have loaded', async () => {
      await expect(phonePage.progressBar).not.toBeVisible();
    });

    test('page title is set to the app title', async ({ page }) => {
      await expect(page).toHaveTitle(/Zara Mobile Phones/i);
    });

    test('search form has role="search" for accessibility', async ({ page }) => {
      const searchForm = page.getByRole('search');
      await expect(searchForm).toBeVisible();
    });
  });

  // ─── Search — by brand ─────────────────────────────────────────────────────

  test.describe('search by brand', () => {
    test('typing "Samsung" + Enter shows only 1 card', async ({ page }) => {
      await phonePage.searchInput.fill('Samsung');
      await page.keyboard.press('Enter');
      await expect(phonePage.phoneCards).toHaveCount(1, { timeout: 5_000 });
    });

    test('results text includes count and the search term after searching "Samsung"', async ({
      page,
    }) => {
      await phonePage.searchInput.fill('Samsung');
      await page.keyboard.press('Enter');
      await expect(phonePage.phoneCards).toHaveCount(1, { timeout: 5_000 });

      await expect(phonePage.searchResults).toContainText('1 result');
      await expect(phonePage.searchResults).toContainText('Samsung');
    });

    test('the single result shown is the Galaxy S24', async ({ page }) => {
      await phonePage.searchInput.fill('Samsung');
      await page.keyboard.press('Enter');
      await expect(phonePage.phoneCards).toHaveCount(1, { timeout: 5_000 });

      const card = phonePage.phoneCards.first();
      await expect(card.locator('.phone-card__brand')).toHaveText('Samsung');
      await expect(card.locator('.phone-card__name')).toHaveText('Galaxy S24');
    });
  });

  // ─── Search — by name ──────────────────────────────────────────────────────

  test.describe('search by name', () => {
    test('typing "iPhone" + Enter shows only 1 card', async ({ page }) => {
      await phonePage.searchInput.fill('iPhone');
      await page.keyboard.press('Enter');
      await expect(phonePage.phoneCards).toHaveCount(1, { timeout: 5_000 });
    });

    test('results text includes count and the search term after searching "iPhone"', async ({
      page,
    }) => {
      await phonePage.searchInput.fill('iPhone');
      await page.keyboard.press('Enter');
      await expect(phonePage.phoneCards).toHaveCount(1, { timeout: 5_000 });

      await expect(phonePage.searchResults).toContainText('1 result');
      await expect(phonePage.searchResults).toContainText('iPhone');
    });

    test('the single result shown is the iPhone 15', async ({ page }) => {
      await phonePage.searchInput.fill('iPhone');
      await page.keyboard.press('Enter');
      await expect(phonePage.phoneCards).toHaveCount(1, { timeout: 5_000 });

      const card = phonePage.phoneCards.first();
      await expect(card.locator('.phone-card__brand')).toHaveText('Apple');
      await expect(card.locator('.phone-card__name')).toHaveText('iPhone 15');
    });
  });

  // ─── Search — no results ───────────────────────────────────────────────────

  test.describe('search with no results', () => {
    test('typing "xyz-not-found" + Enter shows 0 cards', async ({ page }) => {
      await phonePage.searchInput.fill('xyz-not-found');
      await page.keyboard.press('Enter');
      await expect(phonePage.phoneCards).toHaveCount(0, { timeout: 5_000 });
    });

    test('empty-state element with role="status" is visible and contains "No products found"', async ({
      page,
    }) => {
      await phonePage.searchInput.fill('xyz-not-found');
      await page.keyboard.press('Enter');
      await expect(phonePage.phoneCards).toHaveCount(0, { timeout: 5_000 });

      await expect(phonePage.emptyStatus).toBeVisible();
      await expect(phonePage.emptyStatus).toContainText('No products found');
    });

    test('results count shows "0 results" after a no-match search', async ({ page }) => {
      await phonePage.searchInput.fill('xyz-not-found');
      await page.keyboard.press('Enter');
      await expect(phonePage.phoneCards).toHaveCount(0, { timeout: 5_000 });

      await expect(phonePage.searchResults).toContainText('0 results');
    });
  });

  // ─── Clear search ──────────────────────────────────────────────────────────

  test.describe('clear search', () => {
    test('clearing after "Samsung" restores all 3 products', async ({ page }) => {
      await phonePage.searchInput.fill('Samsung');
      await page.keyboard.press('Enter');
      await expect(phonePage.phoneCards).toHaveCount(1, { timeout: 5_000 });

      await phonePage.clearSearch();
      await expect(phonePage.phoneCards).toHaveCount(3, { timeout: 5_000 });
    });

    test('results count returns to "3 results" after clearing', async ({ page }) => {
      await phonePage.searchInput.fill('Samsung');
      await page.keyboard.press('Enter');
      await expect(phonePage.phoneCards).toHaveCount(1, { timeout: 5_000 });

      await phonePage.clearSearch();
      await expect(phonePage.phoneCards).toHaveCount(3, { timeout: 5_000 });
      await expect(phonePage.searchResults).toContainText('3 results');
    });

    test('results text no longer contains the search term after clearing', async ({ page }) => {
      await phonePage.searchInput.fill('Samsung');
      await page.keyboard.press('Enter');
      await expect(phonePage.phoneCards).toHaveCount(1, { timeout: 5_000 });

      await phonePage.clearSearch();
      await expect(phonePage.phoneCards).toHaveCount(3, { timeout: 5_000 });
      await expect(phonePage.searchResults).not.toContainText('Samsung');
    });
  });

  // ─── Card navigation ───────────────────────────────────────────────────────

  test.describe('card navigation', () => {
    test('clicking the first card navigates to the products detail URL', async ({ page }) => {
      await phonePage.clickCard(0);
      await expect(page).toHaveURL(/\/products\//);
    });

    test('clicking the Galaxy S24 card navigates to /products/SMG-S24', async ({ page }) => {
      // The fixture returns products in insertion order: SMG-S24, APL-IP15, GGL-P8.
      // Find the Galaxy S24 card explicitly by name to be order-independent.
      const galaxyCard = phonePage.phoneCards.filter({
        has: page.locator('.phone-card__name', { hasText: 'Galaxy S24' }),
      });
      await galaxyCard.click();
      await expect(page).toHaveURL('/products/SMG-S24');
    });

    test('clicking the iPhone 15 card navigates to /products/APL-IP15', async ({ page }) => {
      const iPhoneCard = phonePage.phoneCards.filter({
        has: page.locator('.phone-card__name', { hasText: 'iPhone 15' }),
      });
      await iPhoneCard.click();
      await expect(page).toHaveURL('/products/APL-IP15');
    });
  });

  // ─── Cart count ────────────────────────────────────────────────────────────

  test.describe('cart count in navbar', () => {
    test('cart count shows 0 on initial load with an empty cart', async () => {
      const count = await phonePage.getCartItemCount();
      expect(count).toBe(0);
    });

    test('cart link is visible and accessible', async () => {
      await expect(phonePage.cartLink).toBeVisible();
    });

    test('cart link aria-label contains "Shopping cart"', async () => {
      await expect(phonePage.cartLink).toHaveAttribute('aria-label', /Shopping cart/i);
    });
  });

  // ─── Card content ──────────────────────────────────────────────────────────

  test.describe('card content', () => {
    test('each card displays a brand, name, and price', async () => {
      const count = await phonePage.phoneCards.count();
      expect(count).toBeGreaterThan(0);

      for (let i = 0; i < count; i++) {
        const card = phonePage.phoneCards.nth(i);
        await expect(card.locator('.phone-card__brand')).not.toBeEmpty();
        await expect(card.locator('.phone-card__name')).not.toBeEmpty();
        await expect(card.locator('.phone-card__price')).not.toBeEmpty();
      }
    });

    test('first card price contains the EUR currency symbol', async () => {
      // Intl.NumberFormat('es-ES', { currency: 'EUR' }) produces e.g. "799 €"
      const priceText = await phonePage.phoneCards
        .first()
        .locator('.phone-card__price')
        .textContent();
      expect(priceText).toMatch(/€|EUR/);
    });

    test('Galaxy S24 card shows brand "Samsung", name "Galaxy S24", and price "799"', async ({
      page,
    }) => {
      const card = phonePage.phoneCards.filter({
        has: page.locator('.phone-card__name', { hasText: 'Galaxy S24' }),
      });
      await expect(card.locator('.phone-card__brand')).toHaveText('Samsung');
      await expect(card.locator('.phone-card__name')).toHaveText('Galaxy S24');
      await expect(card.locator('.phone-card__price')).toContainText('799');
    });

    test('iPhone 15 card shows brand "Apple", name "iPhone 15", and price "899"', async ({
      page,
    }) => {
      const card = phonePage.phoneCards.filter({
        has: page.locator('.phone-card__name', { hasText: 'iPhone 15' }),
      });
      await expect(card.locator('.phone-card__brand')).toHaveText('Apple');
      await expect(card.locator('.phone-card__name')).toHaveText('iPhone 15');
      await expect(card.locator('.phone-card__price')).toContainText('899');
    });

    test('Pixel 8 card shows brand "Google", name "Pixel 8", and price "699"', async ({
      page,
    }) => {
      const card = phonePage.phoneCards.filter({
        has: page.locator('.phone-card__name', { hasText: 'Pixel 8' }),
      });
      await expect(card.locator('.phone-card__brand')).toHaveText('Google');
      await expect(card.locator('.phone-card__name')).toHaveText('Pixel 8');
      await expect(card.locator('.phone-card__price')).toContainText('699');
    });
  });

  // ─── Keyboard navigation ───────────────────────────────────────────────────

  test.describe('keyboard navigation', () => {
    test('search input is reachable via keyboard Tab from the page', async ({ page }) => {
      // Start from the top of the document and Tab until the search input is focused.
      await page.keyboard.press('Tab');

      // Allow up to 10 Tab presses to reach the search input.
      let focused = false;
      for (let i = 0; i < 10; i++) {
        const activeTag = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
        if (activeTag === 'Search products') {
          focused = true;
          break;
        }
        await page.keyboard.press('Tab');
      }
      expect(focused).toBe(true);
    });

    test('focus can move from search input to the first phone card via Tab', async ({ page }) => {
      // Focus the search input first.
      await phonePage.searchInput.focus();

      // Tab past any clear/submit button (if present) to reach the first card link.
      let reachedCard = false;
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        const activeHref = await page.evaluate(() =>
          (document.activeElement as HTMLAnchorElement | null)?.href ?? '',
        );
        if (activeHref.includes('/products/')) {
          reachedCard = true;
          break;
        }
      }
      expect(reachedCard).toBe(true);
    });

    test('cart link is reachable via Tab without focus becoming trapped', async ({ page }) => {
      // Tab from the very start of the page through all focusable elements.
      // The cart link should receive focus before Tab wraps around.
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

    test('pressing Enter on a focused phone card navigates to the detail page', async ({
      page,
    }) => {
      // Tab to the first card link and activate it with Enter.
      await phonePage.searchInput.focus();

      let cardActivated = false;
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        const activeHref = await page.evaluate(() =>
          (document.activeElement as HTMLAnchorElement | null)?.href ?? '',
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
  });
});
