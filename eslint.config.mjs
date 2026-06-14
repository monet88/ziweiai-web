import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.expo/**',
      '**/.turbo/**',
      '**/.svelte-kit/**',
      '.ref/**',
      '**/.ref/**',
      'vendor/xuanshu-runtime/**',
      'harness.db*',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['apps/web/**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tseslint.parser,
      },
      globals: globals.browser,
    },
    plugins: { svelte },
    rules: svelte.configs.recommended.reduce(
      (acc, cfg) => Object.assign(acc, cfg.rules),
      {},
    ),
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['apps/app/**/*.{js,mjs,cjs,ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@ziweiai/astro-engine',
              message:
                'Astrology engine is server-only. Call the API instead of importing it into the Expo app.',
            },
          ],
          patterns: [
            {
              group: ['.ref/**', '**/.ref/**'],
              message:
                'Reference repositories are study-only. Import contracts/core or server adapters instead of .ref sources.',
            },
            {
              group: [
                'sweph-wasm',
                'swisseph',
                'swisseph-v2',
                '**/packages/astro-engine',
                '**/packages/astro-engine/**',
                '../../packages/astro-engine',
                '../../packages/astro-engine/**',
                '../../../packages/astro-engine',
                '../../../packages/astro-engine/**',
              ],
              message:
                'Astrology engine and ephemeris code are server-only. Call the API instead of importing them into the Expo app.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['apps/web/**/*.{js,mjs,cjs,ts,mts,svelte}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@ziweiai/core',
              message:
                'Boundary client/server (decision 0007): @ziweiai/core là server-only (kéo iztro + chữ Hán). Gọi API thay vì import vào apps/web.',
            },
            {
              name: '@ziweiai/astro-engine',
              message:
                'Boundary client/server (decision 0007): @ziweiai/astro-engine là server-only (ephemeris + iztro). Gọi API thay vì import vào apps/web.',
            },
            {
              name: 'iztro',
              message:
                'Boundary client/server (decision 0007): iztro là engine tính lá số server-only. Không import vào client bundle.',
            },
            {
              name: 'lunar-javascript',
              message:
                'Boundary client/server (decision 0007): lunar-javascript là server-only (chữ Hán + lịch). Không import vào client bundle.',
            },
          ],
          patterns: [
            {
              group: [
                '@ziweiai/core/**',
                '@ziweiai/astro-engine/**',
                '**/packages/core',
                '**/packages/core/**',
                '**/packages/astro-engine',
                '**/packages/astro-engine/**',
              ],
              message:
                'Boundary client/server (decision 0007): core/astro-engine là server-only. Gọi API thay vì import vào apps/web.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['apps/app/*.config.js'],
    languageOptions: {
      globals: {
        __dirname: 'readonly',
        module: 'readonly',
        require: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['**/*.cjs'],
    languageOptions: {
      globals: {
        __dirname: 'readonly',
        clearInterval: 'readonly',
        clearTimeout: 'readonly',
        console: 'readonly',
        module: 'readonly',
        process: 'readonly',
        require: 'readonly',
        setInterval: 'readonly',
        setTimeout: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
);
