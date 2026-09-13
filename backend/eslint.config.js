// backend/eslint.config.js
//
// ESLint 9+ dropped the legacy `.eslintrc.*` format in favor of this flat
// config — there is no `.eslintrc.json` here because the installed ESLint
// version (10.x) would not read one. Run with `npm run lint`.

const js = require('@eslint/js');
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const prettierConfig = require('eslint-config-prettier');
const globals = require('globals');

module.exports = [
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**'] },

  js.configs.recommended,

  {
    files: ['src/**/*.ts', 'prisma/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        // A dedicated tsconfig, not tsconfig.json itself: the real one
        // excludes *.spec.ts (see its comment on `rootDir`) so ts-jest and a
        // full `tsc` build never fight over which files form the program,
        // but that means it can't also be the program ESLint type-checks
        // against without spec files failing to parse.
        project: './tsconfig.eslint.json',
        sourceType: 'module',
      },
      globals: { ...globals.node },
    },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      ...tsPlugin.configs.recommended.rules,

      // Nest relies heavily on decorator metadata and Prisma's generated
      // types, both of which are frequently `any` in practice — the strict
      // ban makes the linter noisy without catching real bugs here.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      // TypeScript itself already enforces this; ESLint's base rule cannot
      // see type-only imports/exports and produces false positives on them.
      'no-unused-vars': 'off',
      // Decorators (@Injectable(), @Controller(), ...) are a class-only
      // language feature ESLint's base parser does not model correctly.
      'no-useless-constructor': 'off',
    },
  },

  {
    files: ['src/**/*.spec.ts'],
    languageOptions: {
      globals: { ...globals.jest },
    },
  },

  prettierConfig,
];
