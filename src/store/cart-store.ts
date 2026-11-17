import {
    type CartActions,
    type CartData,
    cartStore,
} from "./tanstack/cart-store";
import { createStoreHook } from "./tanstack/create-store-hook";

export const useCartStore = createStoreHook<CartData, CartActions>(cartStore);

export type {
    CartState,
    ContextCoupon,
    MappedCartItem,
} from "./tanstack/cart-store";
