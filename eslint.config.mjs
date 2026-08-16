// @ts-check
import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * eslint-config-next's exported flat-config arrays are written to apply
 * repo-wide (`**\/*.ts` with no directory prefix) since the package has no
 * way to know where it'll be used. Applying them unscoped breaks apps/api:
 * eslint-plugin-react's React-version detection throws under ESLint 10
 * (`contextOrFilename.getFilename is not a function`) even on files with no
 * JSX in them, because it runs unconditionally rather than only on match.
 * So every config object gets its `files` glob prefixed to apps/web/ — the
 * one thing this must NOT do is silently drop that restriction.
 */
function scopeToWeb(configs) {
  return configs.map((config) => ({
    ...config,
    files: (config.files ?? ['**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}']).map(
      (pattern) => `apps/web/${pattern}`,
    ),
  }));
}

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/out/**',
      '**/build/**',
      '**/coverage/**',
      '**/next-env.d.ts',
      '**/*.gitkeep',
      'eslint.config.mjs',
      '**/generated/**',
    ],
  },

  // Base rules for every TS/JS file in the workspace.
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        // Resolves the nearest tsconfig.json per file instead of listing every
        // package's tsconfig by hand — required for type-aware rules in a
        // multi-tsconfig monorepo. See typescript-eslint's "projectService" docs.
        projectService: {
          // apps/api/prisma.config.ts and both apps' vitest.config.mts sit
          // outside src/ (or outside app/), so none are covered by their
          // app's tsconfig "include" — adding them there instead breaks the
          // build (TS6059: file not under rootDir). allowDefaultProject is
          // the documented escape hatch for exactly this shape of file;
          // defaultProject borrows apps/api's real compiler options for the
          // one file (prisma.config.ts) that needs real Node types to
          // type-check its process.env usage correctly.
          allowDefaultProject: ['apps/api/prisma.config.ts', 'apps/api/vitest.config.mts'],
          defaultProject: 'apps/api/tsconfig.json',
        },
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.node,
      },
    },
  },

  // Next.js / React rules — scoped to apps/web only (see scopeToWeb above).
  // Includes react-hooks rules already; no separate registration needed.
  ...scopeToWeb(nextCoreWebVitals),
  ...scopeToWeb(nextTypescript),
  {
    files: ['apps/web/**/*.{ts,tsx,mts,cts}'],
    languageOptions: {
      globals: { ...globals.browser },
    },
    settings: {
      // eslint-config-next ships settings.react.version: 'detect'. Auto-detection
      // crashes under ESLint 10 (eslint-plugin-react@7.37.5 calls a context
      // method ESLint 10 removed) — pinning the version explicitly skips that
      // code path. Bump this if/when React is upgraded.
      react: { version: '19.2.8' },
    },
    rules: {
      // ESLint's cwd is the repo root, not apps/web, so the rule's default
      // (./pages, ./src/pages) resolves to the wrong place and prints a
      // spurious "Pages directory cannot be found" notice every run.
      '@next/next/no-html-link-for-pages': ['warn', 'apps/web'],
    },
  },

  // NestJS conventions for apps/api — mirrors the relaxations `nest new`
  // itself ships (DI-heavy, decorator-heavy code trips these rules a lot).
  {
    files: ['apps/api/**/*.ts'],
    languageOptions: {
      sourceType: 'commonjs',
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
    },
  },

  // packages/* and scripts/* — plain Node + TS, CommonJS output, no framework rules.
  {
    files: ['packages/**/*.ts', 'scripts/**/*.ts'],
    languageOptions: {
      sourceType: 'commonjs',
    },
  },

  // Must be last: turns off any stylistic rule that would fight Prettier.
  eslintConfigPrettier,
);
