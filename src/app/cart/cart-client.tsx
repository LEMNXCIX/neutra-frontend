"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/cart-context';
import { apiFetch } from '@/lib/api-fetch';
import { Button } from '@/components/ui/button';
import { toast } from "sonner";

export default function CartClient() {
  const { items, removeItem, loading, refresh, applyCoupon, removeCoupon, coupon, discount, subtotal } = useCart();
  const [address, setAddress] = useState('');
  const [placing, setPlacing] = useState(false);
  const [code, setCode] = useState('');
  const router = useRouter();

  // subtotal from cart context already represents placeholder pricing

  const placeOrder = async () => {
    if (items.length === 0) return toast.error('Cart empty');
    setPlacing(true);
    try {
      const bodyPayload = { items: items.map(i => ({ id: i.id, qty: i.qty })), address, couponCode: coupon?.code || null };
      const res = await apiFetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bodyPayload) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error || 'Failed to place order');
        setPlacing(false);
        return;
      }

      // clear cart in a single call
      await apiFetch('/api/cart', { method: 'DELETE' });
      await refresh();

      // clear coupon locally if applied
      if (coupon) {
        try {
          removeCoupon();
        } catch {
          // non-blocking
        }
      }

      setCode('');
      toast.success('Order placed');
      // server returns order id
      const orderId = data?.order?.id;
      if (orderId) router.push(`/orders/${orderId}`);
      else router.push('/profile');
    } catch (err) {
      const msg = (err && typeof err === 'object' && 'message' in err) ? (err as { message?: string }).message : String(err);
      toast.error(msg || 'Unexpected error');
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
        <div className="mb-3">
          <label className="block text-sm text-muted-foreground mb-1">Coupon</label>
          <div className="flex gap-2">
            <input value={code} onChange={(e) => setCode(e.target.value)} className="flex-1 p-2 border rounded" placeholder="Coupon code" />
            <button className="px-3 py-1 border rounded" onClick={async () => { if (!code) return; await applyCoupon(code); }}>{loading ? '...' : 'Apply'}</button>
            {coupon && <button className="px-3 py-1 border rounded" onClick={() => removeCoupon()}>Remove</button>}
          </div>
          {coupon && (
            <div className="text-sm mt-2">Applied: <strong>{coupon.code}</strong> — {coupon.type === 'percent' ? `${coupon.value}%` : `$${coupon.value.toFixed(2)}`}</div>
          )}
        </div>
        <label className="block text-sm text-muted-foreground mb-1">Delivery address</label>
        <input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full p-2 border rounded mb-3" placeholder="Calle, ciudad, etc." />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
          <div className="text-sm mb-2 sm:mb-0">Subtotal: <strong>${subtotal.toFixed(2)}</strong></div>
          <div className="text-sm mb-2 sm:mb-0">Discount: <strong>-${discount.toFixed(2)}</strong></div>
          <div className="text-sm">Total: <strong>${(Math.max(0, subtotal - discount)).toFixed(2)}</strong></div>
          <Button onClick={placeOrder} disabled={placing || loading}>{placing ? 'Placing...' : 'Place Order'}</Button>
        </div>
      </div>
    </div>
  );
}
