/*
 * EN: Production environment — optimized build against the production API.
 * RU: Продакшен-окружение — оптимизированная сборка с продакшен-API.
 */
import type { Environment } from './environment.model';

/**
 * Production environment. Update `apiBaseUrl` once the backend is deployed, and
 * keep `useMockData: false` so the storefront reads real endpoints.
 */
export const environment: Environment = {
  name: 'production',
  production: true,
  apiBaseUrl: 'https://api.mobile-market.md',
  features: {
    useMockData: false,
    cookieBanner: true,
    debug: false,
  },
  defaultLanguage: 'ru',
};
