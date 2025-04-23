import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import stylistic from "@stylistic/eslint-plugin";
import importPlugin from "eslint-plugin-import";
import nPlugin from "eslint-plugin-n";
import promisePlugin from "eslint-plugin-promise";
import tsEslintPlugin from "@typescript-eslint/eslint-plugin";
import reactPlugin from "eslint-plugin-react";
import tsParser from '@typescript-eslint/parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
	baseDirectory: __dirname,
});

const eslintConfig = [
	...compat.extends(
		"next/core-web-vitals",
		"next/typescript",
		"prettier",
		"plugin:import/typescript",
		"plugin:import/errors",
		"plugin:import/warnings",
		"plugin:import/typescript",
		"plugin:promise/recommended",
		"plugin:n/recommended",
		"plugin:react/recommended",
		"plugin:react/jsx-runtime",
		"plugin:react-hooks/recommended",
	),
	{
		plugins: {
			"@stylistic": stylistic,
			import: importPlugin,
			n: nPlugin,
			promise: promisePlugin,
			"@typescript-eslint": tsEslintPlugin,
			react: reactPlugin
		},
		languageOptions: {
			// Only use the TypeScript parser for source files, not for config files
			parser: tsParser,
			parserOptions: {
				project: "./tsconfig.json",
				ecmaVersion: "latest",
				sourceType: "module",
				ecmaFeatures: { jsx: true }
			}
		},
		settings: {
			react: { version: "detect" },
			"import/resolver": {
				typescript: { project: "./tsconfig.json" }
			}
		},
		rules: {
			"@typescript-eslint/strict-boolean-expressions": "error",
			semi: ["error", "never"],
			"no-extra-semi": "error",
			quotes: ["error", "single"],
			"@typescript-eslint/no-unused-vars": "warn",
			"no-tabs": "off",
			indent: ["error", "tab", { SwitchCase: 1 }],
			"react/jsx-curly-brace-presence": ["error", { props: "never", children: "always" }],
			"object-curly-spacing": ["error", "always"],
			"array-bracket-spacing": ["error", "never"],
			"import/export": "off",
			"import/first": "error",
			"import/order": [
				"error",
				{
					alphabetize: { order: "asc", caseInsensitive: true },
					groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
					"newlines-between": "always"
				}
			],
			"import/newline-after-import": "error",
			"import/no-duplicates": "error",
			"import/no-unresolved": "error",
			"import/no-named-as-default": "off",
			"import/no-named-as-default-member": "off",
			"import/no-extraneous-dependencies": "off",
			"import/no-mutable-exports": "error",
			"import/no-amd": "error",
			"import/no-commonjs": "off",
			"import/no-nodejs-modules": "off",
			"import/no-webpack-loader-syntax": "error",
			"import/no-anonymous-default-export": "off",
			"import/namespace": "off",
			"import/default": "off",
			"import/no-named-default": "off",
			"import/no-cycle": "off",
			"import/no-self-import": "error",
			"import/no-useless-path-segments": "error",
			"import/no-relative-parent-imports": "off",
			"import/no-unused-modules": "off",
			"import/no-import-module-exports": "off",
			"import/no-internal-modules": "off",
			"import/no-unassigned-import": "off",
			"import/no-absolute-path": "error",
			"import/extensions": "off",
			"import/prefer-default-export": "off",
			"import/group-exports": "off",
			"import/dynamic-import-chunkname": "off",
			"generator-star-spacing": ["error", { before: true, after: false }],
			"key-spacing": ["error", { beforeColon: false, afterColon: true }],
			"space-before-function-paren": ["error", "always"],
			"brace-style": ["error", "1tbs", { allowSingleLine: true }],
			"no-multi-spaces": "error",
			"block-spacing": ["error", "always"],
			"space-in-parens": ["error", "never"],
			"comma-dangle": ["error", "never"],
			"lines-between-class-members": ["error", "always", { exceptAfterSingleLine: true }],
			"padded-blocks": ["error", "never"],
			"no-trailing-spaces": "error",
			"react/jsx-filename-extension": ["error", { extensions: [".tsx"] }],
			"n/no-missing-import": "off",
			"spaced-comment": ["error", "always"],
			"no-multiple-empty-lines": ["error", { max: 1, maxEOF: 1 }],
			"curly": ["error", "all"],
		}
	}
];

export default eslintConfig;
