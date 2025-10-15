"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/cart-context';
import { apiFetch } from '@/lib/api-fetch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/context/toast-context';

export default function CartClient() {
  const { items, removeItem, loading, refresh } = useCart();
  const [address, setAddress] = useState('');
  const [placing, setPlacing] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const total = items.reduce((s, it) => s + (it.qty * 100), 0) / 100; // placeholder pricing

  const placeOrder = async () => {
    if (items.length === 0) return showToast('Cart empty', 'error');
    setPlacing(true);
    try {
      const res = await apiFetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: items.map(i=>({ id: i.id, qty: i.qty })), address }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data?.error || 'Failed to place order', 'error');
        setPlacing(false);
        return;
      }

      // clear cart in a single call
      await apiFetch('/api/cart', { method: 'DELETE' });
      await refresh();
      showToast('Order placed', 'success');
      // server returns order id
      const orderId = data?.order?.id;
      if (orderId) router.push(`/orders/${orderId}`);
      else router.push('/profile');
    } catch (err) {
  const msg = (err && typeof err === 'object' && 'message' in err) ? (err as { message?: string }).message : String(err);
      showToast(msg || 'Unexpected error', 'error');
    } finally {
      setPlacing(false);
    }
  };

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
      <div className="mt-6 border p-4 rounded">
        <h2 className="text-lg font-medium mb-2">Checkout</h2>
        <label className="block text-sm text-muted-foreground mb-1">Delivery address</label>
        <input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full p-2 border rounded mb-3" placeholder="Calle, ciudad, etc." />
        <div className="flex items-center justify-between">
          <div className="text-sm">Total: <strong>${total.toFixed(2)}</strong></div>
          <Button onClick={placeOrder} disabled={placing || loading}>{placing ? 'Placing...' : 'Place Order'}</Button>
        </div>
      </div>
    </div>
  );
}
