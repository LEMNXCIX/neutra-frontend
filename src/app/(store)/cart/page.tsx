import CartClient from './cart-client';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Carrito",
  description: "Revisá tu carrito de compras",
};

export default function CartPage() {
  return <CartClient />;
}
