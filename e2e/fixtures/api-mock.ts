import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Page } from '@playwright/test';

const __dirname = dirname(fileURLToPath(import.meta.url));
const products = JSON.parse(
  readFileSync(resolve(__dirname, '../../src/test/fixtures/products.json'), 'utf-8'),
) as Record<string, { id: string; name: string; brand: string; basePrice: number; imageUrl: string }>;
const productDetails = JSON.parse(
  readFileSync(resolve(__dirname, '../../src/test/fixtures/productDetails.json'), 'utf-8'),
) as Record<string, { id: string; name: string; brand: string }>;

const PRODUCT_LIST = Object.values(products);
const PRODUCT_DETAILS = Object.values(productDetails);

/**
 * Intercepts all fetch/XHR requests whose path contains "/products" and
 * returns fixture data. A regex is used instead of a glob so the mock works
 * regardless of which API base URL is baked into the bundle (real URL in dev,
 * placeholder in CI). The resourceType check skips page navigations to
 * /products/:id so only API calls are intercepted.
 */
export async function setupApiMocks(page: Page): Promise<void> {
  await page.route(/\/products/, async (route) => {
    // Skip page navigations (HTML document requests) — only intercept fetch/XHR
    if (!['fetch', 'xhr'].includes(route.request().resourceType())) {
      await route.continue();
      return;
    }
    const url = new URL(route.request().url());
    const pathMatch = url.pathname.match(/\/products\/(.+)/);

    if (pathMatch?.[1]) {
      // Detail request: GET /products/:id
      const id = pathMatch[1];
      const detail = PRODUCT_DETAILS.find((p) => p.id === id);
      if (detail) {
        await route.fulfill({ status: 200, json: detail });
      } else {
        await route.fulfill({ status: 404, json: { error: 'Product not found' } });
      }
      return;
    }

    // List/search request: GET /products?limit=20 or /products?search=term
    const search = url.searchParams.get('search');
    let result = PRODUCT_LIST;
    if (search) {
      const term = search.toLowerCase();
      result = PRODUCT_LIST.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.brand.toLowerCase().includes(term),
      );
    }
    await route.fulfill({ status: 200, json: result });
  });
}
