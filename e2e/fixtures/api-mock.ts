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

/**
 * Playwright v1.45+ automatically loads .env from the project root and
 * exposes its variables via process.env — no dotenv import needed.
 *
 * In CI the .env file is not present; VITE_API_BASE_URL is injected as a
 * plain (non-secret) env var in ci.yml with the same placeholder value used
 * at build time. Since every request is intercepted by page.route() the URL
 * is never actually contacted, so the placeholder is safe to hardcode here.
 */
const API_BASE =
  process.env['VITE_API_BASE_URL'] ?? 'https://api.example.com';

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
