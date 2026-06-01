import CartClient from './cart-client';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review your shopping cart",
};

export default function CartPage() {
  return <CartClient />;
}
