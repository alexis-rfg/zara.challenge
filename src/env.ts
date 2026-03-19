export const requireEnv = (key: string): string => {
  const value = import.meta.env[key] as string | undefined;
  if (!value) {
    throw new Error(
      `Missing environment variable: ${key}. Create a .env file based on .env.example`,
    );
  }
  return value;
};

export const env = () => ({
  apiKey: requireEnv('VITE_API_KEY'),
  baseUrl: requireEnv('VITE_API_BASE_URL'),
});
