import js from "@eslint/js";
import globals from "globals";

export default [
    js.configs.recommended,
    {
        ignores: ["eslint.config.mjs"],
    },
    {
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "commonjs",
            globals: {
                ...globals.node,
            }
        },
        rules: {
            "no-unused-vars": "warn",
            "no-undef": "warn",
            "no-console": "off"
        }
    },

    {
        files: ["public/**/*.js"],
        languageOptions: {
            globals: {
                ...globals.browser,
                axios: "readonly"
            }
        }
    },

    {
        files: ["tests/**/*.test.js"],
        languageOptions: {
            globals: {
                ...globals.jest
            }
        }
    }
];