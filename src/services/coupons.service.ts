import { api } from '@/lib/api-client';
import {
    Coupon,
    CreateCouponDTO,
    UpdateCouponDTO,
    CouponValidationResult
} from '@/types/coupon.types';

/**
 * Coupons Service
 * Handles coupon-related API calls
 */
export const couponsService = {
    /**
     * Get all coupons
     */
    getAll: async (tenantId?: string): Promise<Coupon[]> => {
        const url = tenantId ? `/admin/coupons?tenantId=${tenantId}` : '/admin/coupons';
        return api.get<Coupon[]>(url);
    },

    /**
     * Get coupon by code
     */
    getByCode: async (code: string): Promise<Coupon> => {
        return api.get<Coupon>(`/coupons/${code}`);
    },

    /**
     * Validate coupon
     */
    validate: async (code: string, orderTotal: number, productIds?: string[], categoryIds?: string[], serviceIds?: string[]): Promise<CouponValidationResult> => {
        return api.post<CouponValidationResult>('/coupons/validate', {
            code,
            orderTotal,
            productIds,
            categoryIds,
            serviceIds
        });
    },

    /**
     * Create new coupon (requires authentication)
     */
    create: async (data: CreateCouponDTO): Promise<Coupon> => {
        return api.post<Coupon>('/admin/coupons', data);
    },

    /**
     * Update coupon (requires authentication)
     */
    update: async (id: string, data: UpdateCouponDTO): Promise<Coupon> => {
        return api.put<Coupon>(`/admin/coupons/${id}`, data);
    },

    /**
     * Delete coupon (requires authentication)
     */
    delete: async (id: string): Promise<Coupon> => {
        return api.delete<Coupon>(`/admin/coupons/${id}`);
    },

    /**
     * Get coupon statistics (requires authentication)
     */
    getStats: async (): Promise<{ totalCoupons: number; activeCoupons: number; usedCoupons: number }> => {
        return api.get<{ totalCoupons: number; activeCoupons: number; usedCoupons: number }>('/coupons/stats');
    },
};
