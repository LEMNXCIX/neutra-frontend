# Loyalty Coupon Selector

## Goal

Hide the customer loyalty card until the program has a valid reward configuration, and replace the raw reward coupon UUID input with a selector of eligible shared coupon templates.

## Coupon model

- The configured value is a shared coupon template: `ownerId=null`, `isReward=false`, active, and not expired.
- Claiming creates a personal coupon clone with `isReward=true`, one use, and the customer's owner.
- The selector must not offer personal reward clones or expired/inactive templates.

## Tasks

1. [x] Hide `LoyaltyCard` when the summary status is `NOT_CONFIGURED`.
2. [x] Load shared coupons for the tenant and filter to active, unexpired templates.
3. [x] Replace the UUID input in the tenant Booking form with an accessible coupon selector while preserving the current selected ID.
4. [x] Add regression tests for hidden unconfigured cards and selector choices/save payload.
5. [x] Run focused loyalty tests, full frontend tests, TypeScript, lint, and diff checks.

## Acceptance criteria

- [x] No customer card is shown for `NOT_CONFIGURED`.
- [x] A configured valid template can be selected and saved by ID.
- [x] Ineligible coupons are not offered.
- [x] Normal coupon behavior and the existing loyalty claim flow remain unchanged.

## Delivery note

Work remains in the current working tree. No commit is created unless explicitly requested.
