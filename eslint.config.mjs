import { fixupConfigRules } from '@eslint/compat';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import { defineConfig } from 'eslint/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default defineConfig([
  {
    extends: fixupConfigRules(compat.extends('@react-native', 'prettier')),
    plugins: { prettier },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'prettier/prettier': 'error',
    },
  },
  // Restrict native component imports in consumer code only.
  // src/ internals (SmileIDPortal, wrappers) are legitimately allowed to
  // import native components — the rule must not apply to them.
  {
    files: ['example/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/BiometricKycViewNativeComponent'],
              message: "Import BiometricKycView from 'rn-wrap' instead.",
            },
            {
              group: ['**/SmartSelfieEnrollmentViewNativeComponent'],
              message: "Import SmartSelfieEnrollmentView from 'rn-wrap' instead.",
            },
            {
              group: ['**/SmartSelfieAuthenticationViewNativeComponent'],
              message: "Import SmartSelfieAuthenticationView from 'rn-wrap' instead.",
            },
            {
              group: ['**/DocumentVerificationViewNativeComponent'],
              message: "Import DocumentVerificationView from 'rn-wrap' instead.",
            },
          ],
        },
      ],
    },
  },
  {
    ignores: ['node_modules/', 'lib/'],
  },
]);
