import type { Metadata } from "next";
import CartClient from "./cart-client";

export const metadata: Metadata = {
    title: "Carrito",
    description: "Revisa tu carrito de compras",
};

export default function CartPage() {
    return <CartClient />;
}
