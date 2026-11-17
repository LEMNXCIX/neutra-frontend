# TanStack Start Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Next.js with TanStack Start + Router + Query + Store + Form + Table + Virtual at full parity, zero `next/*` imports, and green tests.

**Architecture:** Work on long-lived branch `rewrite/tanstack-start`, rebased from `origin/main` between phases. Next stays runnable on the branch until final cutover so parity fixtures can be captured first; production never runs both stacks. Server Routes preserve the `/api/*` HTTP contract, a custom server entry keeps subdomain tenant rewrites, and route loaders replace async Server Components.

**Tech Stack:** Vite, `@tanstack/react-start`, `@tanstack/react-router`, `@tanstack/react-query`, `@tanstack/react-store`, `@tanstack/react-form`, `@tanstack/react-table`, `@tanstack/react-virtual`, React 19, Vitest, Testing Library, happy-dom, Biome, Docker/Node 22.

**Spec:** `docs/superpowers/specs/2026-11-16-tanstack-start-rewrite-design.md`

## Global Constraints

- Work from `origin/main` on branch `rewrite/tanstack-start`; tag `pre-tanstack-start` before the first source change.
- Node `>=22.12.0`, Docker Node 22, app port **3001**, env `BACKEND_API_URL`; keep script names `dev`, `build`, `start`, `test`, `lint`, `check`.
- Stable TanStack modules only: Start, Router, Query, Store, Form, Table, Virtual. **No** experimental RSC, TanStack DB or Ranger.
- Final state: `0` imports from `next/*`, `0` `next` dependency, `0` `.next*` artifacts.
- Preserve envelope: `{ success, statusCode, message, data?, errors?, pagination?, meta: { traceId, timestamp } }`; `ErrorDetail = { code, message, field?, domain?, metadata? }`.
- Preserve error-code families `AUTH_*`, `VALIDATION_*`, `RESOURCE_*`, `TENANT_*`, `BUSINESS_*`, `LOYALTY_*`, `DB_*`, `EXTERNAL_*`, `SYSTEM_*`, `RATE_LIMIT_*`, `WHATSAPP_*`; HTTP status comes from the backend error **class**, not the code prefix; forward backend status verbatim; `204` → `null`.
- Tenant headers `x-tenant-slug` / `x-tenant-id` from the proxy take precedence over `tenant-slug` / `tenant-id` cookies.
- UI shows Spanish messages from `errors[].code` only; backend `message` is never rendered.
- All 325 existing tests are ported, not deleted. Parity harness must match captured Next fixtures before cutover.
- CI gates: `npm test`, `npm run build`, `npm run check`, Docker smoke with tenant headers.

## Review Focus

- **Stale tenant cookie vs proxy header** — a request with old `tenant-slug` cookie but fresh `x-tenant-slug` header must use the header. Test in Task 5 (`serverBackendFetch` header precedence).
- **204 / empty body** — BFF must return `null` without attempting `response.json()`. Test in Task 5.
- **Raw backend error leak / status rewrite** — `errors[].code` and backend status must survive; raw English `message` must not reach UI. Tests in Task 5 and Task 14.
- **Webhook signature loss** — `/api/webhooks/*` rewrite must preserve method, raw body and all headers. Test in Task 3.
- **Subdomain rewrite + cookies** — host `booking.slug.nip.io` rewrites to `/booking`, `store.slug.nip.io` to `/store`, with tenant cookies set on the response. Test in Task 3.

---

## Task 1: Branch base and parity fixtures

**Files:**
- Create: `scripts/capture-parity.mjs`
- Create: `tests/parity/routes.json` (list of critical paths)
- Create: `tests/parity/capture.test.ts`
- Create: `tests/parity/compare.mjs`
- Modify: `.gitignore` (ignore `tests/parity/fixtures/**`)

**Interfaces:**
- Consumes: current Next app on `http://localhost:3001`.
- Produces: `npm run parity:capture` writes JSON fixtures keyed by route + tenant header set; `npm run parity:compare <baseUrl>` exits 0 when status, envelope keys and link set match.

- [ ] **Step 1: Write the failing test**

Create `tests/parity/routes.json` with at least: `/store`, `/products`, `/cart`, `/login`, `/admin/orders`, `/booking/home`, `/api/products`, `/api/webhooks/health`. Add a Vitest test `tests/parity/capture.test.ts` asserting the file has 8+ entries and every entry has `path` and `tenant`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/parity/capture.test.ts`
Expected: FAIL (module/file missing).

- [ ] **Step 3: Implement capture/compare scripts**

`capture-parity.mjs`: start from `BASE_URL` env (default `http://localhost:3001`), for each entry send `x-tenant-slug`/`x-tenant-id` headers, save `{ status, headers subset, body }` to `tests/parity/fixtures/<slug>-<encoded-path>.json`. `compare.mjs`: same requests against given base, compare status + `meta.traceId` presence + sorted `href` set + envelope keys, print diffs and exit 1 on mismatch. Add `parity:capture` and `parity:compare` scripts to `package.json`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/parity/capture.test.ts` then `npm run parity:capture` against the running Next app.
Expected: PASS; fixtures written (gitignored) for both `store` and `booking` tenants.

- [ ] **Step 5: Create branch and tag; commit**

```bash
git tag pre-tanstack-start
git checkout -b rewrite/tanstack-start
git add scripts/capture-parity.mjs tests/parity/routes.json tests/parity/compare.mjs tests/parity/capture.test.ts package.json .gitignore
git commit -m "test: capture Next parity fixtures before rewrite"
```

## Task 2: Start scaffold, root document and providers

**Files:**
- Create: `vite.config.ts`
- Create: `src/routes/__root.tsx`
- Create: `src/styles/globals.css` (moved Tailwind entry)
- Modify: `package.json`, `tsconfig.json`, `Dockerfile`, `Dockerfile.dev`, `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: Node 22, Biome config, existing Tailwind/postcss setup.
- Produces: `src/routes/__root.tsx` exporting `Route` (root route) and `RootDocument`; `QueryClientProvider` available to all descendants; `npm run build` emits a Node-startable server entry.

- [ ] **Step 1: Write the failing test**

Create `src/routes/__tests__/root.test.tsx`: render `RootDocument` with a dummy child and assert it produces an `<html>` document with a `<head>` and `<body>`, and that the dummy child text is present. Do not assert framework-internal attributes.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/routes/__tests__/root.test.tsx`
Expected: FAIL (`__root.tsx` missing).

- [ ] **Step 3: Implement scaffold**

Install `@tanstack/react-start`, `@tanstack/react-router`, `@tanstack/react-query`, `@tanstack/react-store`, `@tanstack/react-form`, `@tanstack/react-table`, `@tanstack/react-virtual`, `vite`, `@vitejs/plugin-react`; remove `next` and Next-only deps. `vite.config.ts` uses `tanstackStart()` + `viteReact()` with `server.entry: './server.ts'`. `__root.tsx` uses `createRootRoute`, `HeadContent`, `Scripts`, `Outlet`, `shellComponent`, and wraps children in `QueryClientProvider` + theme + i18n providers. Rewrite Dockerfiles to build with Vite and run the generated Node server on 3001; CI keeps the same script names.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/routes/__tests__/root.test.tsx && npm run build`
Expected: PASS; build output contains `server/index.mjs` (or the plugin's documented Node entry) and no `.next`.

- [ ] **Step 5: Commit**

```bash
git add vite.config.ts src/routes/__root.tsx src/styles/globals.css package.json package-lock.json tsconfig.json Dockerfile Dockerfile.dev .github/workflows/ci.yml src/routes/__tests__/root.test.tsx
git commit -m "feat: scaffold TanStack Start with root document and providers"
```

## Task 3: Server entry — tenant proxy, webhooks, manifest

**Files:**
- Create: `src/server.ts`
- Create: `src/routes/api/manifest[.]webmanifest.ts`
- Create: `src/lib/tenant-request.ts`
- Test: `src/__tests__/server-entry.test.ts`

**Interfaces:**
- Consumes: `getBackendUrl()` from `src/lib/backend-url.ts`; tenant cache semantics from `src/proxy.ts`.
- Produces: `resolveTenant(host: string): Promise<{ slug: string; moduleType: 'store'|'booking'|'root'; tenantId: string }>`; `applyTenantToRequest(request: Request): Promise<{ request: Request; cookies: string[] }>` used by server functions and loaders.

- [ ] **Step 1: Write the failing tests**

In `src/__tests__/server-entry.test.ts`:
- `it('rewrites booking subdomain to /booking and sets tenant cookies')`: call exported `fetch` with `host: booking.acme.nip.io`, expect downstream request URL `/booking` and `set-cookie` containing `tenant-slug=acme`, `module-type=booking`.
- `it('passes webhook body and signature through untouched')`: POST `/api/webhooks/stripe` with raw body `{"id":"evt_1"}` and `x-stripe-signature: sig`; expect rewritten backend request body string and signature header equal inputs.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/server-entry.test.ts`
Expected: FAIL (`src/server.ts` missing).

- [ ] **Step 3: Implement server entry**

`src/server.ts`: `createServerEntry({ fetch(request, opts) {...} })`; before `startHandler`, parse `new URL(request.url)`, call `resolveTenant`, rewrite path to `/store` or `/booking` when host has a tenant slug, set `x-tenant-*` headers on a cloned `Request`, forward `/api/webhooks/*` to `${getBackendUrl()}/webhooks/*` with original body/headers, then invoke `createStartHandler(defaultStreamHandler)` wrapped so response cookies are applied. `tenant-request.ts` holds the TTL cache and header/cookie helpers. Manifest route returns `Response.json` with tenant name derived from host.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/server-entry.test.ts`
Expected: PASS for both tests.

- [ ] **Step 5: Commit**

```bash
git add src/server.ts src/routes/api/manifest[.]webmanifest.ts src/lib/tenant-request.ts src/__tests__/server-entry.test.ts
git commit -m "feat: port tenant proxy and webhook rewrites to server entry"
```

## Task 4: Global middleware (CSRF, logging, tenant context)

**Files:**
- Create: `src/start.ts`
- Create: `src/lib/server-context.ts`
- Test: `src/__tests__/start-middleware.test.ts`

**Interfaces:**
- Consumes: `applyTenantToRequest` from Task 3.
- Produces: `startInstance` from `src/start.ts`; `getTenantContext()` returning `{ slug, moduleType, tenantId }` inside server functions.

- [ ] **Step 1: Write the failing test**

Test asserts: (a) a same-origin server function request passes; (b) a request with `Sec-Fetch-Site: cross-site` and no Origin is rejected with 403; (c) `getTenantContext()` inside a handler returns the slug injected by Task 3.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/start-middleware.test.ts`
Expected: FAIL (`src/start.ts` missing).

- [ ] **Step 3: Implement middleware**

`src/start.ts`: `createStart(() => ({ requestMiddleware: [createCsrfMiddleware({ filter: (ctx) => ctx.handlerType === 'serverFn' }), tenantContextMiddleware] }))`. `tenantContextMiddleware` calls `applyTenantToRequest` and stores context via `next({ context })`; `server-context.ts` exposes typed accessor.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/start-middleware.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/start.ts src/lib/server-context.ts src/__tests__/start-middleware.test.ts
git commit -m "feat: add global CSRF and tenant middleware"
```

## Task 5: BFF contract core

**Files:**
- Modify: `src/lib/api-route-handler.ts`, `src/lib/backend-api.ts`, `src/lib/api-client.ts`, `src/lib/server-auth.ts`, `src/lib/server-theme.ts`, `src/lib/strapi.ts`
- Modify: `src/types/frontend-api.ts`
- Test: `src/lib/__tests__/api-route-handler.test.ts`, `src/lib/__tests__/error-codes.test.ts`, `src/lib/__tests__/no-raw-error-messages.test.ts`, `src/lib/__tests__/bff-boundary.test.ts`, `src/lib/__tests__/strapi.test.ts`

**Interfaces:**
- Consumes: envelope type from `src/types/frontend-api.ts`; error code enums already ported in `src/lib/error-codes.ts`; tenant context from Task 4.
- Produces: `createBffHandler(method: HttpMethod, endpoint: EndpointResolver, config?: RouteConfig): (ctx: { request: Request; params?: Record<string, string> }) => Promise<Response>`; `serverBackendFetch<T>(endpoint: string, init?: RequestInit): Promise<T>`; `apiClient<T>()` keeps its current signature.

- [ ] **Step 1: Write the failing tests**

Port the five listed test files to Web `Request`/`Response` and Start server utilities. Add two tests to `api-route-handler.test.ts`:
- `it('returns null for 204 without parsing a body')`.
- `it('uses x-tenant-slug header over tenant-slug cookie when forwarding')`.
Add to `no-raw-error-messages.test.ts`: backend `message: 'EMAIL_TAKEN'` must not appear in rendered UI text; only the Spanish code message does.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/__tests__`
Expected: FAIL (imports still `next/server`, `next/headers`).

- [ ] **Step 3: Implement contract modules**

Rewrite `api-route-handler.ts` to build `Response.json(envelope, { status })`, preserving trace id, `errors` array and 204. `backend-api.ts` exposes `serverBackendFetch` using `getRequest`/`getRequestHeader`/`getCookie` and tenant header precedence. `api-client.ts` keeps browser `/api` base, server direct backend base, `ApiError`, `unauthorized` event and `x-suppress-unauthorized`. `server-auth`/`server-theme`/`strapi` switch from `next/headers` to Start server utilities. No raw backend `message` in UI paths.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/__tests__`
Expected: PASS, including the two new tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib src/types/frontend-api.ts
git commit -m "refactor: port BFF contract and server helpers off Next"
```

## Task 6: Server Routes for all 75 endpoints

**Files:**
- Create: `scripts/generate-api-routes.mjs`
- Create: `scripts/api-routes.json` (manifest of original path+method set)
- Create: `src/routes/api/**/route.ts` (75 files, generated from `src/app/api/**/route.ts`)
- Test: `src/routes/api/__tests__/route-inventory.test.ts`, `tests/parity/api-contract.test.ts`

**Interfaces:**
- Consumes: `createBffHandler` from Task 5.
- Produces: `createFileRoute('/api/...')({ server: { handlers: { GET, POST, ... } } })` for every current endpoint, same path and method set.

- [ ] **Step 1: Write the failing tests**

`route-inventory.test.ts`: read `scripts/api-routes.json` (generated in Step 3 from `src/app/api/**/route.ts`) and `src/routes/api/**/route.ts`, assert equal count (75) and equal normalized path+method set. `api-contract.test.ts`: for `/api/products`, `/api/auth/login`, `/api/orders`, send requests captured in fixtures and assert status, `success`, `errors[].code`, `meta.traceId` presence.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/routes/api/__tests__/route-inventory.test.ts tests/parity/api-contract.test.ts`
Expected: FAIL (no generated routes).

- [ ] **Step 3: Generate routes**

`scripts/generate-api-routes.mjs` walks `src/app/api`, writes the normalized path+method set to `scripts/api-routes.json`, maps `[id]` → `$id`, converts each exported `GET/POST/... = create*Handler('...')` into `createBffHandler(method, endpoint)` inside `server.handlers`, and writes `src/routes/api/.../route.ts`. Delete the old `src/app/api` tree only after the inventory test passes. Keep shared handlers in `src/lib/api-route-handler.ts`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/routes/api/__tests__/route-inventory.test.ts tests/parity/api-contract.test.ts && npm run parity:compare http://localhost:3001`
Expected: PASS; parity API responses match.

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-api-routes.mjs scripts/api-routes.json src/routes/api src/app/api
git commit -m "feat: generate 75 BFF server routes with matching contract"
```

## Task 7: Route tree, layouts and metadata

**Files:**
- Create: `src/routes/_store.tsx`, `src/routes/_booking.tsx`, `src/routes/_admin.tsx`, `src/routes/_storeAdmin.tsx`, `src/routes/_bookingAdmin.tsx`
- Create: `src/routes/**/index.tsx` (68 page routes)
- Create: `scripts/page-routes.json` (manifest of original pages and literal titles)
- Modify: `src/routes/__root.tsx`
- Test: `src/routes/__tests__/route-tree.test.ts`

**Interfaces:**
- Consumes: `__root` from Task 2; BFF helpers from Task 5.
- Produces: route paths identical to current App Router URLs; `head` returns title/description equal to current `metadata` exports.

- [ ] **Step 1: Write the failing test**

`route-tree.test.ts`: read `scripts/page-routes.json` (generated in Step 3 from `src/app/**/page.tsx`) and assert each entry has a matching `src/routes/**/index.tsx` with the same URL (route groups dropped, `[id]` → `$id`); assert every migrated route file exports `Route` and a `head` function whose `title` matches the recorded literal title.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/routes/__tests__/route-tree.test.ts`
Expected: FAIL (route files missing).

- [ ] **Step 3: Create layouts and page shells**

First write `scripts/page-routes.json` with each page URL and its literal `metadata.title`. Then create pathless layout routes wrapping each group with existing layout UI/providers. Generate page route files with `createFileRoute`, `loader` calling existing fetch helpers via `serverBackendFetch`, `head` from `scripts/page-routes.json`, and `component` rendering the existing client component with `useLoaderData` data. Keep components in `src/components`; do not rename UI files.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/routes/__tests__/route-tree.test.ts && npm run build`
Expected: PASS; route tree generated with 68 page routes.

- [ ] **Step 5: Commit**

```bash
git add src/routes scripts/page-routes.json
git commit -m "feat: create route tree with pathless layouts and head metadata"
```

## Task 8: Store group pages and data loaders

**Files:**
- Modify: `src/routes/_store/**/index.tsx`
- Modify: `src/app/(store)/**/page.tsx` (delete after port)
- Test: `tests/parity/store-group.test.ts`

**Interfaces:**
- Consumes: route shells from Task 7; `serverBackendFetch` from Task 5.
- Produces: storefront pages rendering from loaders with parity to current pages.

- [ ] **Step 1: Write the failing test**

Parity test for `/store`, `/products`, `/cart`, `/contact`, `/faq` comparing status, envelope keys and sorted link set to captured fixtures for tenant `store`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/parity/store-group.test.ts`
Expected: FAIL (routes not yet rendering).

- [ ] **Step 3: Port the group**

Move each page's server fetch into its route `loader`, pass results to the existing `*Client` component through `useLoaderData`, convert `redirect`/`notFound` calls, and remove the old `page.tsx` files once parity passes for that page.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/parity/store-group.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/routes/_store 'src/app/(store)'
git commit -m "refactor: port store group pages to route loaders"
```

## Task 9: Booking and admin groups

**Files:**
- Modify: `src/routes/_booking/**/index.tsx`, `src/routes/_admin/**/index.tsx`, `src/routes/_storeAdmin/**/index.tsx`, `src/routes/_bookingAdmin/**/index.tsx`
- Modify: corresponding `src/app/.../page.tsx`
- Test: `tests/parity/booking-group.test.ts`, `tests/parity/admin-group.test.ts`

**Interfaces:**
- Consumes: same as Task 8.
- Produces: all remaining pages on loaders; no `src/app/**/page.tsx` left.

- [ ] **Step 1: Write the failing tests**

Parity tests for `/booking/home`, `/booking/services`, `/admin/orders`, `/admin/loyalty`, `/store-admin/products`, `/booking-admin/appointments` with the appropriate tenant header sets.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/parity/booking-group.test.ts tests/parity/admin-group.test.ts`
Expected: FAIL.

- [ ] **Step 3: Port groups**

Repeat Task 8 step 3 for booking and the three admin groups; keep feature gates (`FeatureProvider`) and role checks in `beforeLoad`, with authorization still enforced in server functions/routes.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/parity/booking-group.test.ts tests/parity/admin-group.test.ts && npx vitest run src/lib/__tests__/feature-provider.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/routes src/app
git commit -m "refactor: port booking and admin pages to route loaders"
```

## Task 10: Navigation, images and fonts

**Files:**
- Modify: `src/components/**` (31 `next/link`, 4 `next/image`, navigation hooks)
- Modify: `src/routes/__root.tsx`
- Test: `tests/no-next-imports.test.ts`, `src/components/__tests__/navigation.test.tsx`

**Interfaces:**
- Consumes: route tree from Task 7.
- Produces: zero `next/*` imports; all anchors use TanStack `Link`.

- [ ] **Step 1: Write the failing tests**

`no-next-imports.test.ts`: scan `src/**` for `from "next` / `require('next` and assert zero matches. `navigation.test.tsx`: render a component using `Link` and assert `href` matches the typed route for a dynamic product id.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/no-next-imports.test.ts src/components/__tests__/navigation.test.tsx`
Expected: FAIL (many Next imports).

- [ ] **Step 3: Replace primitives**

`next/link` → `Link` with `to`; `useRouter/useSearchParams/usePathname` → TanStack hooks with validated search schemas; `redirect/notFound` → Router helpers; `next/image` → plain `<img>`/unpic; remove `next/font/google` in favor of CSS `<link>` in `RootDocument`. Delete `next.config.ts`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/no-next-imports.test.ts src/components/__tests__/navigation.test.tsx && npm run check`
Expected: PASS, zero Next matches.

- [ ] **Step 5: Commit**

```bash
git add src tests/no-next-imports.test.ts
git rm next.config.ts
git commit -m "refactor: replace Next navigation, image and font primitives"
```

## Task 11: Zustand → TanStack Store

**Files:**
- Modify: `src/store/auth-store.ts`, `src/store/tenant-store.ts`, remaining `src/store/*.ts`
- Create: `src/store/tanstack/*.ts`
- Test: `src/store/__tests__/*.test.ts` (ported)

**Interfaces:**
- Consumes: tenant context from Task 4.
- Produces: stores with the same public methods used by components (e.g. `setTenant`, `login`, `logout`, `reset`).

- [ ] **Step 1: Write the failing tests**

Port existing store tests to assert the same state transitions and persistence keys through the TanStack Store API.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/store/__tests__`
Expected: FAIL (old zustand imports).

- [ ] **Step 3: Implement stores**

Create `createStore` instances with `withProps` where needed; keep cookie/localStorage persistence semantics and the `unauthorized` event integration. Update component imports.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/store/__tests__`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/store
git commit -m "refactor: migrate zustand stores to TanStack Store"
```

## Task 12: Forms → TanStack Form

**Files:**
- Modify: `src/components/**/login*.tsx`, `register*.tsx`, `reset*.tsx`, `*-form.tsx`, admin editor forms
- Test: `src/components/__tests__/forms.test.tsx`

**Interfaces:**
- Consumes: `apiClient` from Task 5; error-code messages from `src/lib/error-messages.ts`.
- Produces: forms with identical field names, validation messages and submit payloads.

- [ ] **Step 1: Write the failing tests**

For login and one admin editor: assert submission payload shape, inline validation messages, and that a backend `AUTH_*` code renders its Spanish message.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/__tests__/forms.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Migrate forms**

Replace controlled state with `useForm`, keep existing validators, map server `errors[].code` to field errors, keep disabled/loading behavior from `useHydrated`-equivalent.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/__tests__/forms.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components src/lib/error-messages.ts
git commit -m "refactor: migrate forms to TanStack Form"
```

## Task 13: Tables and virtualized lists

**Files:**
- Modify: `src/components/admin/**/table*.tsx`, `src/components/**/product-grid.tsx`, log/list components
- Test: `src/components/__tests__/tables.test.tsx`, `src/components/__tests__/virtual-lists.test.tsx`

**Interfaces:**
- Consumes: `apiClient` from Task 5.
- Produces: headless tables with existing sort/filter/pagination controls; virtualized product/log lists.

- [ ] **Step 1: Write the failing tests**

Table test: sorting a column and changing page yields the same row ids as before. Virtual test: rendering 500 products creates fewer than 50 DOM rows initially.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/__tests__/tables.test.tsx src/components/__tests__/virtual-lists.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

`useReactTable` with existing column definitions and `getCoreRowModel/getSortedRowModel/getPaginationRowModel`; `useVirtualizer` for long lists, keeping item markup unchanged.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/__tests__/tables.test.tsx src/components/__tests__/virtual-lists.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components
git commit -m "refactor: migrate tables to TanStack Table and lists to Virtual"
```

## Task 14: Full test port, gates and cutover

**Files:**
- Modify: remaining `src/**/__tests__/*.test.ts*`
- Modify: `.github/workflows/ci.yml`, `README.md`
- Test: `tests/parity/full.test.ts`

**Interfaces:**
- Consumes: all previous tasks.
- Produces: 325 green tests, all parity fixtures matching, clean Docker image ready for cutover.

- [ ] **Step 1: Write the failing test**

`tests/parity/full.test.ts`: loop over `tests/parity/routes.json`, compare every fixture against the Start server. Add assertions: no `next` in `package.json` dependencies, no `node_modules/next` resolution needed, and `src/lib/error-messages.ts` covers every code emitted by backend enums used in UI.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/parity/full.test.ts`
Expected: FAIL until all groups are ported.

- [ ] **Step 3: Port remaining tests and gates**

Convert any remaining Next-mock tests; add `npm run check` (Biome CI), zero-Next grep, Docker smoke with `x-tenant-slug`/`x-tenant-id`, and error-code coverage check to CI. Document cutover and rollback (`git revert` of merge + previous image from `pre-tanstack-start`) in `README.md`.

- [ ] **Step 4: Run full verification**

Run: `npm test && npm run build && npm run check && npx vitest run tests/parity/full.test.ts && docker build -t neutra-start:verify .`
Expected: all 325 ported tests pass with zero failures; build/check green; parity fixtures match with empty diff; Docker image builds.

- [ ] **Step 5: Rebase, review and cutover**

Rebase `rewrite/tanstack-start` onto latest `origin/main`, rerun Step 4 (using the already captured fixtures — no Next server needed), then merge with a merge commit (not squash) so the rollback is one revert. Tag the merge `tanstack-start-cutover`.

```bash
git add . && git commit -m "test: complete parity gates and cutover docs"
```

## Self-review notes

- Spec coverage: goals 1-7 map to Tasks 2, 5-6, 7-10, 11-13, 14; rollback/tag to Tasks 1 and 14; backend contract to Task 5; proxy/webhooks to Task 3; middleware to Task 4; deploy to Tasks 2 and 14.
- Every task ends with a runnable test command and a commit; no task depends on an undefined name (`createBffHandler`, `applyTenantToRequest`, `startInstance`, route paths are defined in Interfaces blocks).
- Review Focus inputs are pinned in Tasks 3, 5 and 14.
- Plan is intentionally shorter than the implementation: it fixes names, signatures, values and gates, not bodies.
