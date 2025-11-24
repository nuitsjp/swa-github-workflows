// See: https://eslint.org/docs/latest/use/configure/configuration-files

import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { createRequire } from 'node:module'

const repoRoot = path.dirname(fileURLToPath(import.meta.url))
const roleSyncDir = path.join(repoRoot, 'actions', 'role-sync')
const roleSyncRequire = createRequire(path.join(roleSyncDir, 'package.json'))
const roleSyncPath = (p) => `actions/role-sync/${p}`

const { fixupPluginRules } = roleSyncRequire('@eslint/compat')
const { FlatCompat } = roleSyncRequire('@eslint/eslintrc')
const js = roleSyncRequire('@eslint/js')
const typescriptEslint = roleSyncRequire('@typescript-eslint/eslint-plugin')
const tsParser = roleSyncRequire('@typescript-eslint/parser')
const _import = roleSyncRequire('eslint-plugin-import')
const jest = roleSyncRequire('eslint-plugin-jest')
const prettier = roleSyncRequire('eslint-plugin-prettier')
const globals = roleSyncRequire('globals')

const compat = new FlatCompat({
  baseDirectory: roleSyncDir,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
})

export default [
  {
    ignores: ['**/coverage/**', '**/dist/**', '**/linter/**', '**/node_modules/**']
  },
  ...compat.extends(
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:jest/recommended',
    'plugin:prettier/recommended'
  ),
  {
    plugins: {
      import: fixupPluginRules(_import),
      jest,
      prettier,
      '@typescript-eslint': typescriptEslint
    },

    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly'
      },

      parser: tsParser,
      ecmaVersion: 2023,
      sourceType: 'module',

      parserOptions: {
        tsconfigRootDir: roleSyncDir,
        projectService: {
          allowDefaultProject: [
            '__fixtures__/*.ts',
            '__tests__/*.ts',
            '__tests__/*/*.ts',
            'role-sync.eslint.config.mjs',
            'jest.config.js',
            'rollup.config.ts'
          ],
          maximumDefaultProjectFileMatchCount_THIS_WILL_SLOW_DOWN_LINTING: 16
        }
      }
    },

    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: roleSyncPath('tsconfig.json')
        }
      }
    },

    rules: {
      camelcase: 'off',
      'eslint-comments/no-use': 'off',
      'eslint-comments/no-unused-disable': 'off',
      'i18n-text/no-en': 'off',
      'import/no-namespace': 'off',
      'no-console': 'off',
      'no-shadow': 'off',
      'no-unused-vars': 'off',
      'prettier/prettier': 'error'
    }
  }
]
