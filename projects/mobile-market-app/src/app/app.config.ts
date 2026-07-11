import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import type { ApplicationConfig } from '@angular/core';
import { provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { APP_ICONS } from '@core/icons/icons';
import { provideLucideIcons } from '@lucide/angular';
import { provideNgxMask } from 'ngx-mask';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideHttpClient(withXhr(), withInterceptorsFromDi()),
    provideNgxMask(),
    provideLucideIcons(...Object.values(APP_ICONS)),
  ],
};
