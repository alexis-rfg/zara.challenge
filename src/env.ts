/**
 * Reads a required Vite environment variable and throws if it is absent or empty.
 *
 * Centralising env access here ensures that missing variables surface as a
 * clear `Error` at startup rather than causing silent `undefined` issues deep
 * inside API calls.
 *
 * @param key - The `import.meta.env` key to read (e.g. `'VITE_API_KEY'`).
 * @returns The non-empty string value of the variable.
 * @throws {Error} If the variable is missing or empty.
 */
export const requireEnv = (key: string): string => {
  const value = import.meta.env[key] as string | undefined;
  if (!value) {
    throw new Error(
      `Missing environment variable: ${key}. Create a .env file based on .env.example`,
    );
  }
  return value;
};

/**
 * Returns a typed snapshot of all required runtime environment variables.
 *
 * Called as a function (rather than a plain object) so that `import.meta.env`
 * is read at call time, not at module-load time. This makes the values easier
 * to mock in unit tests via `vi.mock('@/env', ...)`.
 *
 * @returns An object containing the API key and base URL needed by `apiClient`.
 */
export const env = () => ({
  apiKey: requireEnv('VITE_API_KEY'),
  baseUrl: requireEnv('VITE_API_BASE_URL'),
});
