import { createFileRoute } from "@tanstack/react-router";
import CartClient from "@/app/(store)/cart/cart-client";

export const Route = createFileRoute("/_store/cart/")({
    head: () => ({
        meta: [
            { title: "Carrito" },
            {
                name: "description",
                content: "Revisa tu carrito de compras",
            },
        ],
    }),
    component: CartRoute,
});

function CartRoute() {
    return <CartClient />;
}
