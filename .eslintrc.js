module.exports = {
  // Specifies the ESLint parser
  parser: '@typescript-eslint/parser',

  // Which files to not lint
  ignorePatterns: [
    'node_modules',
  ],

  parserOptions: {
    // Allows for the parsing of modern ECMAScript features
    ecmaVersion: 2020,
    // Allows for the use of imports
    sourceType: 'module',
  },

  extends: [
    // Uses the recommended rules from the @typescript-eslint/eslint-plugin
    'plugin:@typescript-eslint/recommended',
  ],

  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { vars: 'all', args: 'none', ignoreRestSiblings: false },
    ],
    quotes: ['error', 'single', { avoidEscape: true }],
    curly: ['error', 'all'],
    'max-lines-per-function': ['error', 50]
  },
};
