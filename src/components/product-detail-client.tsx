"use client";
import React, { useState } from 'react';
import { useCart } from '@/context/cart-context';
import { Button } from './ui/button';

type Product = { id: string; title: string; price?: number };

export default function ProductDetailClient({ product }: { product: Product }){
  const { addItem, loading } = useCart();
  const [qty, setQty] = useState(1);

  return (
    <div className="flex items-center gap-3">
      <input type="number" min={1} value={qty} onChange={e=>setQty(Number(e.target.value))} className="w-20 border p-2 rounded" />
      <Button onClick={async ()=>{ for(let i=0;i<qty;i++) await addItem(product.id, product.title); }} disabled={loading} className="px-4 py-2 bg-zinc-900 text-white rounded">{loading ? '...' : 'Add to cart'}</Button>
    </div>
  );
}
