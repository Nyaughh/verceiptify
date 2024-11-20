/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions} */
const config = {
  plugins: ["prettier-plugin-tailwindcss"],
  tabWidth: 4,
  printWidth: 120,
  singleQuote: true,
  semi: false,
  trailingComma: "none"
};

export default config;
