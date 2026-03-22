import { test, expect } from '../fixtures/test';
import { PhoneDetailPage } from '../pages/PhoneDetailPage';
import { CartPage } from '../pages/CartPage';

test.describe('PhoneDetailPage — iPhone 15', () => {
  let detailPage: PhoneDetailPage;

  test.beforeEach(async ({ page }) => {
    detailPage = new PhoneDetailPage(page);
    await detailPage.goto('APL-IP15');
  });

  test('displays product title and brand', async () => {
    await expect(detailPage.productTitle).toHaveText('iPhone 15');
    // Brand appears in the specs table (Brand row)
    await expect(detailPage.specsSection).toContainText('Apple');
  });

  test('Add button is disabled before any selection', async () => {
    await expect(detailPage.addToCartButton).toBeDisabled();
    await expect(detailPage.addToCartButton).toHaveAttribute('aria-disabled', 'true');
  });

  test('selecting a color enables the Add button (storage auto-selects index 0)', async () => {
    await detailPage.selectColor(0); // Black
    await expect(detailPage.addToCartButton).toBeEnabled();
    await expect(detailPage.addToCartButton).toHaveAttribute('aria-disabled', 'false');
  });

  test('selecting a storage option enables the Add button (color auto-selects index 0)', async () => {
    await detailPage.selectStorage(0); // 128 GB
    await expect(detailPage.addToCartButton).toBeEnabled();
    await expect(detailPage.addToCartButton).toHaveAttribute('aria-disabled', 'false');
  });

  test('product image src changes when a different color is selected', async ({ page }) => {
    // Record initial src (no color selected — defaults to colorOptions[0] imageUrl)
    const initialSrc = await detailPage.getImageSrc();

    // Select the second color (Blue)
    await detailPage.selectColorByName('Blue');

    const updatedSrc = await detailPage.getImageSrc();

    // Either the src now contains "blue", or it is simply different from the initial value
    const blueUrl = '/img/ip15-blue.webp';
    expect(updatedSrc).toContain('blue');
    expect(updatedSrc).not.toEqual(initialSrc);
    expect(updatedSrc).toContain(blueUrl.replace('/img/', ''));

    // Verify Black (index 0) gives the black image
    await detailPage.selectColorByName('Black');
    const blackSrc = await detailPage.getImageSrc();
    expect(blackSrc).toContain('black');
    expect(blackSrc).not.toEqual(updatedSrc);
  });

  test('price element is visible and contains EUR', async () => {
    await expect(detailPage.productPrice).toBeVisible();
    await expect(detailPage.productPrice).toContainText('EUR');
  });

  test('all 8 technical specifications are displayed', async () => {
    const specs = detailPage.specsSection;

    // Labels rendered by TECH_SPEC_ROWS
    await expect(specs).toContainText('Screen');
    await expect(specs).toContainText('Resolution');
    await expect(specs).toContainText('Processor');
    await expect(specs).toContainText('Main Camera');
    await expect(specs).toContainText('Selfie Camera');
    await expect(specs).toContainText('Battery');
    await expect(specs).toContainText('OS');
    await expect(specs).toContainText('Screen Refresh Rate');

    // Spot-check a few values from the iPhone 15 fixture
    await expect(specs).toContainText('A16 Bionic');
    await expect(specs).toContainText('48 MP');
    await expect(specs).toContainText('iOS 17');
    await expect(specs).toContainText('60 Hz');
  });

  test('similar products section is visible and contains Galaxy S24', async () => {
    await expect(detailPage.similarProductsSection).toBeVisible();
    await expect(detailPage.similarProductsSection).toContainText('Galaxy S24');
    await expect(detailPage.similarProductCards).toHaveCount(1);
  });

  test('clicking a similar product card navigates to that product detail page', async ({
    page,
  }) => {
    // Click the Galaxy S24 card inside the similar products section
    await detailPage.similarProductCards.first().click();
    await page.waitForURL('/products/SMG-S24');
    await expect(page).toHaveURL('/products/SMG-S24');
  });

  test('full add-to-cart flow: select color + storage → click Añadir → lands on /cart', async ({
    page,
  }) => {
    const cartPage = new CartPage(page);

    // Make a single selection — the other auto-selects index 0
    await detailPage.selectColorByName('Black');

    await expect(detailPage.addToCartButton).toBeEnabled();
    await detailPage.addToCart();

    await page.waitForURL('/cart');
    await expect(page).toHaveURL('/cart');

    // Basic sanity: the cart now has one item
    await expect(cartPage.cartHeading).toContainText('Cart (1)');
  });

  test('navigating to an invalid product id shows an error alert', async ({ page }) => {
    await page.goto('/products/INVALID-ID');

    // The error div has role="alert" — it is rendered by the error branch of PhoneDetailPage
    const errorAlert = page.locator('.phone-detail-page__error[role="alert"]');
    await errorAlert.waitFor({ timeout: 10_000 });
    await expect(errorAlert).toBeVisible();

    // The "Back to Home" button is present inside the error state
    await expect(page.getByRole('button', { name: /Back to Home/i })).toBeVisible();
  });
});
