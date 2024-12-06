const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const prettierPlugin = require('eslint-plugin-prettier');

module.exports = [
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                project: './tsconfig.json',
                tsconfigRootDir: __dirname,
                sourceType: 'module',
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
            'prettier': prettierPlugin,
        },
        rules: {
            ...tsPlugin.configs['recommended'].rules,
            ...prettierPlugin.configs['recommended'].rules,
            '@typescript-eslint/interface-name-prefix': 'off',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-expressions': ['error', {
                allowShortCircuit: true,
                allowTernary: true,
                allowTaggedTemplates: true
            }],
        },
    },
    {
        ignores: ['.eslintrc.js'],
    },
];
