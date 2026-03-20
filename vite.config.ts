import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Allow imports relative to src directory
      '@': resolve(__dirname, './src')
    }
  }, 
  css: {
    // So DevTools show the original .scss file rather than compiled CSS
    devSourcemap: true,
  }, 
  test: {
    // Use jsdom to simulate a browser DOM in node
    environment: 'jsdom', 
    // Expose Vistest globals w/o explicit imports
    globals: true, 
    // Runs before every test suite
    // Extends expect with @testing-library/jest-dom matchers
    setupFiles: ['./src/test/setup.ts'], 
    coverage: {
      provider: 'v8',
      // Include source files in coverage report
      include: ['src/**/*.{ts,tsx}'],
      // Exclude test files, spec files, test directory, main entry point, type files, and barrel index files
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/test/**',
        'src/main.tsx',
        'src/types/**',
        'src/**/index.ts',
      ], 
      // How test results and coverage dat are formatted and displayed
      reporter: ['text', 'html', 'lcov'],
    }
  }, 
  build: {
    // esbuild is Vite's default minifier. It handles both minification of
    // JavaScript/TypeScript AND minification of CSS. Setting this to 'esbuild'
    // is the default — it is written explicitly here for clarity and to
    // document the spec requirement: "production: concatenated AND minimized".
    minify: 'esbuild',
    // Generate source maps for the production build. This allows debugging
    // production issues in browser DevTools without exposing readable source
    // to end users (source maps are separate files only fetched by DevTools).
    sourcemap: true,
    rollupOptions: {
      output: {
        // Splits bundle into logical groups for better caching and parallel loading
        // Concatenates modules in each chunk into a single file
        // Passes each chunk to esbuild for minification
        // PROD: concatenated + minified
        manualChunks: {
          // React runtime into its own chunk. Changes only when you upgrade React.
          vendor: ['react', 'react-dom'],
          // React Router into its own chunk.
          router: ['react-router-dom'],
        }
      }
      
    }
  },
  server: {
    port: 3000,
    open: true,
  },
})
