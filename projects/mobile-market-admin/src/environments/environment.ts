/*
 * Default (development) environment — used by `ng serve`. The Angular builder
 * swaps this file per configuration via fileReplacements in angular.json.
 */
import type { Environment } from './environment.model';

export const environment: Environment = {
  name: 'development',
  production: false,
  // Same-origin path; the dev-server proxy forwards /api → localhost:5000.
  apiBaseUrl: '/api',
};
