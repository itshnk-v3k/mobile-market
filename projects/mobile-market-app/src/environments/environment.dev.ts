/*
 * EN: Development environment — used by `ng serve` / `npm run dev:app`.
 * RU: Окружение разработки — используется `ng serve` / `npm run dev:app`.
 */
import type { Environment } from './environment.model';

export const environment: Environment = {
  name: 'development',
  production: false,
  // Same origin; the dev-server proxy (proxy.conf.json) forwards /api → localhost:5000.
  apiBaseUrl: '',
  features: {
    useMockData: true,
    cookieBanner: true,
    debug: true,
  },
  defaultLanguage: 'ru',
};
