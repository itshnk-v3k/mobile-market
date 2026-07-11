/*
 * EN: Type contract for the storefront's environment configuration files
 *     (API base URL, feature flags, default language) — the seam to the backend.
 * RU: Типовой контракт для файлов окружения витрины (базовый URL API, фичефлаги,
 *     язык по умолчанию) — стык с бэкендом.
 */

/**
 * Shape of an environment configuration.
 *
 * Every concrete `environment.*.ts` must satisfy this interface, so adding a new
 * environment (or a new config value) is type-checked across the whole app.
 */
export interface Environment {
  /** Human-readable environment name (shown in diagnostics / debug UI). */
  readonly name: 'development' | 'production';

  /** Angular production build flag (enables prod-only optimizations/logging). */
  readonly production: boolean;

  /**
   * Base URL for all backend HTTP calls, prepended to relative request URLs by
   * the API base-URL interceptor. Empty string = same origin: in dev the
   * dev-server proxy (proxy.conf.json) forwards `/api` → the NestJS backend on
   * localhost:5000; in prod it is the absolute API origin.
   */
  readonly apiBaseUrl: string;

  /** Per-environment feature flags. Add flags here as features are gated. */
  readonly features: {
    /** Serve catalog data from local mock JSON (src/app/core/mocks) instead of HTTP. */
    readonly useMockData: boolean;
    /** Show the cookie-consent banner. */
    readonly cookieBanner: boolean;
    /** Enable verbose console diagnostics. */
    readonly debug: boolean;
  };

  /** Default UI language before the user makes a choice (Moldovan market: RU/EN). */
  readonly defaultLanguage: 'en' | 'ru';
}
