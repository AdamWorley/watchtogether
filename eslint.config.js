import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

// DOM sinks that can turn a string into markup or code. All user content must be rendered
// through Svelte text interpolation instead.
const htmlSinks = ['innerHTML', 'outerHTML', 'insertAdjacentHTML', 'srcdoc'].map((property) => ({
  property,
  message: 'HTML sinks are banned (XSS). Render text with Svelte interpolation.',
}));

export default ts.config(
  {
    ignores: [
      'dist',
      'coverage',
      '.wrangler',
      'playwright-report',
      'test-results',
      '**/worker-configuration.d.ts',
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommendedTypeChecked,
  ...svelte.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: {
        projectService: { allowDefaultProject: ['*.config.js', '*.config.ts'] },
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: ['.svelte'],
      },
    },
  },
  {
    files: ['**/*.svelte', '**/*.svelte.ts'],
    languageOptions: { parserOptions: { parser: ts.parser, svelteConfig } },
  },
  {
    rules: {
      'svelte/no-at-html-tags': 'error',
      'svelte/no-target-blank': 'error',
      'no-restricted-syntax': [
        'error',
        ...htmlSinks.map(({ property, message }) => ({
          selector: `MemberExpression[property.name='${property}']`,
          message,
        })),
        {
          selector: "CallExpression[callee.property.name='write'][callee.object.name='document']",
          message: 'document.write is banned.',
        },
      ],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/**'],
    ignores: ['src/shared/zod.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { name: 'zod', message: "Import { z } from 'src/shared/zod' (jitless config for CSP)." },
      ],
    },
  },
  {
    files: ['src/worker/**', 'test/worker/**'],
    languageOptions: { globals: { ...globals.serviceworker } },
  },
  {
    files: ['*.config.{js,ts}', 'scripts/**', 'test/e2e/**'],
    languageOptions: { globals: { ...globals.node } },
  },
);
