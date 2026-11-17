# Neutra

Multi-tenant storefront + booking + admin frontend on **TanStack Start** (React
Router + Vite). The custom server entry (`src/server.ts`) resolves the tenant
from the request subdomain, injects `x-tenant-slug` / `x-tenant-id` for every
downstream call, and forwards `/api/webhooks/*` to the backend unchanged.
Everything under `/api` is a BFF route handler: browser traffic reaches the
backend only through it.

## Getting started

```bash
cp .env.example .env
npm install
npm run dev
```

Requires **Node >= 22.12**. The dev server listens on **3001** (`npm run dev`
pins it). One instance serves every tenant; there is no per-port tenant routing.

## Environment

`BACKEND_API_URL` is the only backend address the server needs, and it is
required. It is read through `src/lib/backend-url.ts`, which throws rather than
guessing when the variable is missing, so a misconfigured environment fails at
the call site instead of silently pointing at the wrong host.

The browser never needs the backend address: it calls the BFF at `/api`.
`STRAPI_URL` / `STRAPI_TOKEN` are only read from server-fn boundaries for CMS
content. `REVALIDATE_SECRET`, when set, is required on `POST /api/revalidate`
via the `x-revalidate-secret` header.

## Tenants

Tenant identity comes from the subdomain, never from the port. Both the LAN
nip.io host and the loopback `*.localhost` host resolve the same way; the root
host without a subdomain is the superadmin surface.

| URL | Resolves to |
| --- | --- |
| `http://<slug>.<lan-ip>.nip.io:3001` | tenant `<slug>`, from any device on the LAN |
| `http://<slug>.localhost:3001` | tenant `<slug>`, desktop only |
| `http://localhost:3001` | superadmin |

`*.localhost` resolves to loopback natively in every modern browser, so desktop
development needs no extra tooling. For a physical device, open the app through
the LAN IP — `getTenantUrl` rewrites it to the matching `<slug>.<ip>.nip.io`
host, and the same mechanism is what production uses.

Browsing from another device also needs HMR to accept the cross-origin websocket.
List those hostnames in `DEV_ORIGINS` (comma-separated), e.g.
`192.168.68.100,*.192.168.68.100.nip.io`. The derivation lives in the pure
`vite-dev-hosts.ts` helper, so no address is hardcoded in `vite.config.ts` — a
pinned LAN IP would break HMR for everyone on a different network.

## BFF and webhooks

`/api/webhooks/:path*` is forwarded verbatim by the server entry: method, raw
bytes and every header (including the signature) reach
`${BACKEND_API_URL}/webhooks/:path*`, with no tenant headers or cookies added.
Everything else under `/api` is a real route handler in `src/routes/api/**`;
a missing one returns 404 rather than silently proxying without tenant context,
trace id or error normalization. Proxy routes use `createRouteHandler` from
`src/lib/api-route-handler.ts`.

Backend envelopes are forwarded untouched: status, `errors[].code`,
`pagination`, `meta.traceId`, multi-valued `set-cookie` and 204 responses keep
their wire shape. `src/lib/error-messages.ts` translates every published error
code; unknown domains fall back by domain prefix, never to the backend's
English `message`.

## CMS content and revalidation

`src/lib/strapi.ts` reads published CMS entries through a 60-second tagged
cache (`src/lib/content-cache.ts`, tag `content:<tenantId>`). Strapi publish /
unpublish events call `POST /api/revalidate`; the handler purges that tenant's
tag, invalidates server-side registered TanStack Query clients
(`src/lib/query-invalidation.ts`) and emits a revalidation event. The custom
server entry exposes that event stream at `GET /api/revalidate/events` (SSE),
which the browser `QueryProvider` subscribes to so its own QueryClient refetches
too. The HTTP contract — secret check, payload validation and the
`{ ok, revalidated }` / `{ ok: false }` responses — is unchanged.

The cache and the event stream are process-local: in a multi-replica deployment
the webhook invalidates only the replica that receives it, and other replicas
age out within the 60-second TTL. Put the webhook behind a sticky route or add a
shared broadcast before running more than one replica.

## Verification

Run all gates locally before cutover:

```bash
npm test                 # Vitest suite + full parity sweep + cutover gates
npm run build            # Vite / TanStack Start production build
npm run check            # Biome CI (formatting + lint rules, no writes)
npm run typecheck        # tsc --noEmit
npx vitest run tests/parity/full.test.ts   # parity fixtures + static gates
npm run parity:capture   # optional: refresh fixtures from a live server
npm run parity:compare   # compare a running server against fixtures
```

### Parity evidence and its limitation

The parity suite compares every path in `tests/parity/routes.json` against the
captured fixtures in the same `tests/parity` area. **Those fixtures were
generated from deterministic mocks: no live Next app or Strapi backend was
available in the rewrite environment.** They are snapshots of `status`,
trace-id presence, sorted `href`s and envelope keys — not a byte-for-byte
comparison against a running production Next deployment. Treat a green parity
sweep as evidence that the rewrite preserved the mocked contract and routing
surface, not as proof of real Next parity. A live capture against the retired
Next app (before it is stopped) is still the stronger pre-cutover check.

The full suite (`463 passing, 3 skipped` at the time of writing) plus
build/check/typecheck, the zero-Next gates in `tests/no-next-imports.test.ts`
and `tests/parity/full.test.ts`, and the Docker smoke below are the available
cutover evidence.

### Docker smoke

```bash
docker build -t neutra-start:verify .
docker run -d --name neutra-start-smoke -p 3001:3001 \
  -e BACKEND_API_URL=http://localhost:4000/api \
  neutra-start:verify
curl -sS -X POST http://localhost:3001/api/revalidate \
  -H 'content-type: application/json' \
  -H 'x-tenant-slug: store' -H 'x-tenant-id: tenant-1' \
  -d '{"entry":{"tenantId":"tenant-1"}}'
# => {"ok":true,"revalidated":"content:tenant-1"}
docker rm -f neutra-start-smoke
```

The smoke deliberately sends both tenant headers; the server entry must accept
them and the BFF must still return the unchanged revalidation contract.

## Cutover and rollback

Cutover is a human decision after final review. Do **not** push or merge from a
verification branch.

1. Before merging, tag the current production commit so the previous image is
   recoverable: `git tag pre-tanstack-start origin/main && git push origin pre-tanstack-start`.
   Record the currently deployed Docker image digest/tag.
2. Verify on `rewrite/tanstack-start` (all verification commands above) and
   rebase onto the latest `origin/main`. Stop if the rebase produces
   cross-branch product conflicts — resolve those with the owning teams.
3. Merge with a **merge commit** (not squash, not rebase merge) so the whole
   rewrite is one revertible change. Tag the resulting merge
   `tanstack-start-cutover`.
4. Build the release image from the merge commit and roll it out.

Rollback is deliberately one revert plus an image swap:

```bash
# On main, revert the merge commit (keep its first parent as the mainline).
git revert -m 1 <merge-commit-sha>
# Redeploy the image recorded in step 1 (the pre-tanstack-start build).
docker pull <previous-image> && docker run ... <previous-image>
```

Reverting the merge restores the pre-rewrite Next app and configuration;
redeploying the previous image returns traffic to it without a rebuild. The
`pre-tanstack-start` tag and the recorded image are the two things to verify
exist before starting step 3. Re-run the verification commands after a rollback
to confirm the restored tree is green.
