import { test, expect } from '../fixtures/test';
import { PhoneDetailPage } from '../pages/PhoneDetailPage';
import { CartPage } from '../pages/CartPage';

// ---------------------------------------------------------------------------
// Helper — adds one iPhone 15 to the cart via the detail page UI.
// Selecting a color auto-selects storage index 0, so a single interaction
// is enough to enable the "Añadir" button.
// ---------------------------------------------------------------------------
async function addIPhone15ToCart(detailPage: PhoneDetailPage, page: import('@playwright/test').Page) {
  await detailPage.goto('APL-IP15');
  await detailPage.selectColorByName('Black'); // storage auto-selects 128 GB at index 0
  await expect(detailPage.addToCartButton).toBeEnabled();
  await detailPage.addToCart();
  await page.waitForURL('/cart');
}

test.describe('CartPage', () => {
  test.describe('empty cart', () => {
    test('shows "Tu carrito está vacío" status message and Continuar comprando button', async ({
      page,
    }) => {
      const cartPage = new CartPage(page);
      await cartPage.goto();

      // Empty-state message uses role="status"
      await expect(cartPage.emptyMessage).toBeVisible();
      await expect(cartPage.emptyMessage).toContainText('Tu carrito está vacío');

      // "Continuar comprando" is always present
      await expect(cartPage.continueShoppingButton).toBeVisible();
    });

    test('"Continuar comprando" from empty cart navigates to /', async ({ page }) => {
      const cartPage = new CartPage(page);
      await cartPage.goto();

      await cartPage.continueShoppingButton.click();
      await page.waitForURL('/');
      await expect(page).toHaveURL('/');
    });

    test('cart items list is not rendered when cart is empty', async ({ page }) => {
      const cartPage = new CartPage(page);
      await cartPage.goto();

      // The <ul aria-label="Cart items"> must not exist when there are no items
      await expect(page.getByRole('list', { name: 'Cart items' })).not.toBeVisible();
    });
  });

  test.describe('cart with one item', () => {
    let detailPage: PhoneDetailPage;
    let cartPage: CartPage;

    test.beforeEach(async ({ page }) => {
      detailPage = new PhoneDetailPage(page);
      cartPage = new CartPage(page);
      await addIPhone15ToCart(detailPage, page);
    });

    test('cart heading shows Cart (1)', async () => {
      await expect(cartPage.cartHeading).toContainText('Cart (1)');
    });

    test('item name "iPhone 15" is visible', async () => {
      const names = await cartPage.getItemNames();
      expect(names).toContain('iPhone 15');
    });

    test('item specs show selected storage capacity and color', async ({ page }) => {
      // Specs rendered as "{storageCapacity} | {colorName}"
      // Black was selected → storage auto-selected 128 GB
      const itemSpecs = page.locator('.cart-page__item-specs');
      await expect(itemSpecs.first()).toContainText('128 GB');
      await expect(itemSpecs.first()).toContainText('Black');
    });

    test('item price shows 899 EUR', async ({ page }) => {
      // Cart item price: plain number + " EUR" — no currency symbol
      const itemPrice = page.locator('.cart-page__item-price');
      await expect(itemPrice.first()).toContainText('899');
      await expect(itemPrice.first()).toContainText('EUR');
    });

    test('total price shows 899 EUR', async () => {
      await expect(cartPage.totalPrice).toContainText('899');
      await expect(cartPage.totalPrice).toContainText('EUR');
    });

    test('deleting the only item empties the cart', async () => {
      await expect(await cartPage.getItemCount()).toBe(1);

      await cartPage.removeItem('iPhone 15');

      // After removal the list disappears and the empty-state message appears
      await expect(cartPage.emptyMessage).toBeVisible();
      await expect(cartPage.emptyMessage).toContainText('Tu carrito está vacío');
      await expect(await cartPage.getItemCount()).toBe(0);
    });
  });

  test.describe('navbar cart count', () => {
    test('navbar shows count 1 after adding one item', async ({ page }) => {
      const detailPage = new PhoneDetailPage(page);
      await addIPhone15ToCart(detailPage, page);

      // Navigate to home — navbar is visible on all pages
      await page.goto('/');
      await page.waitForSelector('.phone-list-page', { timeout: 10_000 });

      const cartCount = page.locator('.navbar__cart-count');
      await expect(cartCount).toHaveText('1');
    });
  });

  test.describe('cart persistence', () => {
    test('added item survives navigation away and back to /cart', async ({ page }) => {
      const detailPage = new PhoneDetailPage(page);
      const cartPage = new CartPage(page);

      await addIPhone15ToCart(detailPage, page);

      // Navigate away to the home page
      await page.goto('/');
      await page.waitForSelector('.phone-list-page', { timeout: 10_000 });

      // Navigate back to /cart — localStorage should still hold the item
      await cartPage.goto();

      await expect(cartPage.cartHeading).toContainText('Cart (1)');
      const names = await cartPage.getItemNames();
      expect(names).toContain('iPhone 15');
    });
  });
});
