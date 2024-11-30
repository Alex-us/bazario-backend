import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import perfectionist from 'eslint-plugin-perfectionist';
import unusedImportPlugin from 'eslint-plugin-unused-imports';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'prettier': eslintPluginPrettier,
      'unused-imports': unusedImportPlugin,
      perfectionist,
    },
    rules: {
      'perfectionist/sort-imports': [
        'error',
        {
          type: 'alphabetical',
          order: 'asc',
          ignoreCase: true,
          specialCharacters: 'keep',
          matcher: 'minimatch',
          internalPattern: ['~/**'],
          newlinesBetween: 'always',
          maxLineLength: undefined,
          groups: [
            'type',
            ['builtin', 'external'],
            'internal-type',
            'internal',
            ['parent-type', 'sibling-type', 'index-type'],
            ['parent', 'sibling', 'index'],
            'object',
            'unknown',
          ],
          customGroups: { type: {}, value: {} },
          environment: 'node',
        },
      ],
      "unused-imports/no-unused-imports": [
        "error",
        {
          "varsIgnorePattern": "^_"
        }
      ],
      "comma-dangle": ["error", "only-multiline"],
      "no-trailing-spaces": [
        "error",
        { "ignoreComments": true}
      ]
    },
  },
)
