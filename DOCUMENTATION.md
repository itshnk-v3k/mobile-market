# Mobile Market — Documentation

Reference documentation for the **Mobile Market** front-end: a mobile-first Angular 21
e-commerce storefront for consumer electronics (smartphones, laptops, tablets, headphones,
accessories). UI strings are Russian; code and docs are English.

> ℹ️ The app currently runs against in-memory mock data (`src/app/core/mocks/`); there is
> no wired backend. Behavioral notes below are derived from the actual component, service,
> and template code.

## Contents

1. [Quick start & at a glance](#1-quick-start--at-a-glance)
2. [Architecture](#2-architecture)
3. [Feature Pages & App Shell](#3-feature-pages--app-shell)
4. [Shared Component Library](#4-shared-component-library)
5. [Services, Models, Core & Utils](#5-services-models-core--utils)
6. [Packages & Build Config](#6-packages--build-config)

---

## 1. Quick start & at a glance

```bash
npm install
npm start          # dev server (Angular, default port 4200)
npm run build      # production build → dist/mobile-market
npm test           # unit tests (Vitest)
npm run lint       # ESLint over src/**/*.{ts,html}
```

- **Framework:** Angular `~21.2`, 100% standalone components, signal-based state, `OnPush`.
- **Selector prefix:** `m` (elements `m-*`, attribute directives `mCamelCase`).
- **Path aliases:** `@core/*`, `@shared/*`, `@features/*`, `@layout/*`, `@env/*`.
- **Styling:** Tailwind CSS 3 (dark design system) authored in SCSS; runtime class merge via
  `mergeClasses()` (`clsx` + `tailwind-merge`).
- **Client state:** `FavoritesService` & `CompareService` persist to `localStorage` (24h TTL)
  and sync across tabs via `BroadcastChannel`.
- **Routes:** `/` (Home, inside layout shell), `/favorites`, `/compare`; wildcard → `/`.

---

## 2. Architecture

### Folder structure (`src/app`)

```text
src/app/
├── app.component.ts         # Root component (m-root) — RouterOutlet + toast container
├── app.config.ts            # Application providers (bootstrap configuration)
├── app.routes.ts            # Route definitions (lazy-loaded pages)
├── core/                    # App-wide singletons & static data
│   ├── icons/icons.ts       # Curated Lucide icon set (APP_ICONS, 43 icons)
│   └── mocks/               # In-memory demo data (products, countries)
├── layout/
│   └── main-layout/         # Shell: header + <router-outlet> + footer
├── features/                # Routed pages + page-specific components
│   ├── home/                # Landing / component-showcase page
│   ├── favorites/           # Favorites page (+ empty state)
│   ├── compare/             # Compare page (+ empty state)
│   └── components/          # Feature-level UI: header, footer, card-product, cart-sheet
└── shared/                  # Cross-cutting reusable code
    ├── components/          # Generic UI component library (button, input, select, sheet, …)
    ├── services/            # Stateful/business services (favorites, compare, toast, validation)
    ├── models/              # TypeScript interfaces/types (product model)
    └── utils/               # Helper functions (mergeClasses, generateId, transform, …)
```

Every file is documented per section below ([features](#3-feature-pages--app-shell),
[components](#4-shared-component-library), [services/models/core](#5-services-models-core--utils)).

### Patterns

- **100% standalone components** — no `NgModule`s. Each component declares its own `imports`.
- **Signal-based state** — services expose state via `signal()` / `computed()`; components
  consume signals directly and use `ChangeDetectionStrategy.OnPush`. Form controls are wired
  with the modern `input()` / `output()` / `model()` APIs and `ControlValueAccessor`.
- **Lazy loading** — every feature page is loaded via `loadComponent()`.
- **Path aliases** (from `tsconfig.json`): `@core/*`, `@shared/*`, `@features/*`, `@layout/*`,
  `@env/*`.
- **Selector prefix `m`** — elements use `m-*` (kebab-case), attribute directives use `m`
  camelCase (e.g. `mTooltip`, `mButton`). Enforced by ESLint.

### Bootstrapping

Entry point `src/main.ts`:

```ts
bootstrapApplication(App, appConfig).catch(err => console.error(err));
```

`appConfig` (`src/app/app.config.ts`) provides:

- `provideZoneChangeDetection({ eventCoalescing: true })`
- `provideRouter(routes, withComponentInputBinding(), withViewTransitions())` — route params
  bind to component inputs; native View Transitions enabled.
- `provideHttpClient(withInterceptorsFromDi())`
- `provideNgxMask()` — input mask support.
- `importProvidersFrom(LucideAngularModule.pick(APP_ICONS))` — registers the curated icon set.

### Routing

Defined in `src/app/app.routes.ts`:

| Path | Component | Notes |
| --- | --- | --- |
| `''` | `MainLayoutComponent` → child `''` → `HomeComponent` | Home rendered inside the layout shell (lazy) |
| `favorites` | `FavoritesComponent` | Lazy-loaded, **outside** the layout shell |
| `compare` | `CompareComponent` | Lazy-loaded, **outside** the layout shell |
| `**` | redirect → `''` | Wildcard fallback to Home |

> Only the home route nests inside `MainLayoutComponent`; `favorites` and `compare` are
> sibling top-level routes and therefore render without the header/footer shell. Header links
> to `/catalog`, `/new`, `/sale`, `/about` are **not yet defined** and fall through to the
> wildcard redirect.

### Styling

- **Tailwind CSS 3.4** (+ `tailwindcss-animate`), authored in SCSS (`inlineStyleLanguage: scss`).
  Class composition is resolved at runtime via `mergeClasses()` (`clsx` + `tailwind-merge`) and
  at format time via `prettier-plugin-tailwindcss`.
- **Global styles:** `src/styles.scss` imports `assets/styles/_toast.scss` and
  `assets/styles/_input.scss`, pulls in Tailwind layers, and defines the dark base layer
  (background, custom scrollbars, typography reset, selection color, icon sizing).
- **Design tokens** (`tailwind.config.js`): dark theme with semantic scales (`green`/`success`,
  `gray`, `surface`, `border` incl. `border.active`/`border.focus`, `text` incl. `text.accent`/
  `text.inverse`, `error`, `warning`, `info`); fonts `Poppins` (headings) + `Montserrat` (body);
  custom breakpoints `xs`–`3xl`, `maxWidth.container = 1440px`, `z-index` scale `1`–`9`.
- **`components.json`** (shadcn-style): points tooling at `src/styles.scss`, `baseColor: neutral`,
  CSS variables enabled, aliases `components → src/app/shared/components`,
  `utils → src/app/shared/utils`.

See [Packages & Build Config](#6-packages--build-config) for the full build/config reference.

### Environments

Three files in `src/environments/`, selected via Angular `fileReplacements`:

| File | Used by | `production` | `baseURL` | `apiURL` |
| --- | --- | --- | --- | --- |
| `environment.ts` | default (dev fallback) | `false` | `http://localhost:3000` | `…/api` |
| `environment.dev.ts` | `development` build | `false` | `http://localhost:3000` | `…/api` |
| `environment.prod.ts` | `production` build | `true` | `https://api.mobile-market.com` | `…/api` |

Import via the `@env/*` alias.

---

## 3. Feature Pages & App Shell

Routed pages (`features/`), feature-level components (`features/components/`), the layout
shell (`layout/`), and the application root/config/routes. All components use
`ChangeDetectionStrategy.OnPush` unless noted.

### Routed pages

#### HomeComponent · `m-home`

- **File:** `src/app/features/home/home.component.ts`
- **Purpose:** Root-route demo / kitchen-sink page. Showcases the shared UI library (buttons,
  form controls, badges, tags, tooltips) and three product-card grid layouts (single cards,
  adaptive catalog grid, fixed-width slider).
- **State:**
  - `form: FormGroup` — controls: `email` (required, email), `password` (required, minLength 8),
    `phone` (required), `remember`, `agree` (requiredTrue), `brand`, `storage`, `color`,
    `inStock`, `notifications`, `message` (required, minLength 10).
  - `colors` — static option list (Чёрный / Белый / Синий).
  - `products = MOCK_PRODUCTS`, `product = MOCK_PRODUCTS[0]`.
  - `loading = false` — toggles a block of skeleton cards.
- **Behavior:** `onAddToCart(product)` `console.log`s the product name (demo). The form has no
  submit handler — it is a component playground.

#### FavoritesComponent · `m-favorites`

- **File:** `src/app/features/favorites/favorites.component.ts`
- **Purpose:** Lists favorited products with per-category filter chips and a clear-all action;
  delegates the empty state to `FavoritesEmptyComponent`.
- **State & computed:**
  - `filter = signal<CategoryFilter>('all')` — active filter (`ProductCategory | 'all'`).
  - `favorites` / `count` — from `FavoritesService`.
  - `hasFavorites = computed(() => count() > 0)`.
  - `availableCategories` — unique categories present among favorites.
  - `filteredFavorites` — favorites filtered by the active `filter`.
  - `categoryLabel = PRODUCT_CATEGORY_LABELS`.
- **Injects:** `FavoritesService`.
- **Behavior:** `setFilter(value)`; `clearAll()` clears the service and resets filter to `'all'`.
  The filter toolbar renders only when more than one category is available.

#### FavoritesEmptyComponent · `m-favorites-empty`

- **File:** `src/app/features/favorites/favorites-empty/favorites-empty.component.ts`
- **Purpose:** Empty-state placeholder (icon, message, CTA link back to catalog/home).
- Imports `ButtonComponent`, `RouterLink`, `LucideAngularModule`. No state/services.

#### CompareComponent · `m-compare`

- **File:** `src/app/features/compare/compare.component.ts`
- **Purpose:** Builds a grouped spec table across the products in the compare list, with
  all/common/diff view modes and a responsive desktop-table vs. mobile-accordion layout.
  Delegates the empty state to `CompareEmptyComponent`.
- **State & computed:**
  - `isDesktop = toSignal(BreakpointObserver.observe('(min-width: 1024px)') …)`,
    `initialValue: false`.
  - `mode = signal<CompareMode>('all')` — `'all' | 'common' | 'diff'`.
  - `items` / `count` / `maxItems` — from `CompareService`.
  - `modeOptions: ModeOption[]` — radio options for the three modes.
  - `categoryLabel` — label of `compareService.activeCategory()` or `null`.
  - `allGroups: CompareGroup[]` — assembles ordered spec groups/rows from each product's `specs`
    (grouping by `spec.group ?? 'Характеристики'`, preserving first-seen order, filling missing
    values with `'—'`, flagging `hasDifference` when a row's value-set size > 1).
  - `filteredGroups` — filters `allGroups` by mode (`diff` keeps differing rows, `common` keeps
    matching rows; empty groups dropped).
  - `defaultGroupValues` — group names, used as default-open accordion values.
- **Local types:** `CompareMode`, `CompareRow`, `CompareGroup`, `ModeOption`; const
  `DEFAULT_GROUP = 'Характеристики'`.
- **Injects:** `CompareService`, `BreakpointObserver`.
- **Behavior:** `setMode(mode)`; `clearAll()`. `trackProduct`/`trackGroup`/`trackRow` trackBy
  helpers (by `id`/`name`/`key`). Desktop renders sidebar + inline spec tables; mobile renders
  accordions (`type="multiple"`). Shows an "add another product" hint when `count() === 1` and
  mode-specific empty messages when no rows match.

#### CompareEmptyComponent · `m-compare-empty`

- **File:** `src/app/features/compare/compare-empty/compare-empty.component.ts`
- **Purpose:** Empty-state placeholder for an empty compare list.
- Imports `ButtonComponent`, `RouterLink`, `LucideAngularModule`. No state/services.

### Feature-level components (`features/components/`)

#### HeaderComponent · `m-header`

- **File:** `src/app/features/components/header/header.component.ts`
- **Purpose:** Top app bar — logo, primary nav, action icons (search, wishlist, cart), mobile
  burger menu; opens the cart side-sheet.
- **State:**
  - `navItems = NAV_ITEMS` — Каталог `/catalog`, Новинки `/new`, Акции `/sale`, О нас `/about`.
  - `scrolled = signal(false)` — reflected to host `data-scrolled` (`|| null`).
  - `mobileMenuOpen = signal(false)`.
  - `cartCount = signal(0)`, `wishlistCount = signal(0)` — badges display `99+` above 99.
- **Injects:** `SheetService`, `DestroyRef`.
- **Behavior:** In the constructor, `afterNextRender` registers a passive `window` scroll
  listener (sets `scrolled` when `scrollY > 10`), cleaned up via `destroyRef.onDestroy`.
  `openCart()` opens `CartSheetComponent` on the right via `SheetService`.
  `toggleMobileMenu()` / `closeMobileMenu()`.

#### CartSheetComponent · `m-cart-sheet`

- **File:** `src/app/features/components/header/cart-sheet/cart-sheet.component.ts`
- **Purpose:** Content rendered inside the cart side-sheet.
- **Injects:** `SheetRef`. `close()` calls `sheetRef.close()`.

#### FooterComponent · `m-footer`

- **File:** `src/app/features/components/footer/footer.component.ts`
- **Purpose:** Site footer — social links, three link columns (Каталог / Компания / Помощь),
  payment badges.
- **Static data:** `socials: SocialLink[]` (Facebook, Instagram, YouTube, Telegram);
  `footerColumns: FooterColumn[]`; `payments = ['VISA', 'Mastercard', 'PayPal']`.
- **Local types:** `FooterLink`, `FooterColumn`, `SocialLink`.

#### CardProductComponent · `m-card-product`

- **File:** `src/app/features/components/card-product/card-product.component.ts`
- **Purpose:** Primary product tile — image, badges/tags, price, discount, and add-to-cart /
  favorite / compare actions. Renders the skeleton while loading.
- **Inputs:** `product = input.required<ProductCardData>()`, `loading = input(false)`,
  `adaptive = input(true)`.
- **Outputs:** `addToCart = output<ProductCardData>()`,
  `favoriteChange = output<{ product; added: boolean }>()`,
  `compareChange = output<{ product; added: boolean }>()`.
- **Computed / state:** `imageError = signal(false)`; `isFavorite`, `isInCompare` (from the
  services); `discount` (percent off, rounded, or `null`); `savings` (absolute money saved, or
  `null`).
- **Injects:** `FavoritesService`, `CompareService`, `ToastService`.
- **Host attrs:** `data-adaptive`, `data-loading`, `data-favorite`, `data-compare` (each `|| null`).
- **Behavior:** all action handlers `preventDefault`/`stopPropagation` (the card is a router link):
  - `onAddToCart` — emits + success toast.
  - `onToggleFavorite` — toggles favorites, emits `favoriteChange`, info toast.
  - `onToggleCompare` — toggles compare and switches on `result.status`: `added`/`removed` emit
    `compareChange` + info toast; `category-mismatch` → error toast naming the active category;
    `limit-reached` → error toast with the limit.
  - `onImageError` — sets `imageError`.

#### CardProductSkeletonComponent · `m-card-product-skeleton`

- **File:** `src/app/features/components/card-product/card-product-skeleton/card-product-skeleton.component.ts`
- **Purpose:** Loading placeholder matching the card layout, built from `SkeletonComponent`.
- **Inputs:** `adaptive = input(true)` (host `data-adaptive`, mirrors the card's width mode).

### Layout & app shell

#### MainLayoutComponent · `m-main-layout`

- **File:** `src/app/layout/main-layout/main-layout.component.ts`
- **Purpose:** App shell for routed pages — `HeaderComponent`, `<router-outlet>`,
  `FooterComponent`. Parent route wrapping the home route. No state/services.

#### App (root) · `m-root`

- **File:** `src/app/app.component.ts`
- **Purpose:** Application root. Hosts the top-level `<router-outlet>` and the global toast
  container (`NgxSonnerToaster`).
- **Injects:** `ToastService`.
- **Behavior:** In the constructor, `afterNextRender` fires demo `toast.success(...)` calls.
  Uses default change detection (no explicit `OnPush`).

#### `appConfig` — `src/app/app.config.ts`

Root `ApplicationConfig` passed to `bootstrapApplication`. Providers: `provideZoneChangeDetection`,
`provideRouter(routes, withComponentInputBinding(), withViewTransitions())`, `provideHttpClient`,
`provideNgxMask()`, `importProvidersFrom(LucideAngularModule.pick(APP_ICONS))`.

#### `routes` — `src/app/app.routes.ts`

See the route table under [Routing](#routing).

#### `main.ts` — entry point

`bootstrapApplication(App, appConfig).catch(err => console.error(err))`.

---

## 4. Shared Component Library

Generic, reusable UI components and directives under `src/app/shared/components/`. All are
standalone and use `ChangeDetectionStrategy.OnPush`. Form controls implement
`ControlValueAccessor` so they work with reactive forms.

| Component / Directive | Selector | Form control |
| --- | --- | --- |
| Accordion | `m-accordion` | – |
| Accordion Item | `m-accordion-item` | – |
| Badge | `m-badge` | – |
| Button | `button[mButton], a[mButton]` | – |
| Button Loader | `m-btn-loader` | – |
| Checkbox | `m-checkbox` | ✓ |
| Input | `m-input` | ✓ |
| Loader | `m-loader` | – |
| Phone Input | `m-phone-input` | ✓ |
| Radio | `m-radio` | – |
| Radio Group | `m-radio-group` | ✓ |
| Select | `m-select` | ✓ |
| Sheet | `m-sheet` | – |
| Skeleton | `m-skeleton` | – |
| Switch | `m-switch` | ✓ |
| Tag | `m-tag` | – |
| Textarea | `m-textarea` | ✓ |
| Tooltip | `m-tooltip` + `[mTooltip]` | – |

### AccordionComponent

- **File:** `src/app/shared/components/accordion/accordion.component.ts`
- **Selector:** `m-accordion` (exported as `mAccordion`)
- **Purpose:** Container coordinating a set of `m-accordion-item` children in single or multiple open mode.
- **Inputs:**
  - `type: input<'single' | 'multiple'>` — default `'single'`
  - `collapsible: input<boolean>` — default `true`
  - `defaultValue: input<string | string[]>` — default `''`
- **Behavior:**
  - `items = contentChildren(AccordionItemComponent)`.
  - `toggleItem(selected)` — routes to single/multiple toggle logic; called by child items.
  - Private `initialValues` computed normalizes `defaultValue`; throws if an array of >1 default is passed while `type` is `'single'`.
  - A constructor `effect()` registers each child (`item.accordion = this`) and sets its initial open state.
  - `single`: opening one item closes others; `collapsible === false` prevents closing the last open item. `multiple`: `collapsible === false` blocks closing when only one item remains open.

### AccordionItemComponent

- **File:** `src/app/shared/components/accordion/accordion-item/accordion-item.component.ts`
- **Selector:** `m-accordion-item` (exported as `mAccordionItem`)
- **Purpose:** Single collapsible header/content panel, optionally managed by a parent `AccordionComponent`.
- **Inputs:** `title` (`''`), `value` (`''`), `disabled` (`false`).
- **Host:** `[attr.data-state]` = `'open'` / `'closed'`.
- **Behavior:** `isOpen = signal(false)` (mutated by parent); `accordion?: AccordionComponent` back-reference; `toggle()` — no-op when disabled, delegates to `accordion.toggleItem(this)` when a parent exists else toggles itself. Protected `headerId` (via `generateId`) and derived `contentId` for a11y.

### BadgeComponent

- **File:** `src/app/shared/components/badge/badge.component.ts`
- **Selector:** `m-badge`
- **Purpose:** Presentational status/label badge styled via data attributes.
- **Inputs:** `variant: BadgeVariant` (`'new' | 'sale' | 'used' | 'hot' | 'popular' | 'out-of-stock'`, default `'new'`); `size: BadgeSize` (`'sm' | 'md'`, default `'md'`).
- **Host:** `[attr.data-variant]`, `[attr.data-size]`. Exports `BadgeVariant`, `BadgeSize`.

### ButtonComponent

- **File:** `src/app/shared/components/button/button.component.ts`
- **Selector:** `button[mButton], a[mButton]`
- **Purpose:** Themeable button/anchor with variants, sizes, icon, and loading states.
- **Inputs:**
  - `size: ButtonSize` (`'sm'|'md'|'lg'|'xl'`, default `'md'`)
  - `view: ButtonView` (`'content'|'icon'`, default `'content'`)
  - `variant: ButtonVariant` (`'primary'|'secondary'|'outline'|'ghost'|'danger'|'danger-outline'|'text'|'text-accent'`, default `'primary'`)
  - `corners: ButtonCorners` (`'square'|'rounded'`, default `'square'`)
  - `loading` / `disabled` — coerced booleans (`transform`)
  - `full: boolean` (`false`)
  - `class: ClassValue` (`''`)
  - `icon: string | LucideIconData` (`''`)
- **Outputs:** `onClick: output<Event>` — emitted only when not disabled and not loading.
- **Host:** `[attr.disabled]` + `data-*` (size/view/variant/corners/loading/full), `(click)`.
- **Behavior:** computed `isIconOnly`, `isContent`, `iconSize` (from `ICON_SIZES`: sm 16, md 18, lg 20, xl 24). Depends on `BtnLoaderComponent`, `LucideAngularModule`, `transform` util.

### BtnLoaderComponent

- **File:** `src/app/shared/components/button/btn-loader/btn-loader.component.ts`
- **Selector:** `m-btn-loader`
- **Purpose:** Inline animated spinner SVG shown inside a busy button.
- **Inputs:** `size: number` (default `18`). Host absolutely centered; SVG `role="status"` / `aria-label="Loading"`.

### CheckboxComponent

- **File:** `src/app/shared/components/checkbox/checkbox.component.ts`
- **Selector:** `m-checkbox` — **ControlValueAccessor**
- **Inputs:** `id` (`generateId('checkbox')`); `size` (`'sm'|'md'|'lg'`, default `'md'`); `state` (`'default'|'indeterminate'`, default `'default'`); `form` (`'square'|'circle'`, default `'square'`); `label` (`''`).
- **Two-way model:** `checked = model<boolean>(false)`. **Output:** `checkChange: output<boolean>`.
- **Host:** `[attr.data-size]`, `[attr.data-disabled]`.
- **CVA:** `writeValue` sets `checked` (null-coalesced to false); `registerOnChange`/`registerOnTouched`; `setDisabledState` toggles `disabledState`.
- **Behavior:** computed `iconSize` (12/14/16), `iconName` (`minus` when indeterminate else `check`), `ariaChecked` (`'mixed'` when indeterminate), `isChecked`. `onToggle()` — when disabled or indeterminate forces `checked = true`, else flips; fires touched/change/`checkChange`.

### InputComponent

- **File:** `src/app/shared/components/input/input.component.ts`
- **Selector:** `m-input` — **ControlValueAccessor**, `OnInit`
- **Inputs:** `id` (`generateId('input')`); `type: InputType` (`text|email|password|tel|number|search`, default `text`); `size` (`sm|md|lg`, default `md`); `mask` (`''`); `label`/`placeholder`/`hint`/`defaultValue` (`''`); `disabled` (`false`); `readOnly` (`false`); `autocomplete` (`'off'`).
- **Outputs:** `changed: output<string>`, `focused: output<void>`.
- **Content projection:** `contentChild('start')` slot; `hasStartSlot` computed.
- **Host:** `[attr.data-size]`, `[attr.data-status]`, `[attr.data-disabled]`.
- **CVA/forms:** `ngOnInit` resolves the bound `NgControl` via `Injector`, obtains the `FormControl` (`FormGroupDirective.getControl`), subscribes to `control.events` to set `inputStatus` `'error'`/`'base'` when touched. Public `control: FormControl | null`.
- **Behavior:** `get inputType()` switches text/password by `showPassword`; computed `wrapClasses` adds `input-wrap-error`. Injects `ValidationErrorMessagesService` (public `validationErrorMessage`). Uses `NgxMaskDirective`, `LucideAngularModule`, `takeUntilDestroyed`.

### LoaderComponent

- **File:** `src/app/shared/components/loader/loader.component.ts`
- **Selector:** `m-loader`
- **Purpose:** Standalone sized loading indicator. **Input:** `size` (`'sm'|'md'|'lg'`, default `'md'`). Host `[attr.data-size]`.

### PhoneInputComponent

- **File:** `src/app/shared/components/phone-input/phone-input.component.ts`
- **Selector:** `m-phone-input` — **ControlValueAccessor**, `OnInit`
- **Purpose:** International phone input with country dropdown, per-country mask, and auto country detection from the dial code.
- **Inputs:** `id` (`generateId('phone')`); `label`/`hint` (`''`); `disabled` (`false`); `readonly` (`false`).
- **Output:** `changed: output<string>` — raw input value.
- **Host:** `[attr.data-status]`, `[attr.data-disabled]`.
- **CVA/forms:** same pattern as `InputComponent` (resolves `NgControl`/`FormControl`, subscribes to `control.events`).
- **Behavior:** signals `inputStatus`, `value`, `disabledState`, `dropdownOpen`, `selectedCountry` (default `COUNTRIES[0]`); computed `currentMask`/`currentPlaceholder`. `selectCountry(country)` seeds value with `'+' + dialCode` and refocuses; `onInputChange` strips non-digits and auto-detects country via `detectCountry` (longest dial code first); `toggleDropdown` (guarded), `onFocusOut` closes dropdown when focus leaves `.phone-wrap`. Uses `@ViewChild('inputRef')`, `COUNTRIES`/`Country` mock, `NgxMaskDirective`, `ValidationErrorMessagesService`.

### RadioComponent

- **File:** `src/app/shared/components/radio/radio.component.ts`
- **Selector:** `m-radio`
- **Purpose:** Single presentational radio button (state driven by parent).
- **Inputs:** `id` (`generateId('radio')`); `name` (`''`); `value: unknown`; `checked` (`false`); `disabled` (`false`); `labelPosition` (`'before'|'after'`, default `'after'`).
- **Output:** `radioChange: output<unknown>` — emits `value` on selection.
- **Host:** `[attr.data-checked]`, `[attr.data-disabled]`.
- **Behavior:** `onToggle()` — no-op when disabled or already checked; otherwise emits `radioChange`.

### RadioGroupComponent

- **File:** `src/app/shared/components/radio-group/radio-group.component.ts`
- **Selector:** `m-radio-group` — **ControlValueAccessor**
- **Inputs:** `name` (`''`); `label` (`''`); `options: RadioOption[]` (`{ label; value; disabled? }`, default `[]`); `labelPosition` (`'before'|'after'`, default `'after'`).
- **Output:** `changed: output<unknown>` — selected value.
- **Host:** `role="radiogroup"`.
- **CVA:** `writeValue` sets internal `value` signal; `registerOnChange`/`registerOnTouched`/`setDisabledState`.
- **Behavior:** `select(val)` — no-op if disabled; sets value, fires touched/change/`changed`. Exports `RadioOption`.

### SelectComponent

- **File:** `src/app/shared/components/select/select.component.ts`
- **Selector:** `m-select` — **ControlValueAccessor**, `OnDestroy`
- **Purpose:** Custom dropdown select rendered through a CDK overlay.
- **Inputs:** `id` (`generateId('select')`); `size` (`sm|md|lg`, default `md`); `label` (`''`); `placeholder` (`'Выберите...'`); `hint` (`''`); `options: SelectOption[]` (`{ label; value; disabled? }`, default `[]`).
- **Host:** `[attr.data-size]`, `[attr.data-disabled]`, `[attr.data-open]` (from `dropdown.isOpen()`).
- **CVA:** `writeValue`/`registerOnChange`/`registerOnTouched`/`setDisabledState` (internal `selectedValue`, `disabledState`). `ngOnDestroy` closes the dropdown.
- **Behavior:** required view children `dropdownTpl`, `trigger`; computed `selectedLabel`; `toggle()` measures host width and calls `dropdown.toggle(trigger, template, vcr, width)`; `select(option)` ignores disabled options; `isSelected(option)`. Provides `SelectDropdownService` at component level. Exports `SelectOption`, `SelectSize`.

### SelectDropdownService

- **File:** `src/app/shared/components/select/select-dropdown.service.ts`
- **Type:** `@Injectable()` (provided per-`SelectComponent`).
- **Purpose:** Manages the CDK overlay lifecycle for the select dropdown. `isOpen = signal(false)`.
- **Methods:** `toggle(...)`; `open(trigger, template, vcr, width)` — `flexibleConnectedTo` position (below trigger with 4px offset, flips above, `withPush(false)`), overlay (`hasBackdrop:false`, reposition scroll strategy, given `width`, `maxHeight:300`), attaches a `TemplatePortal`, closes on `outsidePointerEvents()`; `close()` — detaches/disposes, resets `isOpen`.

### SheetComponent

- **File:** `src/app/shared/components/sheet/sheet.component.ts`
- **Selector:** `m-sheet`
- **Purpose:** Overlay container (a CDK `BasePortalOutlet`) hosting sheet/drawer content injected by `SheetService`.
- **Host:** `[attr.data-state]` (`state()`), `[attr.data-side]` (`config.side`).
- **Behavior:** extends `BasePortalOutlet`, implements `AfterViewInit`; `config = inject<SheetOptions>(…)` side config; `state = signal<'open'|'closed'>('closed')`; `getNativeElement()`, `attachComponentPortal`/`attachTemplatePortal` delegate to an internal `CdkPortalOutlet`.

### SheetService

- **File:** `src/app/shared/components/sheet/sheet.service.ts`
- **Type:** `@Injectable({ providedIn: 'root' })`
- **Purpose:** Opens a modal sheet by creating a CDK overlay, mounting a `SheetComponent`, and projecting a user component into it.
- **API:** `open<T>(options: SheetOptions<T>): SheetRef` — global-position overlay, dark backdrop, block scroll (`body.style.overflow = 'hidden'`), provides side config + `SHEET_DATA`, attaches `SheetComponent`, sets state `'open'`, attaches the content component, returns the `SheetRef`. `SheetOptions<T> = { component: Type<T>; side?: 'left'|'right'|'bottom'; data?: unknown }` (side default `'right'`). `SHEET_DATA` injection token.

### SheetRef

- **File:** `src/app/shared/components/sheet/sheet-ref.ts`
- **Type:** Plain class `SheetRef<R = unknown>` (created by `SheetService`, injectable into sheet content).
- **Behavior:** constructor subscribes to Escape keydown and `outsidePointerEvents()` to `close()`. `close()` — guarded by `isClosing`; sets container `state` to `'closed'`, waits for `animationend` (or a 350ms fallback) before completing `destroy$`, restoring `body.style.overflow`, and disposing the overlay.

### SkeletonComponent

- **File:** `src/app/shared/components/skeleton/skeleton.component.ts`
- **Selector:** `m-skeleton`
- **Purpose:** Inline placeholder/loading shimmer block. No inputs/outputs.

### SwitchComponent

- **File:** `src/app/shared/components/switch/switch.component.ts`
- **Selector:** `m-switch` — **ControlValueAccessor**
- **Inputs:** `id` (`generateId('switch')`); `size` (`sm|md|lg`, default `md`); `label` (`''`).
- **Two-way model:** `checked = model<boolean>(false)`. **Output:** `switchChange: output<boolean>`.
- **Host:** `[attr.data-size]`, `[attr.data-disabled]`.
- **CVA:** `writeValue`/`registerOnChange`/`registerOnTouched`/`setDisabledState`.
- **Behavior:** computed `state` (`checked`/`unchecked`), `ariaChecked`; `onToggle()` — no-op if disabled; flips `checked`, fires touched/change/`switchChange`. Exports `SwitchSize`.

### TagComponent

- **File:** `src/app/shared/components/tag/tag.component.ts`
- **Selector:** `m-tag`
- **Purpose:** Presentational tag/chip label. **Input:** `size` (`'sm'|'md'`, default `'md'`). Host `[attr.data-size]`. Exports `TagSize`.

### TextareaComponent

- **File:** `src/app/shared/components/textarea/textarea.component.ts`
- **Selector:** `m-textarea` — **ControlValueAccessor**, `OnInit`
- **Inputs:** `id` (`generateId('textarea')`); `label`/`placeholder`/`hint` (`''`); `rows` (`3`); `mask` (`''`); `disabled` (`false`); `readOnly` (`false`).
- **Output:** `changed: output<string>`.
- **Host:** `[attr.data-disabled]`, `[attr.data-status]`.
- **CVA/forms:** same reactive-form error wiring as `InputComponent`. `onInputChange(event)` reads `HTMLTextAreaElement.value`. Uses `NgxMaskDirective`, `ValidationErrorMessagesService`.

### TooltipComponent

- **File:** `src/app/shared/components/tooltip/tooltip.component.ts`
- **Selector:** `m-tooltip`
- **Purpose:** Overlay tooltip surface instantiated by `TooltipDirective`; renders title/content or a projected template. Configured imperatively (created as a `ComponentPortal`).
- **Host:** `[attr.data-position]`, `[attr.data-size]`, `[attr.data-state]`.
- **State signals:** `state` (`'closed'|'opened'`), `title`, `content`, `size` (`'sm'|'md'|'lg'`, default `'sm'`), `isArrow` (`true`), `position` (`'top'|'bottom'|'left'|'right'`, default `'top'`), `contentTemplate`.
- **Setters:** `setTitle`, `setContent` (trim), `setSize`, `setArrow`, `setPosition`, `setContentTemplate`. Exports `TooltipPosition`, `TooltipSize`, `TooltipState`.

### TooltipDirective

- **File:** `src/app/shared/components/tooltip/tooltip.directive.ts`
- **Selector:** `[mTooltip]`
- **Purpose:** Attaches a CDK-overlay `TooltipComponent` to the host with hover/click triggers, delays, positioning, and SSR guarding.
- **Inputs:** `mTooltip` (`''`, body text); `tooltipTitle` (`''`); `tooltipSize` (`'sm'`); `tooltipPosition` (`'top'`); `tooltipArrow` (`true`); `tooltipTemplate` (`null`); `tooltipTrigger` (`'hover'|'click'`, default `'hover'`); `showDelay` (`150`, `numberAttribute`); `hideDelay` (`100`, `numberAttribute`).
- **Outputs:** `tooltipShow: output<void>`, `tooltipHide: output<void>`.
- **Behavior:** `ngOnInit` runs only in the browser (`isPlatformBrowser`); `runInInjectionContext` + `toObservable(tooltipTrigger)` re-wires listeners on trigger change; outside-pointer events hide. `initTriggers()` registers hover (`mouseenter/mouseleave/focus/blur`) or `click`, plus a window `scroll` listener that hides immediately. Show/hide delay pipeline via `Subject` + `switchMap`/`timer`. `createOverlay()` builds `flexibleConnectedTo` primary + fallback positions and updates the rendered position on `positionChanges`. `show()` attaches a `ComponentPortal(TooltipComponent)`, pushes inputs via setters, sets `aria-describedby`; `hide()` detaches and clears it. `ngOnDestroy` cleans up.

---

## 5. Services, Models, Core & Utils

Business/state services (`shared/services/`), data models (`shared/models/`), utilities
(`shared/utils/`), and app-wide static data (`core/`).

### Services

#### CompareService

- **File:** `src/app/shared/services/compare/compare.service.ts` · `@Injectable({ providedIn: 'root' })`

Manages a product comparison list capped at **4 items**, all of the same category. State is a
`Record<string, { product: ProductCardData; expiresAt: number }>` (`CompareMap`), persisted to
`localStorage` and synced across tabs via `BroadcastChannel`.

**Public readonly members**

| Member | Type | Description |
| --- | --- | --- |
| `maxItems` | `number` | Constant `4` (`MAX_ITEMS`). |
| `items` | computed `ProductCardData[]` | Products currently in compare. |
| `count` | computed `number` | Number of items. |
| `ids` | computed `Set<string>` | IDs currently in compare. |
| `activeCategory` | computed `ProductCategory \| null` | Category of the first item (governs what can be added). |
| `isFull` | computed `boolean` | `true` when `count() >= 4`. |

**Methods**

- `isInCompare(productId): boolean`.
- `toggle(product): CompareToggleResult` — removes if present (`{ status: 'removed' }`); if an
  active category differs → `{ status: 'category-mismatch'; activeCategory }` (no mutation); if
  full → `{ status: 'limit-reached'; limit: 4 }` (no mutation); otherwise adds with
  `expiresAt = Date.now() + TTL_MS` → `{ status: 'added' }`.
- `remove(productId): void`; `clear(): void`.

```ts
type CompareToggleResult =
  | { status: 'added' }
  | { status: 'removed' }
  | { status: 'category-mismatch'; activeCategory: ProductCategory }
  | { status: 'limit-reached'; limit: number };
```

**Persistence:** localStorage key `mm:compare`; `TTL_MS = 24h` per item (absolute `expiresAt`,
expired items purged on read); BroadcastChannel `mm:compare` (`{ type: 'sync' }`); `MAX_ITEMS = 4`.
Private `commit`/`persist`/`read`/`createChannel` (channel is `null` where `BroadcastChannel` is
undefined).

#### FavoritesService

- **File:** `src/app/shared/services/favorites/favorites.service.ts` · `@Injectable({ providedIn: 'root' })`

Manages a favorites/wishlist list — **no size limit, no category restriction**. State is
`Record<string, { product: ProductCardData; expiresAt: number }>` (`FavoritesMap`).

**Public readonly members:** `favorites` (computed `ProductCardData[]`), `count` (computed
`number`), `ids` (computed `Set<string>`).

**Methods**

- `isFavorite(productId): boolean`.
- `toggle(product): boolean` — adds if absent (`expiresAt = Date.now() + TTL_MS`) or removes if
  present; returns the new membership state.
- `remove(productId): void`; `clear(): void`; `snapshot(): ProductCardData[]`.

**Persistence:** localStorage key `mm:favorites`; TTL 24h per item (purged on read);
BroadcastChannel `mm:favorites`. Same private helper structure as `CompareService`.

#### ToastService

- **File:** `src/app/shared/services/toast/toast.service.ts` · `@Injectable({ providedIn: 'root' })`

Thin wrapper over `ngx-sonner`'s `toast`. Methods (all `void`): `success(msg)`, `error(msg)`,
`warning(msg)`, `info(msg)`.

#### ValidationErrorMessagesService

- **File:** `src/app/shared/services/validation-error-messages.service.ts/validation-error-messages.service.ts.component.ts`
  (note: the service lives inside a directory literally named `validation-error-messages.service.ts`)
  · `@Injectable({ providedIn: 'root' })`

Resolves a human-readable (Russian) message for a reactive-forms `AbstractControl`.

```ts
enum ValidationError {
  Required = 'required', Email = 'email', MinLength = 'minlength', MaxLength = 'maxlength',
  Min = 'min', Max = 'max', Pattern = 'pattern', Mask = 'mask',
  MustMatch = 'mustMatch', InvalidPhone = 'invalidPhone',
}
```

Internal `ERROR_MESSAGES` maps each key to a static string or a function of the error detail
(e.g. `MinLength` → `Минимум ${e.requiredLength} символов`). **Method:**
`getError(control): string` — returns `''` when control is null / has no errors / the first
error key is unmapped; otherwise returns the static string or the function's result invoked with
`control.errors[key]`.

#### Overlay services (defined under `shared/components/`)

- **`SheetService` / `SheetRef`** — open/close CDK-overlay slide-over sheets. Full API in
  [SheetService](#sheetservice).
- **`SelectDropdownService`** — CDK overlay lifecycle for `m-select`. See
  [SelectDropdownService](#selectdropdownservice).

### Data Models

#### `src/app/shared/models/product.model.ts`

```ts
type ProductCategory = 'smartphones' | 'laptops' | 'tablets' | 'headphones' | 'accessories';

interface ProductTag  { label: string; }
interface ProductSpec { key: string; label: string; value: string; group?: string; }
interface ProductBadge { variant: BadgeVariant; label: string; icon?: string; }

interface ProductCardData {
  id: string; slug: string; name: string; brand: string; category: ProductCategory;
  image?: string; price: number; oldPrice?: number; cashback?: number; credit?: string;
  badges?: ProductBadge[]; tags?: ProductTag[]; specs?: ProductSpec[]; inStock: boolean;
}
```

- `BadgeVariant` is imported from the badge component.
- `ProductSpec.group` groups specs in the compare view.
- **Exported constant** `PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string>` — Russian
  labels: smartphones → «Телефоны», laptops → «Ноутбуки», tablets → «Планшеты»,
  headphones → «Наушники», accessories → «Аксессуары».

#### `Country` — `src/app/core/mocks/countries.mock.ts`

```ts
interface Country {
  code: string; name: string; flag: string; phoneCode: string;
  dialCode: string; mask: string; placeholder: string;
}
```

### Utilities — `src/app/shared/utils/merge-classes.ts`

Re-exports `ClassValue` from `clsx`. Exports:

- `mergeClasses(...inputs: ClassValue[]): string` — `clsx` + `twMerge` (Tailwind-aware dedupe).
- `transform(value: boolean | string): boolean` — attribute-style boolean coercion (empty
  string ⇒ `true`); used as an Angular input transform.
- `generateId(prefix = ''): string` — `crypto.randomUUID()`, optionally `${prefix}-${uuid}`.
- `noopFn = () => void 0`.
- `isElementContentTruncated(element?): boolean` — measures content via a DOM `Range`; `true`
  when the rendered content width exceeds the element's box.

### Core static data

#### Icons — `src/app/core/icons/icons.ts`

Imports 43 Lucide icons and re-exports them as `APP_ICONS` (name → icon-component map),
registered globally via `LucideAngularModule.pick(APP_ICONS)` in `appConfig`. Icons include:
Check, Chevron{Down,Left,Right,Up}, Eye/EyeOff, Heart, Phone, Scale, Search, ShoppingCart,
Smartphone, Star, Trash2, X, Plus, Minus, Arrow{Left,Right}, Filter, SlidersHorizontal,
Grid2x2, List, MapPin, Clock, Package, Send, Truck, CircleCheck, CircleX, Info, AlertTriangle,
User, Menu, Share2, Copy, ExternalLink, Loader, and social icons (Instagram, Youtube, Facebook).

#### Products mock — `src/app/core/mocks/products.mock.ts`

`MOCK_PRODUCTS: ProductCardData[]` — 4 smartphones (iPhone 15 Pro, Galaxy S24 Ultra, Xiaomi 14
Pro, Pixel 8 Pro), each with ~18 specs grouped under Russian labels (Основные, Экран, Камера,
Память, Аккумулятор, Связь). Badge variants used: `new`, `hot`, `sale`. Pixel 8 Pro is
`inStock: false`.

#### Countries mock — `src/app/core/mocks/countries.mock.ts`

`COUNTRIES: Country[]` — 84 entries (CIS, Europe, Middle East, Asia, Africa, Americas), each
with a per-country phone mask and placeholder. First entry `RU`; used by
[`PhoneInputComponent`](#phoneinputcomponent).

---

## 6. Packages & Build Config

Every npm dependency (from `package.json`) plus the build/config files. Versions are the
declared ranges.

### Runtime dependencies

#### Angular framework

| Package | Version | Usage |
| --- | --- | --- |
| `@angular/core` | ^21.2.6 | Core runtime: standalone components, signals, DI, `inject()`. |
| `@angular/common` | ^21.2.6 | Common directives/pipes (`@if`/`@for`, `NgClass`, currency/date) and `HttpClient`. |
| `@angular/compiler` | ^21.2.6 | Template compiler (runtime + build). |
| `@angular/forms` | ^21.2.6 | Reactive forms powering filters and the form/input components. |
| `@angular/router` | ^21.2.6 | Client-side routing with lazy standalone routes. |
| `@angular/platform-browser` | ^21.2.6 | Browser bootstrap/DOM layer (`bootstrapApplication`, DomSanitizer). |
| `@angular/cdk` | ^21.2.4 | Overlay/Portal primitives (sheets, select, tooltip), `BreakpointObserver`, a11y. |
| `rxjs` | ~7.8.2 | Reactive streams; interop with signals via `toSignal`/`toObservable`. |
| `zone.js` | ~0.16.1 | Change-detection zone polyfill (build `polyfills` entry). |
| `tslib` | ^2.8.1 | TS runtime helpers (`importHelpers: true`). |

#### UI / styling

| Package | Version | Usage |
| --- | --- | --- |
| `lucide-angular` | ^1.0.0 | Icon set — registered via `LucideAngularModule.pick(APP_ICONS)`. |
| `class-variance-authority` | ^0.7.1 | Type-safe Tailwind variant maps for button/badge-style components. |
| `clsx` | ^2.1.1 | Conditional className joining (used by `mergeClasses`). |
| `tailwind-merge` | ^3.5.0 | Dedupes/merges conflicting Tailwind classes (used by `mergeClasses`). |
| `tailwindcss-animate` | ^1.0.7 | Tailwind animation/transition utilities (accordion, enter/exit). |
| `ngx-sonner` | ^3.1.0 | Toast notifications (wrapped by `ToastService`; `NgxSonnerToaster` in root). |

#### Forms / inputs

| Package | Version | Usage |
| --- | --- | --- |
| `libphonenumber-js` | ^1.12.41 | International phone parsing/validation (phone input). |
| `ngx-mask` | ^21.0.1 | Input masking directive (`provideNgxMask()`; used by input/textarea/phone). |
| `ng-otp-input` | ^2.0.9 | One-time-password input control. |
| `ngx-cookie-service` | ^21.3.1 | Cookie read/write helper. |

#### Carousels

| Package | Version | Usage |
| --- | --- | --- |
| `embla-carousel-angular` | ^21.0.0 | Angular Embla carousel wrapper (galleries/banners/sliders). |
| `embla-carousel-autoplay` | ^8.6.0 | Auto-advancing slides. |
| `embla-carousel-class-names` | ^8.6.0 | State classes on slides (selected/prev/next). |
| `embla-carousel-wheel-gestures` | ^8.1.0 | Mouse-wheel/trackpad carousel scrolling. |

#### Maps / misc

| Package | Version | Usage |
| --- | --- | --- |
| `leaflet` | ^1.9.4 | Interactive maps (store locator / delivery address); typed via `@types/leaflet`. |

### devDependencies

| Package | Version | Role |
| --- | --- | --- |
| `@angular/build` | ^21.2.5 | Application builder (`@angular/build:application` / `:dev-server` / `:unit-test`). |
| `@angular/cli` | ^21.2.5 | `ng serve/build/test/lint` and schematics. |
| `@angular/compiler-cli` | ^21.2.6 | AOT compiler (`ngc`). |
| `typescript` | ~5.9.3 | TypeScript compiler (pinned minor). |
| `@types/node` | ^25.5.0 | Node type definitions for tooling. |
| `@types/leaflet` | ^1.9.21 | Leaflet type definitions. |
| `eslint` | ^10.0.3 | ESLint engine (`ng lint`). |
| `@eslint/js` | ^10.0.1 | ESLint recommended JS presets. |
| `typescript-eslint` | 8.56.1 | TS-ESLint parser/rules + `tseslint.config()` (pinned). |
| `angular-eslint` | 21.3.1 | Angular ESLint rules, template linting, builder (pinned). |
| `eslint-plugin-simple-import-sort` | ^12.1.1 | Sorts imports/exports (warn). |
| `eslint-plugin-unused-imports` | ^4.4.1 | Flags/removes unused imports (error) and vars. |
| `prettier` | ^3.8.1 | Code formatter (`.prettierrc`). |
| `prettier-plugin-tailwindcss` | ^0.7.2 | Sorts Tailwind class names. |
| `tailwindcss` | ^3.4.19 | Tailwind CSS v3 (compiled via PostCSS). |
| `postcss` | ^8.5.8 | CSS transform pipeline for Tailwind/autoprefixer. |
| `autoprefixer` | ^10.4.27 | Vendor prefixing. |
| `vitest` | ^4.1.2 | Unit-test runner (`@angular/build:unit-test`). |
| `jsdom` | ^29.0.1 | DOM environment for Vitest. |
| `ts-node` | ^10.9.2 | Executes TypeScript config/scripts directly. |

### npm scripts

| Script | Command | Purpose |
| --- | --- | --- |
| `start` | `ng serve --configuration development --host 0.0.0.0` | Dev server (all interfaces). |
| `start:prod` | `ng build --configuration production && npx serve dist/mobile-market` | Prod build, then serve static output. |
| `build` | `ng build --configuration production` | Production build → `dist/mobile-market`. |
| `build:dev` | `ng build --configuration development` | Development build. |
| `watch` | `ng build --watch --configuration development` | Rebuild on change. |
| `test` | `ng test` | Unit tests (Vitest). |
| `lint` / `lint:fix` | `ng lint` (`--fix`) | ESLint over `src/**/*.{ts,html}`. |
| `ng` | `ng` | Raw Angular CLI passthrough. |

### Build & config files

#### angular.json

- Single project `mobile-market`; analytics off; CLI cache **disabled**; schematic collections
  `@schematics/angular` + `@angular-eslint/schematics`.
- **Schematics defaults:** components `scss`, `standalone: true`, `skipTests: true`; prefix `m`.
- **build** (`@angular/build:application`): output `dist/mobile-market`, index `src/index.html`,
  entry `src/main.ts`, polyfills `zone.js`, tsConfig `tsconfig.app.json`, inline styles `scss`,
  assets `src/assets → assets`, global stylesheet `src/styles.scss`.
  **defaultConfiguration: production.**
  - **production:** `environment.ts → environment.prod.ts`; budgets — initial 4mb warn / 6mb
    error, anyComponentStyle 20kB / 40kB; `outputHashing: all`, optimization on, no source maps,
    `extractLicenses: true`.
  - **development:** `environment.ts → environment.dev.ts`; optimization off, source maps on.
- **serve** (`@angular/build:dev-server`): **defaultConfiguration: development.**
- **test:** `@angular/build:unit-test` (Vitest). **lint:** `@angular-eslint/builder:lint` over
  `src/**/*.ts` and `src/**/*.html`.

#### tsconfig.json (base)

- **Strictness:** `strict: true` plus `noImplicitOverride`, `noPropertyAccessFromIndexSignature`,
  `noImplicitReturns`, `noFallthroughCasesInSwitch`, `isolatedModules`, `importHelpers`.
- **Compilation:** `target: ES2022`, `module: preserve`, `moduleResolution: bundler`.
- **Path aliases:** `@core/*`, `@shared/*`, `@features/*`, `@layout/*`, `@env/*`.
- **Angular compiler:** `strictInjectionParameters`, `strictInputAccessModifiers`,
  `strictTemplates` all on.
- **Project references:** `tsconfig.app.json`, `tsconfig.spec.json`.

#### tsconfig.app.json / tsconfig.spec.json

- **app:** `outDir ./out-tsc/app`, `types: []`, includes `src/**/*.ts`, excludes `*.spec.ts`.
- **spec:** `outDir ./out-tsc/spec`, `types: ["vitest/globals"]`, includes all `*.ts` + `*.spec.ts`.

#### tailwind.config.js

- Content scan `./src/**/*.{html,ts,scss}`; plugin `tailwindcss-animate`.
- Fonts `poppins` / `montserrat`. Breakpoints `xs:540`…`3xl:1920`; `maxWidth.container: 1440px`;
  `zIndex` `1–9`.
- Dark-theme color tokens: brand `green` / `success` (~#3CBA6E accent), `gray`, semantic
  `surface`, `border` (incl. `border.active` #3CBA6E, `border.focus`), `text` (incl. `inverse`,
  `accent`), `error`, `warning`, `info`.

#### components.json

shadcn-style config: style `scss`, npm; css entry `src/styles.scss`, `baseColor: neutral`,
`cssVariables: true`; aliases components → `src/app/shared/components`,
utils → `src/app/shared/utils`.

#### eslint.config.js (flat config)

- **`**/*.ts`:** plugins `unused-imports`, `simple-import-sort`; extends eslint recommended,
  typescript-eslint recommended + stylistic, angular tsRecommended. `no-unused-imports` error;
  `no-unused-vars` warn (ignores `^_`); import/export sort warn; directive selector = attribute
  prefix `m` camelCase; component selector = element prefix `m` kebab-case; `no-explicit-any`
  warn; `consistent-type-imports` error; `no-empty-function` error (arrow fns allowed).
- **`**/*.html`:** angular templateRecommended + templateAccessibility; `label-has-associated-control` off.

#### .prettierrc

tabWidth 2, single quotes, semicolons, `arrowParens: avoid`, `trailingComma: es5`,
printWidth 100, `htmlWhitespaceSensitivity: ignore`, `bracketSameLine: true`. Plugin
`prettier-plugin-tailwindcss`; `*.html` uses the `angular` parser.

#### .editorconfig / .gitignore

- **.editorconfig:** UTF-8, 2-space indent, final newline, trim trailing whitespace; TS single
  quotes; Markdown keeps trailing whitespace / no max line length.
- **.gitignore:** build output (`/dist`, `/tmp`, `/out-tsc`), `/node_modules`, logs, IDE files
  (`.idea/`, `.vscode/*` except settings/tasks/launch/extensions), `/.angular/cache`,
  `/coverage`, `__screenshots__/`, OS files.

#### Environments — `src/environments/`

| File | `production` | `baseURL` / `apiURL` |
| --- | --- | --- |
| `environment.ts` (default) | `false` | `http://localhost:3000` (+ `/api`) |
| `environment.dev.ts` | `false` | `http://localhost:3000` (+ `/api`) |
| `environment.prod.ts` | `true` | `https://api.mobile-market.com` (+ `/api`) |

Swapped via `fileReplacements`; imported via the `@env/*` alias.
