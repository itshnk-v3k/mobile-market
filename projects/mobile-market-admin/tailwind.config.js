/**
 * Admin Tailwind config.
 *
 * The dark-theme design tokens (colors, fonts, screens, spacing) are the SINGLE
 * SOURCE OF TRUTH in the storefront's config — reused here verbatim so the admin
 * shares the exact palette (surface/border/text scales, green #3CBA6E accent,
 * Poppins/Montserrat). The admin may override/extend later for its own layout,
 * but it must not fork the color tokens.
 *
 * @type {import('tailwindcss').Config}
 */
const appConfig = require('../mobile-market-app/tailwind.config.js');

module.exports = {
  content: ['./src/**/*.{html,ts,scss}'],
  theme: appConfig.theme,
  plugins: [require('tailwindcss-animate')],
};
