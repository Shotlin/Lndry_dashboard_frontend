import nextConfig from "eslint-config-next"

const eslintConfig = [
  ...nextConfig,
  {
    ignores: [".claude/**", "playwright-report/**", "test-results/**"],
  },
]

export default eslintConfig
