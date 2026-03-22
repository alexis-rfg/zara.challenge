import { type Page, type Locator } from '@playwright/test';

export class PhoneDetailPage {
  readonly page: Page;
  readonly productTitle: Locator;
  readonly productPrice: Locator;
  readonly addToCartButton: Locator;
  readonly colorSwatches: Locator;
  readonly storageOptions: Locator;
  readonly productImage: Locator;
  readonly specsSection: Locator;
  readonly similarProductsSection: Locator;
  readonly similarProductCards: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.productTitle = page.locator('.phone-detail-page__title');
    this.productPrice = page.locator('.phone-detail-page__price');
    this.addToCartButton = page.locator('.phone-detail-page__add-btn');
    // Color swatches: buttons with role="radio" inside the color selector radiogroup
    this.colorSwatches = page
      .getByRole('radiogroup', { name: 'Select color' })
      .getByRole('radio');
    // Storage options: buttons with role="radio" inside the storage selector radiogroup
    this.storageOptions = page
      .getByRole('radiogroup', { name: 'Select storage capacity' })
      .getByRole('radio');
    this.productImage = page.locator('.phone-detail-page__image');
    this.specsSection = page.getByRole('region', { name: 'Specifications' });
    this.similarProductsSection = page.getByRole('region', { name: 'Similar products' });
    this.similarProductCards = page
      .getByRole('region', { name: 'Similar products' })
      .locator('.phone-card');
    this.backButton = page.getByRole('button', { name: /back/i });
  }

  async goto(productId: string) {
    await this.page.goto(`/products/${productId}`);
    await this.productTitle.waitFor({ timeout: 10_000 });
  }

  async selectColor(index: number) {
    await this.colorSwatches.nth(index).click();
  }

  async selectColorByName(name: string) {
    await this.page.getByRole('radio', { name }).click();
  }

  async selectStorage(index: number) {
    await this.storageOptions.nth(index).click();
  }

  async selectStorageByCapacity(capacity: string) {
    await this.page.getByRole('radio', { name: capacity }).click();
  }

  async addToCart() {
    await this.addToCartButton.click();
  }

  async getImageSrc(): Promise<string | null> {
    return this.productImage.getAttribute('src');
  }
}
