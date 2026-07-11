/*
 * Development environment — used by `ng serve` / `npm run dev:admin`.
 */
import type { Environment } from './environment.model';

export const environment: Environment = {
  name: 'development',
  production: false,
  // Same-origin path; the dev-server proxy forwards /api → localhost:5000.
  apiBaseUrl: '/api',
};
