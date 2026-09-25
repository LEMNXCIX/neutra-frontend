// @vitest-environment happy-dom
import { createElement } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const componentMocks = vi.hoisted(() => ({
    cart: null as unknown,
    apiFetch: vi.fn(),
    routerPush: vi.fn(),
    toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/hooks/use-cart', () => ({
    useCart: () => componentMocks.cart,
}));
vi.mock('@/hooks/useFeatures', () => ({
    useFeatures: () => ({ isFeatureEnabled: () => true }),
}));
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: componentMocks.routerPush }),
}));
vi.mock('@/lib/api-fetch', () => ({
    apiFetch: componentMocks.apiFetch,
}));
vi.mock('sonner', () => ({
    toast: componentMocks.toast,
}));

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
import { ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { useTenantStore } from '@/store/tenant-store';
import { cartService } from '@/services/cart.service';
import { couponsService } from '@/services/coupons.service';
import CartClient, { CouponCard } from '@/app/(store)/cart/cart-client';

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
    mockCart.get.mockReset();
    mockCart.addItem.mockReset();
    mockCart.removeItem.mockReset();
    mockCoupons.validate.mockReset();
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
    it('uses the server-calculated discount instead of recomputing it', async () => {
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
            valid: true,
            coupon: { code: 'X10', type: 'PERCENT', value: 10 },
            discountAmount: 2.5,
        });

        const result = await useCartStore.getState().applyCoupon('X10');

        expect(mockCoupons.validate).toHaveBeenCalledWith('X10', 30, ['p1', 'p2'], []);
        expect(result.success).toBe(true);
        expect(useCartStore.getState().discount).toBe(2.5);
        expect(useCartStore.getState().coupon).toEqual({ code: 'X10', type: 'percent', value: 10 });
    });

    it('rounds and clamps the server discount to the subtotal', async () => {
        loginAsStoreUser();
        useCartStore.setState({
            items: [{ id: 'p1', cartItemId: 'c1', name: 'P1', amount: 1, price: 10 }],
            productMap: { p1: { id: 'p1', price: 10 } as never },
        });
        mockCoupons.validate.mockResolvedValue({
            valid: true,
            coupon: { code: 'MAX', type: 'PERCENT', value: 50 },
            discountAmount: 99.999,
        });

        await useCartStore.getState().applyCoupon('MAX');

        expect(useCartStore.getState().discount).toBe(10);
    });

    it('preserves reward context from validation', async () => {
        mockCoupons.validate.mockResolvedValue({
            valid: true,
            coupon: { code: 'REWARD', type: 'FIXED', value: 5, isReward: true },
            discountAmount: 5,
        });

        await useCartStore.getState().applyCoupon('REWARD');

        expect(useCartStore.getState().coupon).toEqual({
            code: 'REWARD',
            type: 'amount',
            value: 5,
            isReward: true,
        });
    });

    it('clears a stale coupon when validation fails', async () => {
        useCartStore.setState({
            coupon: { code: 'OLD', type: 'percent', value: 50 },
            discount: 5,
        });
        mockCoupons.validate.mockResolvedValue({
            valid: false,
            message: 'El monto mínimo no se alcanza',
        });

        const result = await useCartStore.getState().applyCoupon('OLD');

        expect(result).toEqual({ success: false, reason: 'El monto mínimo no se alcanza' });
        expect(useCartStore.getState().coupon).toBeNull();
        expect(useCartStore.getState().discount).toBe(0);
    });

    it('extracts the backend validation detail when the request errors', async () => {
        mockCoupons.validate.mockRejectedValue(
            new ApiError('Request failed', 400, [{ message: 'El cupón expiró' }]),
        );

        const result = await useCartStore.getState().applyCoupon('EXPIRED');

        expect(result).toEqual({ success: false, reason: 'El cupón expiró' });
        expect(useCartStore.getState().coupon).toBeNull();
        expect(useCartStore.getState().discount).toBe(0);
    });

    it('returns invalid when no coupon matches', async () => {
        mockCoupons.validate.mockResolvedValue({ valid: false });
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

describe('cart-store coupon revalidation', () => {
    it('clears an applied coupon after a quantity change makes it invalid', async () => {
        loginAsStoreUser();
        useCartStore.setState({
            items: [{ id: 'p1', cartItemId: 'ci1', name: 'P1', amount: 2, price: 10 }],
            productMap: { p1: { id: 'p1', price: 10, stock: 10 } as never },
            coupon: { code: 'MIN10', type: 'percent', value: 10 },
            discount: 2,
        });
        mockCart.removeItem.mockResolvedValue(undefined);
        mockCart.addItem.mockResolvedValue(undefined);
        mockCart.get.mockResolvedValue([
            { id: 'ci1', productId: 'p1', name: 'P1', amount: 1, price: 10 },
        ]);
        mockCoupons.validate.mockResolvedValue({
            valid: false,
            message: 'El monto mínimo no se alcanza',
        });

        await useCartStore.getState().updateQuantity('p1', 1);

        expect(mockCoupons.validate).toHaveBeenCalledWith('MIN10', 10, ['p1'], []);
        expect(useCartStore.getState().coupon).toBeNull();
        expect(useCartStore.getState().discount).toBe(0);
    });

    it('revalidates an applied coupon after a cart fetch', async () => {
        loginAsStoreUser();
        useCartStore.setState({
            items: [],
            coupon: { code: 'SAVE10', type: 'amount', value: 5, isReward: true },
            discount: 5,
        });
        mockCart.get.mockResolvedValue([
            { id: 'ci1', productId: 'p1', name: 'P1', amount: 2, price: 20 },
        ]);
        mockCoupons.validate.mockResolvedValue({
            valid: true,
            coupon: { code: 'SAVE10', type: 'FIXED', value: 5 },
            discountAmount: 7,
        });

        await useCartStore.getState().fetchCart();

        expect(mockCoupons.validate).toHaveBeenCalledWith('SAVE10', 40, ['p1'], []);
        expect(useCartStore.getState().coupon).toEqual({
            code: 'SAVE10',
            type: 'amount',
            value: 5,
            isReward: true,
        });
        expect(useCartStore.getState().discount).toBe(7);
    });
});

describe('cart coupon UI', () => {
    beforeEach(() => {
        componentMocks.cart = {
            items: [{ id: 'p1', name: 'P1', price: 10, amount: 1 }],
            removeItem: vi.fn(),
            updateQuantity: vi.fn(),
            loading: false,
            refresh: vi.fn().mockResolvedValue(undefined),
            applyCoupon: vi.fn(),
            removeCoupon: vi.fn(),
            coupon: { code: 'REWARD', type: 'amount', value: 5, isReward: true },
            discount: 5,
            subtotal: 10,
        };
        componentMocks.apiFetch.mockReset();
        componentMocks.routerPush.mockReset();
        componentMocks.toast.success.mockReset();
        componentMocks.toast.error.mockReset();
    });

    it('shows a loyalty reward label for reward coupons', () => {
        render(
            createElement(CouponCard, {
                code: '',
                onCodeChange: vi.fn(),
                onApply: vi.fn(),
                onRemove: vi.fn(),
                coupon: { code: 'REWARD', type: 'amount', value: 5, isReward: true },
                discount: 5,
                applyingCoupon: false,
            }),
        );

        expect(screen.getByText('Recompensa de fidelización')).toBeInTheDocument();
        expect(screen.getByText(/5\.00/)).toBeInTheDocument();
    });

    it('sends the applied coupon code at checkout', async () => {
        componentMocks.apiFetch
            .mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue({ order: { id: 'order-1' } }),
            })
            .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({}) });

        render(createElement(CartClient));
        fireEvent.change(screen.getByPlaceholderText('DIRECCIÓN COMPLETA DE ENVÍO'), {
            target: { value: 'Calle 123' },
        });
        fireEvent.click(screen.getByRole('button', { name: /realizar pedido/i }));

        await waitFor(() => expect(componentMocks.apiFetch).toHaveBeenCalled());
        const request = componentMocks.apiFetch.mock.calls[0][1] as RequestInit;
        const body = JSON.parse(String(request.body)) as { couponCode?: string };
        expect(body.couponCode).toBe('REWARD');
    });
});
