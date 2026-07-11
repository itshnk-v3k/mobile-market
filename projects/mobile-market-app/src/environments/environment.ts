/*
 * EN: Default (fallback) environment, mirroring development. Swapped per build
 *     via fileReplacements in angular.json.
 * RU: Окружение по умолчанию (как development). Подменяется при сборке через
 *     fileReplacements в angular.json.
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
