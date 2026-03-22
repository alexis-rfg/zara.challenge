import { type Page, type Locator } from '@playwright/test';

export class PhoneListPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly searchResults: Locator;
  readonly phoneCards: Locator;
  readonly cartLink: Locator;
  readonly filterButton: Locator;
  readonly progressBar: Locator;
  readonly errorAlert: Locator;
  readonly emptyStatus: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByLabel('Search products');
    this.searchResults = page.locator('.search-bar__results');
    this.phoneCards = page.locator('.phone-card');
    // Cart link has aria-label like "Shopping cart with N items"
    this.cartLink = page.getByRole('link', { name: /Shopping cart/i });
    this.filterButton = page.getByRole('button', { name: /Open color filter|FILTRAR/i });
    this.progressBar = page.getByRole('progressbar');
    this.errorAlert = page.getByRole('alert');
    this.emptyStatus = page.getByRole('status').filter({ hasText: /No products found/i });
  }

  async goto() {
    await this.page.goto('/');
    // Wait for either the grid or loading/error state to appear
    await this.page.waitForSelector('.phone-list-page', { timeout: 10_000 });
  }

  async waitForProducts() {
    await this.phoneCards.first().waitFor({ timeout: 10_000 });
  }

  /** Fill search and wait for debounce (500ms) + API response */
  async search(term: string) {
    await this.searchInput.fill(term);
    await this.page.waitForTimeout(600);
    // Wait for loading to settle
    await this.page.waitForFunction(
      () => !document.querySelector('[role="progressbar"]'),
      undefined,
      { timeout: 5_000 },
    );
  }

  async clearSearch() {
    await this.page.getByLabel('Clear search').click();
    await this.page.waitForTimeout(600);
  }

  async clickCard(index: number) {
    await this.phoneCards.nth(index).click();
  }

  async getCartItemCount(): Promise<number> {
    const countText = await this.page.locator('.navbar__cart-count').textContent();
    return parseInt(countText ?? '0', 10);
  }
}
