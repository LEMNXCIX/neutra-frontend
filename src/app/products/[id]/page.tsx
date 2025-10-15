import React from 'react';
import ProductDetailClient from '@/components/product-detail-client';

async function fetchProduct(id: string) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || 'http://localhost:3000';
  const url = new URL(`/api/products/${id}`, base).toString();
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return null;
  const data = await res.json();
  return data.product;
}

export default async function Page(props: unknown){
  const params = (props as { params?: { id?: string } })?.params;
  const pid = params?.id || '';
  const product = await fetchProduct(pid);
  if (!product) return <div className="p-6">Product not found</div>;

  return (
    <main className="max-w-4xl mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-100 dark:bg-zinc-800 rounded overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.image} alt={product.title} className="w-full h-80 object-cover" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">{product.title}</h1>
          <div className="text-muted-foreground my-2">{product.category}</div>
          <div className="text-lg font-bold mb-4">${product.price}</div>
          <p className="text-sm text-muted-foreground mb-6">{product.description}</p>
          <ProductDetailClient product={product} />
        </div>
      </div>
    </main>
  );
}
