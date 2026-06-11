import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      // NestJS DI + class-validator + reflect-metadata need runtime class refs.
      // Auto-fix to `type` imports breaks the DI container.
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
];
