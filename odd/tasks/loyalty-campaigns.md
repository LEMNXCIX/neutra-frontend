# Loyalty Campaigns

## Goal

Deliver the campaign-aware customer, tenant-admin, super-admin, and STORE coupon interfaces for the shared loyalty campaign engine.

## Confirmed Behavior

- Customer progress and claims are scoped by campaign; one campaign may be selected explicitly.
- Tenant administrators create campaigns and their reward template in one flow; no arbitrary coupon UUID selector.
- Campaign metrics are completed-source count or net spend.
- STORE reward coupons are supported for products; BOOKING rewards remain service-compatible.
- `LOYALTY` visibility requires the tenant to have `LOYALTY` and `COUPONS` enabled by backend policy.
- STORE coupon entry uses a coupon code and displays the validated discount before checkout.

## Tasks

1. [x] **F1 — Add campaign BFF contracts and services.** Proxy campaign CRUD/lifecycle, summaries, claims, reward creation, and super-admin overview with typed error handling.
2. [x] **F2 — Build campaign administration.** Add draft creation, integrated reward definition, lifecycle actions, metrics/scope controls, and tenant/super-admin views.
3. [x] **F3 — Build customer campaign UX.** Show active progress, claimable prior campaigns, claim actions, and issued coupon state.
4. [x] **F4 — Align STORE coupon checkout.** Sends couponCode, uses the server-calculated discount, revalidates after cart mutations, labels loyalty rewards, and exposes precise validation errors.
5. [x] **F5 — Verify and deliver.** Focused and full Vitest, TypeScript, lint, production build, route generation, and diff checks pass; no live browser/backend/database redemption was performed.

## Acceptance Criteria

- Tenant scope comes from authenticated headers/context, never customer-supplied identity.
- One active campaign is shown for accrual while ended campaigns remain claimable.
- Campaign forms prevent invalid dates, metrics, source scopes, and reward definitions.
- Reward templates are created through loyalty administration and are not directly redeemable templates.
- STORE customers can validate and redeem personal reward coupons against eligible products.
- Disabled `LOYALTY` or `COUPONS` features fail closed in the UI and backend.
- Existing STORE, BOOKING, coupon, and navigation behavior remains covered.

## Verification Evidence

- Focused campaign/store Vitest: 8 files, 57 tests passed.
- Full Vitest: 26 files, 164 tests passed.
- TypeScript: `./node_modules/.bin/tsc --noEmit --incremental false` passed.
- Lint: `npm run lint` passed.
- Production build: passed, 69 static pages generated; build-induced tsconfig change was reverted as generated state.
- Next route generation and diff checks passed.
- Non-blocking warnings remain for Vite config loading, font-fetch teardown, and deprecated server-side `NEXT_PUBLIC_API_URL` fallback.

## Commit Evidence

- `1ad8dbc feat(loyalty): add campaign management UI`
- `8e0b9f7 fix(store): use validated coupon discounts`

## Recovery Copy

- Local document: `odd/tasks/loyalty-campaigns.md`
- Engram topic: `odd/loyalty-campaigns/tasks`
- Engram mirror status: pending; current Engram provider is unavailable.
