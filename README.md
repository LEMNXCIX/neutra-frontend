# Neutra

Multi-tenant Next.js frontend. `src/proxy.ts` resolves the tenant from the request
subdomain and injects `x-tenant-slug` / `x-tenant-id` for every downstream call.
`src/app/api/**` is a BFF: browser traffic reaches the backend only through it.

## Getting started

```bash
cp .env.example .env
npm install
npm run dev
```

The dev server listens on **3001** (`npm run dev` pins it). One instance serves
every tenant; there is no per-port tenant routing.

## Environment

`BACKEND_API_URL` is the only backend address the server needs, and it is
required. It is read through `src/lib/backend-url.ts`, which throws rather than
guessing when the variable is missing, so a misconfigured environment fails at
the call site instead of silently pointing at the wrong host.

The browser never needs the backend address: it calls the BFF at `/api`.

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
`192.168.68.100,*.192.168.68.100.nip.io`. No address is hardcoded in
`next.config.ts`, because a pinned LAN IP breaks HMR for everyone on a different
network.

## BFF

`next.config.ts` rewrites exactly one path, `/api/webhooks/:path*`, because
webhooks are server-to-server and the backend verifies the signature. Everything
else under `/api` is a real route handler: a missing one returns 404 rather than
silently proxying to the backend without tenant context, trace id or error
normalization. Proxy routes through `createRouteHandler` from
`src/lib/api-route-handler.ts` instead of hand-rolling `fetch`.
