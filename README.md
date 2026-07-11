# Mobile Market

A modern, mobile-first e-commerce storefront for consumer electronics (smartphones, laptops, tablets, headphones and accessories), built with Angular 21. It showcases a product catalogue with rich product cards, a **Favorites** list, and a **Compare** view that diffs product specifications side by side.

> The UI strings are in Russian; the codebase, identifiers and this document are in English.

**Tech stack:** Angular 21 (standalone components, signals, OnPush change detection) + Tailwind CSS 3 with a custom dark design system, plus a hand-built shared UI component library.

> ℹ️ Where this document describes *what a feature does*, the behavior was **inferred from component/service code, templates and naming** — the app currently runs against in-memory mock data (`src/app/core/mocks/`) rather than a live backend.

📚 **Detailed reference docs** (every file & package) live in [`DOCUMENTATION.md`](./DOCUMENTATION.md).

---

## 1. Project Overview

- **Name:** `mobile-market` (version `0.0.1`, private)
- **Purpose:** An online electronics marketplace front-end. Users browse products, add them to favorites, and compare up to four products of the same category by their technical specifications.
- **Description:** Single-page Angular application with a shared main layout (header + footer), three routed pages (Home, Favorites, Compare), and a comprehensive in-house UI component library. State for favorites/compare is persisted client-side in `localStorage` (with a 24h TTL) and synchronized across browser tabs via `BroadcastChannel`.

---

## 2. Tech Stack & Libraries

**Framework:** Angular `~21.2` (standalone-component architecture, signal-based reactivity).

### Runtime dependencies

| Package | Purpose |
| --- | --- |
| `@angular/core`, `common`, `forms`, `router`, `platform-browser`, `compiler` | Angular framework core, reactive forms, routing |
| `@angular/cdk` | Component Dev Kit — overlays (sheets/dropdowns), `BreakpointObserver` for responsive logic, portals |
| `class-variance-authority` (cva) | Type-safe variant styling for components (button/badge/etc.) |
| `clsx` | Conditional CSS class composition |
| `tailwind-merge` | De-duplicates/merges conflicting Tailwind classes (used by the `mergeClasses` util) |
| `tailwindcss-animate` | Animation utilities for Tailwind |
| `embla-carousel-angular` + `embla-carousel-autoplay` / `-class-names` / `-wheel-gestures` | Carousel/slider engine and plugins |
| `lucide-angular` | Icon set (icons registered via `LucideAngularModule.pick(...)`) |
| `libphonenumber-js` | Phone number parsing/validation (used by the phone input) |
| `ngx-mask` | Input masking directive (registered with `provideNgxMask()`) |
| `ng-otp-input` | One-time-password input control |
| `ngx-sonner` | Toast notifications (wrapped by `ToastService`) |
| `ngx-cookie-service` | Cookie read/write helper |
| `leaflet` | Interactive maps |
| `rxjs` | Reactive streams (interop with signals via `toSignal`) |
| `zone.js` | Angular zone-based change detection runtime |
| `tslib` | TypeScript runtime helpers |

### Notable devDependencies

| Package | Purpose |
| --- | --- |
| `@angular/build`, `@angular/cli`, `@angular/compiler-cli` | Build system & CLI (`@angular/build:application` builder) |
| `typescript` `~5.9` | TypeScript compiler |
| `eslint`, `typescript-eslint`, `angular-eslint` | Linting (TS + Angular templates) |
| `eslint-plugin-simple-import-sort` | Enforces sorted imports/exports |
| `eslint-plugin-unused-imports` | Flags/removes unused imports & vars |
| `prettier` + `prettier-plugin-tailwindcss` | Code formatting + Tailwind class ordering |
| `tailwindcss`, `postcss`, `autoprefixer` | Styling toolchain |
| `vitest` | Unit test runner (via `@angular/build:unit-test`) |
| `jsdom` | DOM environment for tests |
| `@types/node`, `@types/leaflet`, `ts-node` | Type definitions / TS execution |

---

## 3. Project Architecture

### Folder structure (`src/app`)

```text
src/app/
├── app.component.ts        # Root component (m-root) — hosts RouterOutlet + toast container
├── app.config.ts           # Application providers (bootstrap configuration)
├── app.routes.ts           # Route definitions (lazy-loaded pages)
├── core/                   # App-wide singletons & static data
│   ├── icons/icons.ts      # Curated Lucide icon set registered globally
│   └── mocks/              # In-memory demo data (products, countries)
├── layout/
│   └── main-layout/        # Shell: header + <router-outlet> + footer
├── features/               # Routed pages + page-specific components
│   ├── home/               # Landing page
│   ├── favorites/          # Favorites page (+ empty state)
│   ├── compare/            # Compare page (+ empty state)
│   └── components/         # Feature-level shared UI (header, footer, product card, cart sheet)
└── shared/                 # Cross-cutting reusable code
    ├── components/         # Generic UI component library (button, input, select, sheet, ...)
    ├── services/           # Stateful/business services (favorites, compare, toast, validation)
    ├── models/             # TypeScript interfaces/types (product model)
    └── utils/              # Helper functions (mergeClasses, generateId, ...)
```

### Architecture pattern

- **100% standalone components** — there are no `NgModule`s. Each component declares its own `imports`.
- **Signal-based state** — services expose state via `signal()` / `computed()`; components consume signals directly and use `ChangeDetectionStrategy.OnPush`.
- **Lazy loading** — feature pages are loaded with `loadComponent()` route definitions.
- **Path aliases** (from `tsconfig.json`): `@core/*`, `@shared/*`, `@features/*`, `@layout/*`, `@env/*`.
- **Selector prefix:** `m` (e.g. `m-button`, `m-card-product`); attribute directives use the `m` prefix in camelCase (e.g. `mTooltip`).

### Bootstrapping

The app bootstraps via `appConfig` (`src/app/app.config.ts`), which provides:

- `provideZoneChangeDetection({ eventCoalescing: true })`
- `provideRouter(routes, withComponentInputBinding(), withViewTransitions())` — route params bind to component inputs, with the native View Transitions API enabled
- `provideHttpClient(withInterceptorsFromDi())`
- `provideNgxMask()` — input mask support
- `importProvidersFrom(LucideAngularModule.pick(APP_ICONS))` — registers the curated icon set

---

## 4. Features

All pages share the `MainLayoutComponent` shell where applicable (the Home route is nested under it).

### Home (`/`) — `HomeComponent` · `m-home`
A landing/demo page that renders product cards from `MOCK_PRODUCTS` and also serves as a **showcase of the shared component library**. It builds a large `FormGroup` (email, password, phone, brand/storage/color selects, checkboxes, switches, textarea, etc.) demonstrating inputs, selects, phone input, radios, switches, badges, tags, tooltips and loaders. *(Inferred: the form has no submit handler — it appears to be a component playground/demo.)*
**Key components:** `CardProductComponent`, plus most of the shared library (`InputComponent`, `SelectComponent`, `PhoneInputComponent`, `ButtonComponent`, etc.).

### Favorites (`/favorites`) — `FavoritesComponent` · `m-favorites`
Displays products the user has favorited (read from `FavoritesService`), with **category filter chips** (`all` + the categories present among favorites) and a "clear all" action. Shows `FavoritesEmptyComponent` when empty.
**Key components:** `CardProductComponent`, `FavoritesEmptyComponent`, `ButtonComponent`.

### Compare (`/compare`) — `CompareComponent` · `m-compare`
Side-by-side comparison of products held in `CompareService` (max 4, same category). It aggregates each product's `specs` into grouped rows and offers three view modes: **All characteristics / Only similarities / Only differences** (differences detected by unique value count per row). Uses `BreakpointObserver` to switch between desktop and mobile (accordion) layouts. Shows `CompareEmptyComponent` when empty.
**Key components:** `CardProductComponent`, `AccordionComponent`/`AccordionItemComponent`, `RadioComponent`, `BadgeComponent`, `CompareEmptyComponent`.

### Feature-level components (`features/components/`)
- **Header** (`m-header`) — top nav with catalog/sale/about links, scroll-aware styling (`data-scrolled`), mobile menu toggle, and a cart button that opens the **Cart Sheet** via `SheetService`. Tracks `cartCount` / `wishlistCount` signals.
- **Footer** (`m-footer`) — site footer.
- **Cart Sheet** (`cart-sheet`) — slide-over cart panel opened as a CDK overlay sheet.
- **Card Product** (`m-card-product`) — the primary product tile (see below).
- **Card Product Skeleton** — loading placeholder for the product card.

### Card Product behavior
`CardProductComponent` takes a required `product` input (plus `loading`, `adaptive`), computes `discount`/`savings` from `price`/`oldPrice`, and emits `addToCart`, `favoriteChange`, `compareChange`. Toggling favorite/compare calls the respective services and raises toasts; compare enforces the same-category and 4-item limits, surfacing error toasts on `category-mismatch` / `limit-reached`.

---

## 5. Shared Component Library (`src/app/shared/components/`)

| Component | Selector | Description |
| --- | --- | --- |
| Accordion | `m-accordion` / `m-accordion-item` | Collapsible content panels (used by Compare on mobile) |
| Badge | `m-badge` | Status/label badge with variants (e.g. `new`, `hot`) |
| Button | `button[mButton]`, `a[mButton]` | Variant-styled button/link directive-component |
| Button Loader | `m-btn-loader` | Inline spinner shown inside a busy button |
| Checkbox | `m-checkbox` | Form-control checkbox |
| Input | `m-input` | Text input with label/error support (ControlValueAccessor) |
| Phone Input | `m-phone-input` | International phone input (country code + `libphonenumber-js` validation) |
| Radio / Radio Group | `m-radio` / `m-radio-group` | Single-choice radio control and group wrapper |
| Select | `m-select` | Custom dropdown select (CDK overlay via `SelectDropdownService`) |
| Sheet | `m-sheet` | Slide-over/bottom drawer container rendered through `SheetService` |
| Skeleton | `m-skeleton` | Generic loading placeholder block |
| Switch | `m-switch` | Toggle switch control |
| Tag | `m-tag` | Compact spec/label pill |
| Textarea | `m-textarea` | Multi-line text input |
| Tooltip | `m-tooltip` + `[mTooltip]` | Tooltip component and directive to attach it |
| Loader | `m-loader` | Standalone loading spinner |

---

## 6. Services

| Service | Location | Responsibility |
| --- | --- | --- |
| `FavoritesService` | `shared/services/favorites/` | Manages the favorites collection as a signal-backed `Record`. Persists to `localStorage` (`mm:favorites`) with a 24h TTL, exposes `favorites`/`count`/`ids` computed signals, `toggle`/`remove`/`clear`, and syncs across tabs via `BroadcastChannel`. |
| `CompareService` | `shared/services/compare/` | Manages the compare collection (max **4** items, all of one category). Persists to `localStorage` (`mm:compare`) with 24h TTL + cross-tab sync. `toggle()` returns a discriminated result (`added` / `removed` / `category-mismatch` / `limit-reached`). |
| `ToastService` | `shared/services/toast/` | Thin wrapper over `ngx-sonner` exposing `success` / `error` / `warning` / `info`. |
| `ValidationErrorMessagesService` | `shared/services/validation-error-messages.service.ts/` | Maps Angular form-control validation errors (required, email, min/max length, pattern, mask, phone, password match, …) to localized (Russian) messages. |
| `SheetService` | `shared/components/sheet/` | Opens components as CDK-overlay slide-over sheets (`left`/`right`/`bottom`), injecting `SHEET_DATA` and returning a `SheetRef`. |
| `SelectDropdownService` | `shared/components/select/` | Manages the CDK overlay positioning/lifecycle for the custom `m-select` dropdown. |

---

## 7. Data Models

Defined in `src/app/shared/models/product.model.ts`.

```ts
type ProductCategory =
  'smartphones' | 'laptops' | 'tablets' | 'headphones' | 'accessories';

interface ProductTag  { label: string; }

interface ProductSpec {
  key: string;
  label: string;
  value: string;
  group?: string;   // groups specs in the compare view
}

interface ProductBadge {
  variant: BadgeVariant;   // from BadgeComponent
  label: string;
  icon?: string;
}

interface ProductCardData {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: ProductCategory;
  image?: string;
  price: number;
  oldPrice?: number;
  cashback?: number;
  credit?: string;
  badges?: ProductBadge[];
  tags?: ProductTag[];
  specs?: ProductSpec[];
  inStock: boolean;
}
```

Also exported: `PRODUCT_CATEGORY_LABELS` — a `Record<ProductCategory, string>` mapping each category to its Russian display label.

A `Country` interface (`{ code, name, flag, phoneCode }`) backs the phone input's country selector (`core/mocks/countries.mock.ts`).

---

## 8. Routing

Defined in `src/app/app.routes.ts`:

| Path | Component | Notes |
| --- | --- | --- |
| `''` | `MainLayoutComponent` → child `''` → `HomeComponent` | Home rendered inside the main layout shell (lazy-loaded) |
| `favorites` | `FavoritesComponent` | Lazy-loaded (`loadComponent`) |
| `compare` | `CompareComponent` | Lazy-loaded (`loadComponent`) |
| `**` | redirect → `''` | Wildcard fallback to Home |

Router is configured with `withComponentInputBinding()` and `withViewTransitions()`.

> Note: the header links to routes such as `/catalog`, `/new`, `/sale`, `/about` that are **not yet defined** in the route table (they currently fall through to the wildcard redirect).

---

## 9. Styling Approach

- **Framework:** Tailwind CSS `3.4` (with `tailwindcss-animate`), authored in SCSS (`inlineStyleLanguage: scss`). Class composition is handled at runtime via the `mergeClasses()` util (`clsx` + `tailwind-merge`) and at format time via `prettier-plugin-tailwindcss`.
- **Global styles:** `src/styles.scss` imports `assets/styles/_toast.scss` and `assets/styles/_input.scss`, pulls in Tailwind layers, and defines a base layer (dark background, custom scrollbars, typography reset, selection color, icon sizing).
- **Design tokens / theming** (`tailwind.config.js`):
  - **Dark theme** with semantic color scales: `green`/`success`, `gray`, `surface`, `border` (incl. `border.active` / `border.focus`), `text` (incl. `text.accent` / `text.inverse`), plus `error`, `warning`, `info`.
  - **Fonts:** `Poppins` (headings) and `Montserrat` (body) via `fontFamily` tokens.
  - **Layout tokens:** custom responsive breakpoints (`xs`–`3xl`), `maxWidth.container = 1440px`, and a `z-index` scale `1`–`9`.
- **Component config:** `components.json` (shadcn-style) points tooling at `src/styles.scss`, `baseColor: neutral`, CSS variables enabled, with aliases `components → src/app/shared/components` and `utils → src/app/shared/utils`.

---

## 10. Environment Configuration

Three environment files in `src/environments/`, selected via Angular `fileReplacements`:

| File | Used by | `production` | `baseURL` | `apiURL` |
| --- | --- | --- | --- | --- |
| `environment.ts` | default (dev fallback) | `false` | `http://localhost:3000` | `http://localhost:3000/api` |
| `environment.dev.ts` | `development` build | `false` | `http://localhost:3000` | `http://localhost:3000/api` |
| `environment.prod.ts` | `production` build | `true` | `https://api.mobile-market.com` | `https://api.mobile-market.com/api` |

**Variables:** `production` (flag), `baseURL` (site origin), `apiURL` (REST API base). Import via the `@env/*` alias.

---

## 11. Development Setup

### Prerequisites

- **Node.js** — a current LTS (no explicit `engines` field; `@types/node` 25 suggests a recent Node). Use Node ≥ 20.
- **npm** (declared package manager in `components.json`).
- **Angular CLI 21** (`@angular/cli` is included as a devDependency; use `npx ng …` or a global install).

### Install

```bash
npm install
```

### Available npm scripts

| Script | Command | Description |
| --- | --- | --- |
| `start` | `ng serve --configuration development --host 0.0.0.0` | Run the dev server (development config, exposed on all interfaces) |
| `start:prod` | `ng build --configuration production && npx serve dist/mobile-market` | Production build, then serve the static output |
| `build` | `ng build --configuration production` | Production build → `dist/mobile-market` |
| `build:dev` | `ng build --configuration development` | Development build |
| `watch` | `ng build --watch --configuration development` | Rebuild on file changes |
| `test` | `ng test` | Run unit tests (Vitest) |
| `lint` | `ng lint` | Run ESLint over `src/**/*.ts` and `*.html` |
| `lint:fix` | `ng lint --fix` | Lint and auto-fix |
| `ng` | `ng` | Raw Angular CLI passthrough |

### Run the dev server

```bash
npm start
# then open the served URL (Angular dev server, default port 4200)
```

> The default build configuration is `production`; `npm start` explicitly selects `development`.

---

## 12. Code Quality Tools

### ESLint (`eslint.config.js`, flat config)

Extends `@eslint/js` recommended, `typescript-eslint` recommended + stylistic, and `angular-eslint` TS-recommended; HTML templates use `angular-eslint` template recommended + accessibility rules. Notable rules:
- `unused-imports/no-unused-imports: error`; unused vars warn (ignoring `_`-prefixed).
- `simple-import-sort/imports|exports: warn` — enforced import ordering.
- Angular selectors: components must be **element**, `kebab-case`, prefix `m`; directives must be **attribute**, `camelCase`, prefix `m`.
- `@typescript-eslint/consistent-type-imports: error` (prefer `import type`).
- `@typescript-eslint/no-explicit-any: warn`; `no-empty-function` (arrow functions allowed).
- Template a11y `label-has-associated-control` is disabled.

### Prettier (`.prettierrc`)

`printWidth: 100`, 2-space indent, single quotes, semicolons, `trailingComma: es5`, `arrowParens: avoid`, `bracketSameLine: true`, HTML whitespace-insensitive. Uses `prettier-plugin-tailwindcss` for class sorting; HTML parsed with the `angular` parser.

### TypeScript (`tsconfig.json`)

Strict mode is on, with additional strictness:
- `strict: true`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `isolatedModules`, `importHelpers`.
- Target **ES2022**, `module: preserve`, `moduleResolution: bundler`.
- Path aliases: `@core/*`, `@shared/*`, `@features/*`, `@layout/*`, `@env/*`.
- **Angular compiler:** `strictTemplates`, `strictInjectionParameters`, `strictInputAccessModifiers` enabled.

---

*Generated from analysis of the project source. Sections describing runtime behavior were inferred from component, service, and template code; the app currently uses mock data and has no wired backend.*
