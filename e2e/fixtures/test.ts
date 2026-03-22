import { test as base, expect, type Page } from '@playwright/test';
import { setupApiMocks } from './api-mock';

type E2EFixtures = {
  page: Page;
};

/**
 * Extended test fixture that automatically mocks all API routes before each test.
 * Import `test` and `expect` from this file instead of `@playwright/test`
 * in all E2E spec files.
 */
export const test = base.extend<E2EFixtures>({
  page: async ({ page }, use) => {
    await setupApiMocks(page);
    await use(page);
  },
});

export { expect };
