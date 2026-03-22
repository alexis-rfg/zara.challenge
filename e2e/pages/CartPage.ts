import { type Page, type Locator } from '@playwright/test';

export class CartPage {
  readonly page: Page;
  readonly cartItems: Locator;
  readonly totalPrice: Locator;
  readonly continueShoppingButton: Locator;
  readonly emptyMessage: Locator;
  readonly cartHeading: Locator;

  constructor(page: Page) {
    this.page = page;
    // Individual cart item <li> elements inside the list
    this.cartItems = page.getByRole('list', { name: 'Cart items' }).getByRole('listitem');
    this.totalPrice = page.locator('.cart-page__total-price');
    this.continueShoppingButton = page.getByRole('button', { name: 'Continuar comprando' });
    this.emptyMessage = page.getByRole('status');
    this.cartHeading = page.locator('.cart-page__heading');
  }

  async goto() {
    await this.page.goto('/cart');
    await this.continueShoppingButton.waitFor({ timeout: 5_000 });
  }

  async removeItem(productName: string) {
    await this.page
      .getByRole('button', { name: new RegExp(`Eliminar ${productName}`, 'i') })
      .click();
  }

  async removeItemAt(index: number) {
    await this.cartItems
      .nth(index)
      .getByRole('button', { name: /Eliminar/i })
      .click();
  }

  async getItemCount(): Promise<number> {
    return this.cartItems.count();
  }

  async getItemNames(): Promise<string[]> {
    return this.cartItems.locator('.cart-page__item-name').allTextContents();
  }
}
