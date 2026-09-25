import { describe, expect, it } from 'vitest';
import {
    STORE_ADMIN_NAV,
    BOOKING_ADMIN_NAV,
    SUPER_ADMIN_NAV,
} from '@/config/admin-navigation';

// The platform feature catalog (prisma/seed.ts / features table).
// A requiredFeature that is NOT in this list silently hides the nav item
// forever — this is exactly how the WHATSAPP_NOTIFICATIONS vs WHATSAPP_API
// mismatch happened. Keep both sides in sync.
const FEATURE_CATALOG = [
    'COUPONS',
    'EMAIL_NOTIFICATIONS',
    'BANNERS',
    'SLIDES',
    'LOYALTY',
    'WHATSAPP_API',
];

const NAVS: Array<[string, typeof STORE_ADMIN_NAV]> = [
    ['STORE_ADMIN_NAV', STORE_ADMIN_NAV],
    ['BOOKING_ADMIN_NAV', BOOKING_ADMIN_NAV],
    ['SUPER_ADMIN_NAV', SUPER_ADMIN_NAV],
];

describe('admin navigation feature keys', () => {
    for (const [name, nav] of NAVS) {
        it(`${name}: every required feature exists in the feature catalog`, () => {
            for (const item of nav) {
                const requiredFeatures = [
                    ...(item.requiredFeature ? [item.requiredFeature] : []),
                    ...(item.requiredFeatures ?? []),
                ];
                for (const feature of requiredFeatures) {
                    expect(
                        FEATURE_CATALOG,
                        `${name} item "${item.label}" references unknown feature "${feature}"`,
                    ).toContain(feature);
                }
            }
        });
    }

    it('requires LOYALTY and COUPONS for booking loyalty while keeping super-admin unconditional', () => {
        expect(
            BOOKING_ADMIN_NAV.find((item) => item.href === '/admin/loyalty')
                ?.requiredFeatures,
        ).toEqual(['LOYALTY', 'COUPONS']);
        expect(
            SUPER_ADMIN_NAV.find((item) => item.href === '/admin/loyalty')
                ?.requiredFeatures,
        ).toBeUndefined();
    });

    it('preserves single-feature gating for existing navigation items', () => {
        const coupons = STORE_ADMIN_NAV.find(
            (item) => item.href === '/admin/coupons',
        );
        expect(coupons?.requiredFeature).toBe('COUPONS');
        expect(coupons?.requiredFeatures).toBeUndefined();
    });

    it('orders/appointments no longer depend on removed features', () => {
        for (const nav of [STORE_ADMIN_NAV, BOOKING_ADMIN_NAV]) {
            for (const item of nav) {
                if (['/admin/orders', '/admin/appointments'].includes(item.href)) {
                    expect(item.requiredFeature).toBeUndefined();
                }
            }
        }
    });

    it('hrefs are unique within each nav', () => {
        for (const [name, nav] of NAVS) {
            const hrefs = nav.map((i) => i.href);
            expect(new Set(hrefs).size, `${name} has duplicate hrefs`).toBe(hrefs.length);
        }
    });
});
