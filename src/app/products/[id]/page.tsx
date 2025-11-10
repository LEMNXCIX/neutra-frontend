import React from "react";
import ProductDetailClient from "@/components/product-detail-client";

async function fetchProduct(id: string) {
  const base =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.BASE_URL ||
    "http://localhost:3000";
  const url = new URL(`/api/products/${id}`, base).toString();
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  return data.product;
}

export default async function Page(props: unknown) {
  // props.params can be a Promise in the App Router; await it before accessing properties.
  const paramsProp = (props as { params?: { id?: string } })?.params;
  const params = (await (paramsProp as unknown)) as { id?: string } | undefined;
  const pid = params?.id || "";
  const product = await fetchProduct(pid);

  if (!product)
    return (
      <div className="p-6 text-center text-muted-foreground">
        Product not found
      </div>
    );

  return (
    <main className="max-w-5xl mx-auto p-6 pt-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        {/* Imagen grande */}
        <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-[480px] object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>

        {/* Detalles */}
        <div className="flex flex-col justify-center">
          <h1 className="text-3xl font-semibold mb-2">{product.title}</h1>

          {product.category && (
            <div className="text-sm text-muted-foreground mb-3 capitalize">
              {product.category}
            </div>
          )}

          <div className="text-2xl font-bold mb-4">${product.price}</div>

          {product.description && (
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Cliente interactivo con loading */}
          <ProductDetailClient product={product} />
        </div>
      </div>
    </main>
  );
}
