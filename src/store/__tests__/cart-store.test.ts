import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/services/cart.service', () => ({
    cartService: {
        get: vi.fn(),
        addItem: vi.fn(),
        removeItem: vi.fn(),
    },
}));
vi.mock('@/services/products.service', () => ({
    productsService: { getAll: vi.fn() },
}));
vi.mock('@/services/coupons.service', () => ({
    couponsService: { validate: vi.fn() },
}));

import { useCartStore } from '@/store/cart-store';
import { useAuthStore } from '@/store/auth-store';
import { useTenantStore } from '@/store/tenant-store';
import { cartService } from '@/services/cart.service';
import { couponsService } from '@/services/coupons.service';

const mockCart = cartService as unknown as {
    get: ReturnType<typeof vi.fn>;
    addItem: ReturnType<typeof vi.fn>;
    removeItem: ReturnType<typeof vi.fn>;
};
const mockCoupons = couponsService as unknown as {
    validate: ReturnType<typeof vi.fn>;
};

function loginAsStoreUser() {
    useAuthStore.setState({ user: { id: 'u1', name: 'A' } as never });
    useTenantStore.setState({ moduleType: 'store' });
}

beforeEach(() => {
    vi.clearAllMocks();
    useCartStore.setState({
        items: [],
        loading: false,
        error: null,
        coupon: null,
        discount: 0,
        productMap: {},
    });
    useAuthStore.setState({ user: null } as never);
    useTenantStore.setState({ moduleType: null });
});

describe('cart-store.fetchCart', () => {
    it('clears items when not logged in', async () => {
        await useCartStore.getState().fetchCart();
        expect(useCartStore.getState().items).toEqual([]);
        expect(mockCart.get).not.toHaveBeenCalled();
    });

    it('clears items outside store module', async () => {
        loginAsStoreUser();
        useTenantStore.setState({ moduleType: 'booking' });
        await useCartStore.getState().fetchCart();
        expect(mockCart.get).not.toHaveBeenCalled();
    });

    it('maps backend cart shapes into items', async () => {
        loginAsStoreUser();
        mockCart.get.mockResolvedValue([
            { id: 'ci1', productId: 'p1', amount: 2, price: 5, name: 'P1' },
        ]);
        await useCartStore.getState().fetchCart();

        expect(useCartStore.getState().items).toEqual([
            { id: 'p1', cartItemId: 'ci1', name: 'P1', amount: 2, price: 5, image: undefined, stock: undefined },
        ]);
    });

    it('sets error on failure', async () => {
        loginAsStoreUser();
        mockCart.get.mockRejectedValue(new Error('boom'));
        await useCartStore.getState().fetchCart();
        expect(useCartStore.getState().error).toBe('Failed to fetch cart');
    });
});

describe('cart-store.addItem', () => {
    it('requires login', async () => {
        const result = await useCartStore.getState().addItem('p1', 'P1');
        expect(result).toEqual({ success: false, needsLogin: true });
    });

    it('rejects when quantity exceeds stock', async () => {
        loginAsStoreUser();
        useCartStore.setState({ productMap: { p1: { id: 'p1', stock: 1 } as never } });
        const result = await useCartStore.getState().addItem('p1', 'P1', 5);
        expect(result.success).toBe(false);
        expect(result.reason).toMatch(/stock/i);
        expect(mockCart.addItem).not.toHaveBeenCalled();
    });

    it('adds and refreshes the cart', async () => {
        loginAsStoreUser();
        mockCart.addItem.mockResolvedValue(undefined);
        mockCart.get.mockResolvedValue([]);
        const result = await useCartStore.getState().addItem('p1', 'P1', 1);
        expect(result.success).toBe(true);
        expect(mockCart.addItem).toHaveBeenCalledWith({ productId: 'p1', amount: 1 });
    });
});

describe('cart-store.updateQuantity', () => {
    it('rolls back the original item when the add fails', async () => {
        loginAsStoreUser();
        useCartStore.setState({
            items: [{ id: 'p1', cartItemId: 'ci1', name: 'P1', amount: 2 }],
            productMap: { p1: { id: 'p1', stock: 10 } as never },
        });
        mockCart.removeItem.mockResolvedValue(undefined);
        mockCart.addItem.mockRejectedValueOnce(new Error('add failed'));

        await useCartStore.getState().updateQuantity('p1', 5);

        expect(mockCart.removeItem).toHaveBeenCalledWith('ci1');
        expect(mockCart.addItem).toHaveBeenNthCalledWith(1, { productId: 'p1', amount: 5 });
        expect(mockCart.addItem).toHaveBeenNthCalledWith(2, { productId: 'p1', amount: 2 });
    });

    it('ignores quantities above stock', async () => {
        useCartStore.setState({
            items: [{ id: 'p1', cartItemId: 'ci1', name: 'P1', amount: 1 }],
            productMap: { p1: { id: 'p1', stock: 2 } as never },
        });
        await useCartStore.getState().updateQuantity('p1', 9);
        expect(mockCart.removeItem).not.toHaveBeenCalled();
    });
});

describe('cart-store.applyCoupon', () => {
    it('computes percent discount over the subtotal', async () => {
        loginAsStoreUser();
        useCartStore.setState({
            items: [
                { id: 'p1', cartItemId: 'c1', name: 'P1', amount: 2, price: 10 },
                { id: 'p2', cartItemId: 'c2', name: 'P2', amount: 1, price: 10 },
            ],
            productMap: {
                p1: { id: 'p1', price: 10 } as never,
                p2: { id: 'p2', price: 10 } as never,
            },
        });
        mockCoupons.validate.mockResolvedValue({
            coupon: { code: 'X10', type: 'PERCENT', value: 10 },
        });

        const result = await useCartStore.getState().applyCoupon('X10');

        expect(mockCoupons.validate).toHaveBeenCalledWith('X10', 30, ['p1', 'p2'], []);
        expect(result.success).toBe(true);
        expect(useCartStore.getState().discount).toBe(3);
        expect(useCartStore.getState().coupon).toEqual({ code: 'X10', type: 'percent', value: 10 });
    });

    it('returns invalid when no coupon matches', async () => {
        mockCoupons.validate.mockResolvedValue({ coupon: null });
        const result = await useCartStore.getState().applyCoupon('NOPE');
        expect(result).toEqual({ success: false, reason: 'invalid' });
    });

    it('removeCoupon resets discount', () => {
        useCartStore.setState({ coupon: { code: 'X', type: 'percent', value: 5 }, discount: 5 });
        useCartStore.getState().removeCoupon();
        expect(useCartStore.getState().coupon).toBeNull();
        expect(useCartStore.getState().discount).toBe(0);
    });
});
