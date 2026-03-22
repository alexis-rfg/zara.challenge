import type { Page } from '@playwright/test';
import products from '../../src/test/fixtures/products.json';
import productDetails from '../../src/test/fixtures/productDetails.json';

/**
 * Playwright v1.45+ automatically loads .env from the project root and
 * exposes its variables via process.env — no dotenv import needed.
 * VITE_API_BASE_URL is defined in .env and must never be hardcoded here.
 */
const API_BASE =
  process.env['VITE_API_BASE_URL'] ??
  (() => {
    throw new Error(
      'VITE_API_BASE_URL is not set. Make sure .env exists at the project root.',
    );
  })();

const PRODUCT_LIST = Object.values(products);
const PRODUCT_DETAILS = Object.values(productDetails);

/**
 * Intercepts all requests to the products API and returns fixture data.
 * Handles both list/search requests (/products?...) and detail requests (/products/:id).
 */
export async function setupApiMocks(page: Page): Promise<void> {
  await page.route(`${API_BASE}/products**`, async (route) => {
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
