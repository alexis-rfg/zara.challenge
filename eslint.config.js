import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'
import vitest from 'eslint-plugin-vitest'

export default defineConfig([
  globalIgnores(['dist', 'coverage', '**/*.d.ts']),

  // All source files
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['**/*.d.ts'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked, // type-aware rules; requires parserOptions.project
      jsxA11y.flatConfigs.recommended, // a11y rules required by spec
    ],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: ['./tsconfig.app.json'], // not tsconfig.json — that file has no compilerOptions
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports', fixStyle: 'inline-type-imports' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'prefer-const': 'error',
    },
  },

  // Test files — merged ON TOP of the block above for files that match both.
  // vitest.configs.recommended is scoped here so test globals (describe, it,
  // expect, vi…) are not available in production source files.
  {
    files: ['src/**/*.test.{ts,tsx}', 'src/**/*.spec.{ts,tsx}', 'src/test/**'],
    extends: [vitest.configs.recommended],
    rules: {
      // vi.fn() / vi.spyOn() / importOriginal() return `any` — these rules fire on every mock with no signal
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      // warn not off — surfaces accidentally committed console.log debug lines
      'no-console': 'warn',
      // no-non-null-assertion stays ON — RTL getBy* throws on failure, so ! is never needed
    },
  },
])
