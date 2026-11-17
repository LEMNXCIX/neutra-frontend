# Rewrite to TanStack Start — Design Spec

- Date: 2026-11-16
- Status: Draft for human review (no implementation started)
- Repo: `neutra-frontend` (Next.js 16 / React 19 / App Router today)
- Related backend: `../api-neutra-v2` (Express 5 / Prisma 7, read-only reference for payload contracts)

## 1. Context and intent

The repository is a multi-tenant storefront + booking + admin frontend built on Next.js 16 App Router. It currently has 68 `page.tsx`, 7 `layout.tsx`, 75 `route.ts` API/BFF endpoints, 60 `metadata` exports, and 325 Vitest tests. Next-specific surface: 52 `next/navigation` imports, 31 `next/link`, 20 `next/server`, 9 `next/headers`, 4 `next/image`, 1 `next/font/google`, 1 `next/cache` (`revalidateTag`), plus `src/proxy.ts` (subdomain tenant rewrite + header/cookie injection) and `next.config.ts` rewrites.

The driver for this rewrite is **stack unification**: leave Next.js completely and standardize the frontend on the stable TanStack modules. The result must run in the existing Docker/Node 22 environment (port 3001, `BACKEND_API_URL`, subdomain tenants such as `<slug>.<ip>.nip.io`).

Success means full functional parity: all pages, endpoints and tests working in the new stack, with zero `next/*` imports and zero `next` dependency.

## 2. Goals

1. Remove Next.js entirely: no `next` package, no `next/*` imports, no App Router conventions, no `.next` artifacts.
2. Adopt the stable TanStack modules where applicable: **Start, Router, Query, Store, Form, Table, Virtual**.
3. Keep the HTTP contract with the backend unchanged (`/api/*` paths, envelope, error codes, status mapping, webhook passthrough).
4. Preserve multi-tenant behavior (subdomain resolution, rewrite to `/store` or `/booking`, tenant headers/cookies).
5. Keep Docker/Node deployment, scripts, Biome and Vitest.
6. Port (not discard) the 325 tests and add parity fixtures captured from the current Next build before it is removed.
7. Ship as a single big-bang cutover from a dedicated branch, with a tagged rollback point.

## 3. Non-goals

- Redesigning the UI, Tailwind theme, Radix/shadcn components, i18n strings or copy.
- Changing backend logic, schema, or endpoints in `../api-neutra-v2` (read-only reference).
- Adopting experimental TanStack modules (TanStack DB, Ranger) or React Server Components (experimental in Start).
- Introducing serverless/edge deployment in this rewrite.
- Keeping a dual Next+Start runtime in production (the migration happens on a branch, not behind a long-lived split proxy).

## 4. Approved decisions

| Decision | Choice |
|---|---|
| Migration style | Big-bang rewrite on `rewrite/tanstack-start`, rebased periodically from `origin/main`, final cutover |
| Build tool | Vite + `@tanstack/react-start/plugin/vite` + `@vitejs/plugin-react` |
| Routing | TanStack Router file-based routes; pathless layouts for app groups; `$id` for dynamic params |
| Server code | Server Routes for `/api/*`, `createServerFn` for app RPC, custom `src/server.ts` entry, global middleware in `src/start.ts` |
| Data/state | Route loaders replace async Server Components; TanStack Query is the single client cache; TanStack Store replaces zustand |
| Forms/tables/lists | TanStack Form, TanStack Table, TanStack Virtual |
| Deploy | Docker, Node 22, port 3001, `BACKEND_API_URL`; rewrite Dockerfile/dev compose/CI for Start output |
| Definition of done | Full parity + 325 ported tests green + parity harness green + zero Next references |

## 5. Target architecture

### 5.1 Route tree

- `src/routes/__root.tsx`: `RootDocument` with `<HeadContent/>`, `<Scripts/>`, providers for Query, theme, i18n; `beforeLoad` loads session/tenant into route context.
- Pathless layouts replace App Router route groups: `_store.tsx`, `_booking.tsx`, `_admin.tsx`, `_storeAdmin.tsx`, `_bookingAdmin.tsx`.
- `page.tsx` → `index.tsx` / `route.tsx` with `loader` + `component`; `metadata` → route `head`.
- `[id]` → `$id.tsx`; `[...slug]` → `$.tsx` where applicable.
- `src/routes/api/**`: 75 Server Routes with `server.handlers`, preserving current URLs, methods, status codes and envelope.
- `src/components`, `src/lib`, `src/services`, `src/store`, `src/types` remain; only Next-specific code is rewritten.

### 5.2 Server entry and middleware

- `src/server.ts` uses `createServerEntry` + `createStartHandler` + `defaultStreamHandler` + `handleStartError`.
- Subdomain resolution from `src/proxy.ts` moves here: resolve tenant slug/type/id with the existing TTL cache, inject `x-tenant-slug`/`x-tenant-id` headers and `tenant-slug`/`module-type`/`tenant-id` cookies, rewrite internally to `/store` or `/booking`.
- The `/api/webhooks/*` rewrite from `next.config.ts` happens before body parsing so signature verification stays lossless.
- `src/start.ts` registers global request middleware: CSRF (`createCsrfMiddleware`, filtered to server functions), logging/trace context, tenant context.
- `manifest.ts` becomes a Server Route returning `Response.json`; `next/font/google` becomes CSS in the root document; `next/image` becomes `<img>`/unpic (remote image patterns no longer apply).

### 5.3 Module mapping

| Current | Target |
|---|---|
| App Router Server Components (async fetch) | Route `loader` + client component using `useLoaderData` |
| `metadata` exports | Route `head` |
| zustand stores (`auth-store`, `tenant-store`, UI stores) | TanStack Store with equivalent persistence |
| Controlled forms (login, register, reset, product/coupon/role/appointment editors) | TanStack Form with shared validators |
| Admin tables (orders, products, users, roles, coupons, appointments, banners/sliders) | TanStack Table headless with existing sort/filter/pagination |
| Long product/log lists | TanStack Virtual |
| React Query usage | Expanded as the single cache; loaders hydrate it; `revalidateTag` replaced by query-key invalidation |
| `next/link`, `useRouter`, `useSearchParams`, `usePathname`, `redirect`, `notFound` | TanStack Router `Link`, hooks, `redirect`, `notFound`; `unstable_rethrow` removed |

## 6. Backend contract (from `../api-neutra-v2`)

Source files inspected: `types/api-response.ts`, `types/error-codes.ts`, `middleware/response.middleware.ts`, `middleware/error.middleware.ts`.

- Envelope: `{ success: boolean, statusCode: number, message: string, data?: T, errors?: ErrorDetail[], pagination?: { total, page, limit, totalPages }, meta: { traceId: string, timestamp: string } }`.
- `ErrorDetail`: `{ code: string, message: string, field?: string, domain?: string, metadata?: unknown }`.
- Error code families: `AUTH_*`, `VALIDATION_*`, `RESOURCE_*`, `TENANT_*`, `BUSINESS_*`, `LOYALTY_*`, `DB_*`, `EXTERNAL_*`, `SYSTEM_*`, `RATE_LIMIT_*`, `WHATSAPP_*`.
- HTTP status is resolved from the domain error **class** (`httpStatusFromDomainError`), not from the code prefix; the BFF must forward the backend status intact.
- BFF must not rebuild the envelope: pass through `status`, `errors`, `pagination`, `meta.traceId`; `204` maps to `null`.
- Frontend `ApiError` keeps `statusCode`, `errors`, `traceId`, the global `unauthorized` event and `x-suppress-unauthorized`.
- UI shows only Spanish messages derived from `errors[].code`; backend `message` is never rendered (existing no-raw-error-messages tests enforce this).
- Server-side loaders use a `serverBackendFetch` built on `getRequestHeader`/`getCookie`, preferring proxy-injected `x-tenant-slug`/`x-tenant-id` over cookies to avoid stale-tenant reads; client-side calls keep going through `/api/*`.

## 7. Error, auth and redirect handling

- Server functions/routes throw typed errors; routes define `errorComponent`.
- `handleStartError` produces generic 500 responses in production and logs with traceId; internal messages/stacks are not exposed.
- `redirect()` / `notFound()` from `@tanstack/react-router` replace Next equivalents.
- Session/tenant helpers (`server-auth.ts`, `server-theme.ts`, `backend-api.ts`, `strapi.ts`) are rewritten as server-only modules using `@tanstack/react-start/server` utilities.
- Every server function or route that reads private data performs its own authorization; route `beforeLoad` is UX only, not the security boundary.

## 8. Testing and parity gates

- Keep Vitest, Testing Library, happy-dom and Biome. Port all 325 tests layer by layer.
- Tests that mock `next/server`/`next/headers` move to Web `Request`/`Response` and `@tanstack/react-start/server` mocks; assertions on envelope, `errors[].code`, traceId and status stay identical.
- Before deleting Next, capture parity fixtures (status, envelope, DOM/links) for: store home, products, cart, login/register, admin tables, booking flows, webhooks.
- Run the same harness against the Start branch and compare; this is the "full parity" gate.
- Exit gates: `0` `next/*` imports, `0` `next` dependency, `npm test`, `npm run build`, `npm run check` (Biome CI) all green, parity harness green, Docker smoke test with tenant subdomain headers.
- Rollback: tag `pre-tanstack-start` on current `main`, keep the previous Docker image; revert the merge commit if cutover fails.

## 9. Execution phases

1. **Base** — Create `rewrite/tanstack-start` from latest `origin/main`; tag `pre-tanstack-start`; capture Next parity fixtures.
2. **Scaffold** — Vite + Start plugin, `__root`, providers, `server.ts`/`start.ts`, Docker/CI; green "hello world" build.
3. **Server seam** — Rewrite `response`, `error-codes`, `api-client`, `backend-api`, `server-auth`, `server-theme`, `strapi`; BFF wrapper; 75 Server Routes; webhooks and manifest. Gate: byte-level contract compatibility for `/api/*`.
4. **Routes and data** — Route tree, pathless layouts, 68 pages to loaders, `metadata → head`, navigation and assets. Gate: parity harness per route group.
5. **UI modules** — zustand → Store, forms → Form, tables → Table, virtualized lists → Virtual.
6. **Tests and hardening** — Port 325 tests, parity harness, zero-Next gates, Docker smoke test, CSRF/tenant scoping review, docs, cutover and rollback drill.

Short rebases from `origin/main` happen between phases because the rewrite branch is long-lived.

## 10. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| RSC-to-loader conversion (75 async components) | Highest effort | Convert group by group with parity fixtures per group; keep `head` metadata mapping mechanical |
| Volume of 75 BFF routes and 325 tests | Medium-high | Rewrite the shared BFF wrapper first; port contract tests before handlers |
| Subdomain rewrite/cookie semantics | Multi-tenant regressions | Implement in custom server entry; smoke test with `x-tenant-*` headers and nip.io-style hosts |
| `origin/main` drift during long branch | Merge conflicts | Rebase after each phase; keep phase diffs small |
| Vite output vs current Docker image | Deploy breakage | Validate Docker image in phase 2 and again in phase 6 |
| Experimental APIs | Churn | Only stable TanStack modules; no RSC, DB or Ranger |

## 11. Estimate and assumptions

- Estimate: **8–14 developer-weeks for one developer**; **4–7 weeks for two developers** familiar with TanStack. Add 20–30% for QA/regression. Highest uncertainty: loader conversion and test porting.
- Assumed team: 1–2 people, no full feature freeze (hence periodic rebases).
- Assumed backend stays available and unchanged during the rewrite; contract tests use the current `StandardResponse` shape.
- Assumed UI/Radix/Tailwind/i18n assets are reused as-is.

## 12. Exit criteria

The rewrite is complete when: no `next` package or `next/*` import remains; all 68 pages and 75 endpoints have Start equivalents; all 325 tests are ported and green; the parity harness matches the captured Next fixtures; lint/build/test/check pass in CI; the Docker image runs on Node 22 port 3001 with tenant subdomain behavior; and the rollback tag/image are verified.

## 13. Out of scope

Backend changes, visual redesign, new features, serverless deployment, experimental TanStack modules, and long-term dual-runtime support. These would be separate requests with their own design work.
