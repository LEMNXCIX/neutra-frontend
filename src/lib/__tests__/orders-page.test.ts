import { describe, expect, it } from 'vitest';
import { parseOrdersResponse } from '@/lib/orders-page';

const ENVELOPE = {
    success: true,
    data: [
        { id: 'o1' },
        { id: 'o2' },
    ],
    meta: {
        pagination: { page: 2, limit: 10, total: 25, totalPages: 3 },
    },
};

describe('parseOrdersResponse', () => {
    it('maps the full envelope into the table shape', () => {
        const result = parseOrdersResponse(
            ENVELOPE,
            { totalOrders: 25, totalRevenue: 100, statusCounts: { PENDIENTE: 2 } },
            [{ value: 'PENDIENTE', label: 'Pending' }],
            2,
            10,
        );

        expect(result.orders).toHaveLength(2);
        expect(result.pagination).toEqual({
            currentPage: 2,
            totalPages: 3,
            totalItems: 25,
            itemsPerPage: 10,
        });
        expect(result.stats.totalOrders).toBe(25);
        expect(result.statuses).toHaveLength(1);
    });

    it('falls back to request page/limit when meta is missing', () => {
        const result = parseOrdersResponse(
            { data: [{ id: 'o1' }] },
            {},
            [],
            4,
            25,
        );

        expect(result.pagination).toEqual({
            currentPage: 4,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: 25,
        });
    });

    it('empty orders fallback when data is not an array', () => {
        const result = parseOrdersResponse(undefined, undefined, undefined, 1, 10);

        expect(result.orders).toEqual([]);
        expect(result.stats).toEqual({
            totalOrders: 0,
            totalRevenue: 0,
            statusCounts: {},
        });
        expect(result.statuses).toEqual([]);
    });
});
