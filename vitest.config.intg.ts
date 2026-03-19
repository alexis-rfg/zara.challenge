import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from './vite.config';

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      include: ['src/**/*.intg.test.{ts,tsx}', 'src/**/__tests__/**/*.{ts,tsx}'],
      exclude: ['src/**/*.unit.test.{ts,tsx}', 'src/**/*.e2e.test.{ts,tsx}', 'node_modules/**'],
    },
  }),
);
