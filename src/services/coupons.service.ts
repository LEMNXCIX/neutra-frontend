import { api } from '@/lib/api-client';

export type Coupon = {
    code: string;
    type: 'amount' | 'percent';
    value: number;
    used?: boolean;
    expires?: string;
    createdAt?: string;
    updatedAt?: string;
};

export type CreateCouponDto = {
    code: string;
    type: 'amount' | 'percent';
    value: number;
    expires?: string;
};

/**
 * Coupons Service
 * Handles coupon-related API calls
 */
export const couponsService = {
    /**
     * Get all coupons
     */
    getAll: async (): Promise<Coupon[]> => {
        return api.get<Coupon[]>('/coupons');
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
    validate: async (code: string): Promise<{ valid: boolean; coupon?: Coupon }> => {
        return api.post<{ valid: boolean; coupon?: Coupon }>('/coupons/validate', { code });
    },

    /**
     * Create new coupon (requires authentication)
     */
    create: async (data: CreateCouponDto): Promise<Coupon> => {
        return api.post<Coupon>('/coupons', data);
    },

    /**
     * Update coupon (requires authentication)
     */
    update: async (code: string, data: Partial<CreateCouponDto>): Promise<Coupon> => {
        return api.put<Coupon>(`/coupons/${code}`, data);
    },

    /**
     * Delete coupon (requires authentication)
     */
    delete: async (code: string): Promise<Coupon> => {
        return api.delete<Coupon>(`/coupons/${code}`);
    },
};
