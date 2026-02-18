// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
// import storybook from 'eslint-plugin-storybook';

import nx from '@nx/eslint-plugin';
import jsoncParser from 'jsonc-eslint-parser';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  ...nx.configs['flat/angular'],
  ...nx.configs['flat/angular-template'],
  {
    ignores: [
      '**/dist',
      '**/vite.config.*.timestamp*',
      '**/vitest.config.*.timestamp*',
    ],
  },
  {
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'basta',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'basta',
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    // Override or add rules here
    rules: {
      'no-restricted-syntax': [
        'warn',
        {
          selector:
            ':matches(PropertyDefinition, MethodDefinition)[accessibility="private"]',
          message: 'Use # prefix instead.',
        },
      ],
      '@typescript-eslint/explicit-member-accessibility': [
        'warn',
        {
          accessibility: 'no-public',
        },
      ],
      '@typescript-eslint/member-ordering': [
        'warn',
        {
          classes: {
            memberTypes: [
              'signature',
              '#private-instance-readonly-field',
              '#private-instance-field',
              'public-instance-readonly-field',
              'public-instance-field',
              'decorated-readonly-field',
              'decorated-field',
              'set',
              'get',
              'constructor',
              'public-instance-method',
              '#private-instance-method',
            ],
          },
        },
      ],
      '@typescript-eslint/naming-convention': [
        'warn',
        {
          selector: 'memberLike',
          modifiers: ['#private'],
          format: ['camelCase'],
          leadingUnderscore: 'forbid',
          trailingUnderscore: 'forbid',
        },
        {
          selector: 'memberLike',
          modifiers: ['public'],
          format: ['camelCase'],
          leadingUnderscore: 'forbid',
          trailingUnderscore: 'forbid',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      'arrow-body-style': ['error', 'as-needed'],
    },
  },
  {
    files: ['**/*.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          ignoredFiles: ['{projectRoot}/eslint.config.{js,cjs,mjs,ts,cts,mts}'],
        },
      ],
    },
    languageOptions: {
      parser: jsoncParser,
    },
  },
  // {
  //   files: ['**/*.html'],
  //   // Override or add rules here
  //   rules: {},
  // },
  {
    files: ['**/*.spec.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          name: '@angular/common/http',
          importNames: ['provideHttpClient'],
          message:
            'Do not use provideHttpClient() directly in spec.ts files. Mock services and stores instead.',
        },
        {
          name: '@angular/common/http/testing',
          importNames: ['provideHttpClientTesting'],
          message:
            'Do not use provideHttpClientTesting() directly in spec.ts files. Mock services and stores instead.',
        },
      ],
    },
  },
  // ...storybook.configs['flat/recommended'],
];
