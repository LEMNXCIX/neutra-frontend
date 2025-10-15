"use client";
import React from 'react';
import { useCart } from '@/context/cart-context';
import { Button } from '@/components/ui/button';

export default function CartClient() {
  const { items, removeItem, loading } = useCart();

  if (!items || items.length === 0) return <div className="p-6">Your cart is empty.</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Your Cart</h1>
      <ul className="space-y-4">
        {items.map((it) => (
          <li key={it.id} className="flex items-center justify-between border p-3 rounded-md">
            <div>
              <div className="font-medium">{it.name}</div>
              <div className="text-sm text-muted-foreground">Quantity: {it.qty}</div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => removeItem(it.id)} disabled={loading}>{loading ? '...' : 'Remove'}</Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
