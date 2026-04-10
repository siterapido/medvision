// ESLint flat config for Next.js + TypeScript
import next from 'eslint-config-next'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

const config = [
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 2023, sourceType: 'module', project: false },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {},
  },
  ...next,
]

export default config
