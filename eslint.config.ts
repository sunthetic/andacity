import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { globalIgnores } from "eslint/config";
import { qwikEslint9Plugin } from "eslint-plugin-qwik";

const compatibleJsRecommended = {
  ...js.configs.recommended,
  rules: Object.fromEntries(
    Object.entries(js.configs.recommended.rules ?? {}).filter(
      ([ruleName]) => ruleName !== "preserve-caught-error",
    ),
  ),
};

const ignores = [
  "**/*.log",
  "**/.DS_Store",
  "**/*.",
  ".vscode/settings.json",
  "**/.history",
  "**/.yarn",
  "**/bazel-*",
  "**/bazel-bin",
  "**/bazel-out",
  "**/bazel-qwik",
  "**/bazel-testlogs",
  "**/dist",
  "**/dist-dev",
  "**/lib",
  "**/lib-types",
  "**/etc",
  "**/external",
  "**/node_modules",
  "**/temp",
  "**/tsc-out",
  "**/tsdoc-metadata.json",
  "**/target",
  "**/output",
  "**/rollup.config.js",
  "**/build",
  "**/.cache",
  "**/.vscode",
  "**/.rollup.cache",
  "**/dist",
  "**/tsconfig.tsbuildinfo",
  "**/vite.config.ts",
  "**/*.spec.tsx",
  "**/*.spec.ts",
  "**/.netlify",
  "**/pnpm-lock.yaml",
  "**/package-lock.json",
  "**/yarn.lock",
  "**/server",
  "eslint.config.js",
];

export default tseslint.config(
  globalIgnores(ignores),
  compatibleJsRecommended,
  tseslint.configs.recommended,
  qwikEslint9Plugin.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
        ...globals.serviceworker,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "qwik/valid-lexical-scope": "off",
    },
  },
);
