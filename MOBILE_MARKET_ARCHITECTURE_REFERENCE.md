# Mobile Market — Architecture Reference

**Purpose.** This is the standalone, build-from-scratch reference for the Mobile
Market backend (`backend/`) and admin panel (`projects/mobile-market-admin/`). It
distills the proven patterns from a sibling production project (NEOMATTEN) that
was used only as an architectural reference and is being removed. **After this
file exists, Mobile Market is fully standalone** — no future work should reference
or assume that project. Everything below is written in my own words as a practical
recipe, not a copy of the source.

> **What Mobile Market is:** a single-vendor consumer-electronics e-commerce
> monorepo for the Moldovan market, bilingual **RU/EN**. The storefront already
> exists (Angular, dark Tailwind theme, `m-` selector prefix, mock data). The
> backend and admin panel are new and follow the architecture here. The reference
> project was a car-mat store (DE/EN) — adopt its *architecture*, never its
> business domain or visuals.

---

## 1. Target monorepo layout

One Angular multi-project workspace (single root `angular.json` + `package.json`)
plus a nested NestJS package:

```
mobile-market/                    # workspace root
  angular.json                    # multi-project
  package.json                    # workspace deps + a concurrently "dev" script
  projects/
    mobile-market-app/            # storefront (relocated from today's root src/)
    mobile-market-admin/          # admin SPA (dev port 4300)
    mobile-market-shared/         # Angular library: wire-contract DTOs (FE ⇄ API ⇄ DB)
  backend/                        # NestJS + Prisma + PostgreSQL (its OWN package.json)
    prisma/schema.prisma
    src/
```

- The **shared library** holds plain DTO/enum types that the schema mirrors, so one
  shape travels frontend → API → DB. (Open question for MM: how the NestJS side
  consumes it — import the built lib, or keep the contracts as framework-free `.ts`
  that both sides import. Prefer framework-free types with no `@angular/*` imports so
  the backend can consume them directly.)
- Backend is a **separate npm package** with its own dependency tree and TypeScript
  version — it is NOT bound to the Angular/TS-6 upgrade track of the frontend.
- Convention names to adopt: selector prefix **`m-`** (elements) / `m` (attribute
  directives); Angular project name `mobile-market` for the storefront.

---

## 2. Backend (NestJS) conventions

### 2.1 Folder structure (`backend/src/`)

```
main.ts                 # bootstrap + all global middleware/config
app.module.ts           # root module: global config, throttler guard, feature modules
prisma/
  prisma.module.ts      # @Global module exporting PrismaService
  prisma.service.ts     # PrismaClient wrapper wired to Nest lifecycle
common/
  publishable/          # shared draft/publish mechanism (see §4)
  security/
    password.util.ts    # hashPassword() — single bcrypt entry point
  sorting.ts            # resolveOrderBy() sort-url helper (see §6)
modules/
  <feature>/
    <feature>.module.ts
    <feature>.service.ts
    <feature>.controller.ts         # public routes
    admin-<feature>.controller.ts   # admin routes (guarded) — when the feature has an admin surface
    dto/                            # request DTOs (class-validator + @ApiProperty)
```

**Module rules of thumb**
- One folder per feature; module wires its controller(s) + service + any imports.
- **Split public vs admin controllers.** Public reads (e.g. `products.controller.ts`)
  and admin CRUD (`admin-products.controller.ts`) are separate classes so guards,
  route prefixes, and response shaping never bleed across the trust boundary.
- Services own all Prisma access and business rules; controllers stay thin.
- Feature modules that need images `import` the shared `MediaModule` (see §7).

### 2.2 DTOs & validation

DTOs are classes decorated with **`class-validator`** rules plus **`@ApiProperty`**
for Swagger. Example shape:

```ts
export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail() email: string;

  @ApiProperty({ minLength: 8 })
  @IsString() @MinLength(8) password: string;

  @ApiProperty() @IsString() firstName: string;
  @ApiProperty() @IsString() lastName: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() phone?: string;
}
```

- A **global `ValidationPipe`** (see §3) runs with `whitelist: true`,
  `forbidNonWhitelisted: true`, `transform: true` — unknown properties are stripped
  and a smuggled extra field (e.g. a password hash in a PATCH) is a 400. **Update
  DTOs deliberately omit sensitive fields** (`passwordHash`) so they can never be set
  through a normal update.
- Keep DTO field names aligned with the shared library's types.

### 2.3 PrismaService

```ts
@Injectable()
export class PrismaService extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  async onModuleInit()   { /* try $connect(); log; NON-FATAL on failure */ }
  async onModuleDestroy(){ await this.$disconnect(); }
}
```

- Extends the generated `PrismaClient`, opens the connection on boot and closes on
  shutdown via Nest lifecycle hooks.
- **Connect is non-fatal**: if Postgres isn't up, the server still boots so non-DB
  routes and Swagger work; DB routes error until the database is available.
- Provided by a **`@Global` `PrismaModule`** so every feature service can inject it
  without re-importing.

### 2.4 Guards & the auth principal

- **`JwtAuthGuard`** (Passport JWT) protects authenticated routes; its strategy's
  `validate()` attaches the principal to `request.user` as
  `{ userId, email, isAdmin }`.
- **`AdminGuard`** is a plain `CanActivate` that reads `request.user` and throws
  `ForbiddenException` unless `isAdmin === true`. **It must run after
  `JwtAuthGuard`.** Admin routes carry `@UseGuards(JwtAuthGuard, AdminGuard)` — at
  the controller level so inherited base routes are covered too.
- **Interceptors on the server side are minimal** — cross-cutting request handling
  is done with the global pipe + guards, not custom Nest interceptors. (Token
  attach/refresh interceptors live on the *admin frontend*, see §8.4.)

---

## 3. Bootstrap & security baseline (`main.ts` + `app.module.ts`)

Reproduce this baseline exactly; it is the security floor.

**`main.ts`**
- **Global route prefix `/api`** (`app.setGlobalPrefix('api')`). All routes live under
  `/api`, which matches the frontend dev proxy.
- **CORS with an explicit origin allow-list + `credentials: true`** — never a wildcard,
  because credentialed requests carry auth headers. Allow the local dev ports
  (storefront + admin) and the exact production domains only. For MM this will be the
  storefront domain, `admin.<domain>`, and `http://localhost:4200` / `:4300`.
- **Global `ValidationPipe`** `{ whitelist, forbidNonWhitelisted, transform }`.
- **Static uploads** served at `/api/uploads/*` from the upload dir via
  `useStaticAssets` (kept under `/api` so the FE proxy forwards it; Nginx can serve the
  same dir in prod).
- **Swagger/OpenAPI** at `/api/docs` (`DocumentBuilder().addBearerAuth()`).
- **Production secret assertion:** a function that, when `NODE_ENV==='production'`,
  refuses to boot if `JWT_SECRET` / `JWT_REFRESH_SECRET` are missing or still the
  dev-default value. Weak secrets let anyone forge admin tokens. Dev keeps convenient
  fallbacks.
- Listen on `process.env.PORT ?? 5000`.

**`app.module.ts`**
- `ConfigModule.forRoot({ isGlobal: true })`.
- **Rate limiting:** `ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }])` wired
  globally as `{ provide: APP_GUARD, useClass: ThrottlerGuard }` — 120 req/min per IP,
  app-wide.
- Then `PrismaModule` and each feature module.

**`.env` keys** (from `.env.example`): `DATABASE_URL` (postgresql://…),
`JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_EXPIRES_IN` (e.g. `15m`),
`JWT_REFRESH_EXPIRES_IN` (e.g. `7d`), `PORT`, `ADMIN_SEED_PASSWORD`, `FRONTEND_URL`,
and — only if social login is kept — `GOOGLE_*` / `FACEBOOK_*` client id/secret/callback.

> **Not in the reference (don't assume it):** there was **no `trust proxy`
> configuration and no Helmet**. If MM deploys behind a reverse proxy and wants
> correct client IPs for the throttler (or HSTS/CSP headers), add
> `app.set('trust proxy', 1)` and Helmet deliberately as new hardening — they are
> improvements, not carry-overs.

---

## 4. Draft / publish ("publishable entity") pattern

The backbone of admin content editing. **Public traffic must stay stable while an
admin batches edits**, so admin mutations do not write straight to the columns the
public reads — they stage a **draft** that goes live only on an explicit **Publish**.

**Data columns** added to any publishable model:
```prisma
isActive      Boolean  @default(true)   // public reads filter isActive: true
draftData     Json?                     // pending full-row changes; null = none
pendingDelete Boolean  @default(false)  // staged delete; publish removes the row
```
`draftData Json?` is the default (most entities have many fields; per-field draft
columns don't scale). A single-field entity may instead use one `draftValue String?`
column — a valid alternate implementation of the same contract.

**Shared mechanism** in `common/publishable/`:
- **`PublishableService`** — the contract every publishable module exposes:
  | method | meaning |
  |---|---|
  | `markDraft(id, partial)` | merge partial changes into the row's draft (never clobbers siblings) |
  | `getPendingCount()` | `{ count }` of rows with an unpublished draft |
  | `publishAll()` | apply every pending draft to live columns in ONE transaction → `{ published }` |
  | `discardDraft(id)` | clear one row's draft without publishing (per-row undo) |
- **`PublishableEntityService<TRow>`** — the default implementation, backed by the
  `draftData` column. It is a small **composable class** you `new` with strongly-typed
  **ops closures** over the module's own Prisma delegate
  (`findUnique/findPending/countPending/create/update/delete`) plus an optional
  `onLiveChange()` cache-bust hook. It handles CRUD-shaped drafts a JSON column
  enables: create-hidden (`isActive:false` + a `{__new:true}` marker until publish) and
  delete-pending (`pendingDelete` until publish).
  - **Why composition, not a generic abstract base class:** Prisma's generated delegate
    types don't survive being threaded through a generic Nest abstract class —
    assignability breaks. Passing typed closures keeps every Prisma call fully typed at
    the module while the generic publish logic stays Prisma-agnostic.
- **`PublishableAdminController`** — an abstract base controller giving three routes
  for free: `GET /pending-count`, `POST /publish`, `POST /:id/discard-draft`. The
  concrete controller supplies its guards and returns its service from a
  `publishable()` accessor.
  - ⚠️ **Route-shadow caveat:** a controller that also defines `GET /:id` must NOT
    extend the base — under Nest's inheritance registration order the subclass's
    `GET /:id` registers first and shadows the base's static `GET /pending-count`. Such
    controllers keep explicit routes (declare the static route before `:id`) while still
    calling the same `PublishableService` contract.

**Adopting it (3 steps):** (1) add the columns + a migration; (2) service
`implements PublishableService`, instantiate `PublishableEntityService` with ops
closures (wire `onLiveChange` to your cache invalidation), route admin
create/update/delete through its stage methods; (3) controller extends the base (or
keeps explicit routes if it has `GET /:id`), add `@UseGuards(JwtAuthGuard, AdminGuard)`.

**Why it adds no server load:** public endpoints never read `draftData`; `publishAll()`
is one batched transaction; admin writes are guarded and low-frequency.

---

## 5. Prisma conventions & workflow

- **One PostgreSQL datasource** (`provider = "postgresql"`, `url = env("DATABASE_URL")`),
  `prisma-client-js` generator. **Schema is the single source of truth** and mirrors
  the shared DTO types.
- **Model conventions:** UUID string PKs (`@id @default(uuid())`); `@@map("snake_case")`
  table names; `@@index([...])` on columns used for admin default sort; enums for status
  fields (e.g. an order-status enum) mirrored in the shared library.
- **Referential integrity for safe deletes:** make FKs to a user **nullable with
  `onDelete: SetNull`** where history should survive anonymized (orders, audit logs),
  and `onDelete: Cascade` for owned ephemeral rows (refresh tokens). This is what lets
  admin user-deletion be a hard delete with no FK blocking it.
- **Migrations:** standard Prisma Migrate — `prisma/migrations/` holds versioned SQL;
  create with `npx prisma migrate dev --name <change>`, apply in prod with
  `npx prisma migrate deploy`.
- **Seed:** configured via the `"prisma": { "seed": "ts-node prisma/seed.ts" }` key,
  run with `npx prisma db seed`. `seed.ts` is **idempotent** — it `upsert`s the default
  admin account (email + `ADMIN_SEED_PASSWORD`, bcrypt cost 10, `isAdmin: true`).
  Additional seed/import scripts (site-config, translations, product import) are separate
  idempotent `ts-node` scripts run via npm scripts; make them **create-only / upsert** so
  re-running never clobbers admin edits.

> **Environment gotcha (this machine):** the sandbox's `allow-scripts` guard blocks
> package postinstall scripts, including Prisma's client generation. After writing
> `schema.prisma`, run **`npx prisma generate`** manually (and `npm approve-scripts`
> if needed) — the client won't auto-generate on `npm install` here.

---

## 6. List conventions: sort-url pagination & search

Every server-driven admin list follows one shape.

- **Response envelope:** `{ items, total, skip, take }`.
- **Server-side search + pagination in ONE query.** When search and pagination
  coexist, the `WHERE` (case-insensitive match across the relevant fields) and
  `skip`/`take` run together in a single `findMany`, with a `count` in the same
  `$transaction`. **Never client-filter an already-paged page** — a match on page 5
  must be findable from page 1.
- **Sort via an allowlist (`common/sorting.ts` → `resolveOrderBy`)**. `sortBy` from the
  URL is **never** passed to Prisma directly; it's looked up in a per-entity allowlist
  mapping a stable public key → an `orderBy` builder. Unknown/absent keys fall back to
  the entity default (graceful, not a 400 — a stale bookmarked `?sort=<removed>` still
  works). Each builder returns the FULL `orderBy` and should append a stable tiebreaker
  (e.g. `id`) so skip/take pagination is deterministic when the sort key has duplicates.
- Counts of related rows come back as `_count` (e.g. a user row carries
  `_count.orders`, not the orders themselves) to keep list payloads small.

---

## 7. Media / uploads (generic, reusable)

- A single generic **`MediaModule`** owns all uploads — reused by any entity, not just
  products.
- The `Media` model is **loosely coupled: no foreign key.** Ownership is an optional
  `(entityType, entityId)` pair (`"product"`, …) plus a `sortOrder`. Any entity can own
  images with zero schema change.
- **Storage:** local filesystem at `UPLOAD_DIR` (env-overridable, git-ignored), served
  at `GET /api/uploads/<file>`. Cloud/object storage is deferred — swap the service's
  write/delete later; the `url` contract stays the same.
- **Admin endpoints** (`JwtAuthGuard + AdminGuard`): `POST /api/admin/media/upload`
  (multipart `file`) validates images-only (jpeg/png/webp) + a 5 MB cap **enforced
  twice** (multer `limits` aborts the stream; `ParseFilePipe` returns a clean 4xx),
  writes under a **server-generated filename** (never the client's — path-traversal /
  collision safety), returns `{ id, url, sortOrder }`. `DELETE /api/admin/media/:id`
  removes row + file.
- **Associating:** a feature calls `MediaService.setEntityImages(entityType, id,
  mediaIds)` on create/update — it associates + renumbers the listed rows and releases
  any it no longer owns. Read paths expose images as URL strings publicly and as
  `{ id, url, sortOrder }` to the admin.
- **Security pin:** `multer` is pinned `>=2.2.0` via a `package.json` `overrides` (the
  transitively-shipped 2.1.1 had a DoS advisory). **This is already in
  `backend/package.json`.**

---

## 8. Admin frontend architecture (`projects/mobile-market-admin/`)

Fully standalone Angular (no NgModules), signals, OnPush, dark theme built from Mobile
Market's own Tailwind tokens.

### 8.1 Routing / lazy loading
- Every feature route uses **`loadComponent`** for route-level code splitting (no
  `loadChildren` — there are no lazy NgModules). The `ShellComponent` (layout wrapper)
  and route guards are imported **eagerly** (needed for the first authenticated paint).
- Heavy single-route deps (charts, rich-text) are imported **inside** the lazy feature
  component so they land in that chunk, not the initial bundle.

### 8.2 Page-scroll architecture (pages don't scroll — their table does)
- Shell root is `fixed inset-0` (definite-height box, **no** `dvh`/`vh` units — those
  caused mobile-toolbar layout jank). `<main>` is `flex flex-col overflow-hidden` and
  **never scrolls**.
- Each list page fills `<main>` (`host: { class: 'flex min-h-0 flex-1 flex-col' }`) and
  owns exactly ONE inner `overflow-y-auto` region; toolbar / column headers / pagination
  are pinned `shrink-0` around it. Gotcha: a `flex flex-col` scroll region collapses
  `overflow-hidden` children to height 0 — mark such children `shrink-0`.

### 8.3 Shared primitives (use them, never hand-roll)
- **`m-modal`** — shell for larger form (create/edit) modals: full-viewport backdrop,
  centered panel (`flex` column, `max-h-[90dvh]`, `overflow-hidden`), pinned header
  (title + × close) + pinned footer, only the body scrolls. Wrap it in the consumer's
  `<form>` and gate with `@if` (no `open` input — mirror the confirm-dialog
  open/close convention) so a footer `type="submit"` stays inside the form.
  Inputs: `title`, `closeLabel`, `panelWidthClass` (default `max-w-lg`), `showFooter`;
  output `close` (backdrop / × / Escape).
- **`m-confirm-dialog`** + a `ConfirmDialogService` (`await confirm.confirm({ title,
  message, tone })`) — the app-wide confirmation gate; every mutating action routes
  through it. One host mounted in the shell.
- **Background scroll-lock is architectural, not JS.** Because `<main>` never scrolls and
  the modal overlay is a `fixed inset-0` sibling of the only scroll container, there's
  nothing behind the modal to scroll. Don't add a JS scroll lock / body-overflow toggle.
- **`m-image-upload`** — drag-and-drop uploader, a `ControlValueAccessor` (binds via
  `formControlName`), value is `UploadedImage[]` (`{ id, url }`, order preserved →
  becomes `sortOrder`). Uploads through a service to `POST/DELETE /api/admin/media`.
  Inputs: `accept` (mirror backend allow-list), `maxSizeBytes` (mirror 5 MB cap),
  `maxFiles`. Handles multi-file, per-file progress, thumbnails, remove, reorder,
  client-side type/size validation with a localized toast.
- **`m-virtual-list`** — CDK `@angular/cdk/scrolling` wrapper for large lists.
  **Rule: virtualize when a list can exceed ~100 rows.** Fixed item size (not autosize —
  autosize needs `cdk-experimental` and is slower): rows must render at exactly
  `itemSize` px; let overflowing cell content scroll internally. Compute `itemSize` from
  `BreakpointObserver` when mobile rows are taller. Filtering must change the bound
  `items` array, not hide DOM nodes.

### 8.4 Auth on the client
- **HTTP interceptors** (functional, in `core/interceptors/`): an **auth interceptor**
  attaches the access token to outgoing requests, and a **token-refresh interceptor**
  transparently refreshes/rotates on 401 and retries. (This is the client half of the
  JWT access+refresh scheme in §9.)
- A single **route auth guard** (`admin.guard.ts`) protects admin routes.

### 8.5 Draft/publish UI wiring
- Drop a publish bar (`[pendingCount] [busy] (publish) (discard)`) on an editable page
  and register the count with an **admin publish-status service** (`set(key, count, {
  route, labelKey })`) so a shell-header aggregate shows total pending changes across
  modules. A dashboard surfaces the `pendingChanges` count.

### 8.6 Pagination vs virtualization
- **≤ ~20/page lists** get an `m-pagination` component (server-side). **Virtualize
  instead** only for very large sets where paging is worse UX. Small fully-loaded sets
  need neither — a bounded scroll box suffices.

---

## 9. Auth pattern (end to end)

- **JWT access + rotating refresh tokens.** The access JWT is short-lived
  (`JWT_EXPIRES_IN`, e.g. 15m). Each issued refresh token has a matching **DB row keyed
  by its `jti`** (the random UUID embedded as the token's `jti` claim) — the JWT is
  stateless but the row is the server-side authority that enables **rotate** and
  **revoke**. A row is created on every issuance (login / register / OAuth / refresh);
  `revokedAt` is stamped on rotation, logout, or reuse detection.
- **Passwords:** bcrypt (`bcryptjs`) at **cost 10**, via the single shared
  `common/security/password.util.ts` `hashPassword()` so public registration and
  admin-created accounts can never drift. Min length 8.
- **OAuth (optional for MM):** Passport Google + Facebook strategies; OAuth-created
  accounts have no password hash; an account can link multiple providers after
  email-match; an `authProvider` field records the primary signup method. A one-time
  code store bridges the OAuth redirect back to the SPA. **Decide per MM whether social
  login is in scope at launch** — email/password only is a simpler first cut.
- **Admin user management** (`/api/admin/users`, guarded) is **NOT draft/publish** —
  account data isn't public content, and staging an `isAdmin` revocation would be a
  security hole, so every admin mutation applies immediately. Deletes are **hard**
  (FK-safe per §5). Self-lockout guards: an admin cannot revoke their own admin flag or
  delete their own account (both 400). Password reset sets a hash directly and revokes
  all that user's refresh tokens in the same transaction. All admin user responses go
  through a `toSafeUser()` that strips the hash.

---

## 10. Angular 22 conventions to carry over

- **Standalone components only** — no NgModules anywhere. Each component declares its own
  `imports`.
- **Signals for state** (`signal`, `computed`, `input()`, `output()`, `model()`);
  RxJS where streams fit. `ChangeDetectionStrategy.OnPush` everywhere (in Angular 22
  OnPush is the default).
- **New control flow** `@if` / `@for` / `@switch` in templates.
- **Reactive Forms** for every form; shared form controls implement
  **`ControlValueAccessor`** so they bind via `formControlName`.
- **Path aliases** (`@core`, `@shared`, `@features`, `@layout`, `@env`) and strict
  TypeScript (`strict`, `strictTemplates`, `strictInjectionParameters`).
- **Tailwind utilities in templates** (no `@apply`); design tokens defined once in the
  Tailwind config as the single source of truth.
- **Environments** via `fileReplacements` and an `Environment` interface carrying an
  `apiBaseUrl` + feature flags; all HTTP goes through a base-URL interceptor so services
  stay environment-agnostic.
- Provider style: `provideRouter`, `provideHttpClient`, functional interceptors/guards.

---

## 11. Adapting to Mobile Market (deltas from the reference)

- **Domain:** electronics catalogue, not car mats. **Drop entirely** the reference's
  car-mat modules — **vehicles**, **configurator** (pricing blob + step options), and
  **mat-colours / edge-colours**. Likely MM backend modules: `auth`, `users`, `orders`,
  `products`, `product-categories`, `media`, `settings`, `site-config`, `stats`,
  `translations`. Confirm the electronics product/spec model before authoring the schema.
- **Product spec system:** the storefront already models category-aware specs as
  `ProductSpec { key, label, value, group }` on `ProductCardData` — the backend
  `Product` model and DTOs should serialize to that shape.
- **i18n:** RU/EN (reference was DE/EN). Every user-facing string goes through a
  translation key so the admin translations module can edit copy.
- **Visuals:** admin uses Mobile Market's **own dark Tailwind theme** — green accent
  `#3CBA6E`, `surface` / `border` / `text` scales, Poppins/Montserrat. Same UI-primitive
  packages as the storefront (`class-variance-authority`, `clsx`, `tailwind-merge`,
  `lucide-angular`, `ngx-mask`, CDK) so conventions match with distinct styling.
- **Selector prefix** `m-` (reference used a different prefix).
- **Client-only storefront features** (Favorites, Compare) stay localStorage +
  BroadcastChannel — **no backend persistence needed** for those two.

---

## 12. Explicitly NOT carried over (and why)

- **ZardUI / reference visual styling** — MM has its own established dark theme. Only the
  component *architecture* (draft/publish, guards, modal/upload/virtual-list primitives)
  is adopted, never the look.
- **The reference's business domain** — vehicles, the configurator, mat/edge colours,
  and its vehicle-data import pipeline are car-mat-specific and irrelevant to electronics.
- **A "CanDeactivate" unsaved-changes route guard — DOES NOT EXIST in the reference.**
  I verified this (the only admin guard is the auth `admin.guard.ts`; "pendingChanges" is
  just the draft/publish dashboard counter). Unsaved work is protected *architecturally*
  instead: edits are staged as drafts (nothing is lost on navigation) and mutating
  actions route through the confirm-dialog. If MM wants a true dirty-form navigation
  guard, that is **new work to design**, not a carry-over — do not document it as existing.
- **The stale ".NET / C# backend" mention** in the reference's own README — it was
  inaccurate drift; the real, adopted backend is **NestJS + Prisma + PostgreSQL**.
- **`@nestjs/websockets` / `socket.io`** are present in the backend deps but were not
  central to any documented pattern — carry the dependency only if MM actually needs
  realtime; otherwise it can be dropped.
- **Server-side Helmet / `trust proxy` / image thumbnailing (`sharp`)** were absent —
  treat them as future hardening/enhancements, not existing baseline.

---

## 13. Installed dependency baseline (already in `backend/package.json`)

NestJS 11 (`@nestjs/common|core|platform-express`, `config` 4, `jwt` 11, `passport` 11,
`throttler` 6.5, `swagger` 11, `platform-socket.io`/`websockets` 11), Prisma +
`@prisma/client` 6.19, `bcryptjs` 3, `class-validator` / `class-transformer`,
`passport-jwt` + google/facebook strategies, `reflect-metadata`, `rxjs` 7,
`swagger-ui-express`, `overrides: { multer: ^2.2.0 }`; dev tooling: Nest CLI 11, jest,
ts-node, tsconfig-paths, typescript 5.7+, eslint + typescript-eslint, `@types/*`.
Installed and verified (0 vulnerabilities). **Admin frontend deps are not yet
installed** — they wait for the `projects/mobile-market-admin/` scaffold: Angular 22 +
CDK, `lucide-angular`, `ngx-mask`, `class-variance-authority`, `clsx`, `tailwind-merge`,
`tailwindcss` v3 + `tailwindcss-animate`.
