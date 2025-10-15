"use client";
import React, { useEffect, useState } from 'react';
import ProductGrid from './product-grid';

type Product = { id: string; title: string; price: number; description?: string; image?: string; category?: string };

export default function FeaturedProducts(){
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetch('/api/products')
      .then(r => r.json())
      .then(d => { if(mounted) setProducts(d.products.slice(0,3)); })
      .finally(()=>mounted && setLoading(false));
    return ()=>{ mounted = false };
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;
  return <ProductGrid products={products} />;
}
