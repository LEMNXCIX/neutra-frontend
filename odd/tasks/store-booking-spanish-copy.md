# Store and Booking Spanish Copy

## Goal

Translate all user-visible English copy in the Store and Booking modules into neutral professional Spanish.

## Scope

- Store customer-facing routes under `src/app/(store)`.
- Store administration routes under `src/app/store-admin` and their Store UI components.
- Booking customer-facing routes under `src/app/(booking)`.
- Booking administration routes under `src/app/booking-admin` and their Booking UI components.
- Buttons, labels, placeholders, validation messages, toasts, dialogs, tables, empty/loading/error states, and visible status text.

## Out of scope

- Internal logs, API error payloads, technical identifiers, route names, and developer-only diagnostics.
- Changes to business behavior, validation rules, API contracts, or data models.
- User-owned changes already present in the working tree.

## Tasks

1. [x] Build a precise English-copy inventory and preserve the current working-tree baseline. The initial scan found 70 candidate files and 570 raw visible-text candidates across the agreed surfaces; the pre-edit diff was captured separately.
2. [x] Translate Booking customer and administrator UI copy.
3. [x] Audit and translate remaining Store customer and administrator UI copy.
4. [x] Re-scan both modules for missed user-visible English strings. The remaining English copy is confined to the super-admin tenant setup wizard, outside the agreed Store/Booking scope.
5. [x] Run focused verification and review the final diff for unrelated changes. TypeScript, lint, and all 123 tests pass; the optional production build remains blocked by the pre-existing missing `@vercel/turbopack-next/internal/font/google/font` module.

## Acceptance criteria

- [x] No user-visible English copy remains in the agreed Store and Booking surfaces.
- [x] Existing Spanish copy remains unchanged unless a correction is required for consistency.
- [x] Internal technical strings and existing user-owned changes remain intact.
- [x] TypeScript, lint, and focused tests pass for touched files.
- [x] Task changes are limited to copy/localization and matching tests; pre-existing unrelated changes remain intact.

## Delivery note

Work remains in the current working tree. No commit is created unless the user explicitly requests one.
