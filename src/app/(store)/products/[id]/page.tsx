import React from "react";
import ProductDetailClient from "@/components/product-detail-client";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Package,
  ShoppingBag,
  Shield,
  Truck,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "@/components/ui/image";

import { headers } from "next/headers";

async function fetchProduct(id: string) {
  const headersList = await headers();
  const host = headersList.get('host');
  const tenantId = headersList.get('x-tenant-id');
  const tenantSlug = headersList.get('x-tenant-slug');

  const base =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:4001/api";
  const url = new URL(`/api/products/${id}`, base).toString();
  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      ...(host && { 'host': host }),
      ...(tenantId && { 'x-tenant-id': tenantId }),
      ...(tenantSlug && { 'x-tenant-slug': tenantSlug }),
    }
  });
  if (!res.ok) return null;
  const data = await res.json();
  // Handle StandardResponse (data.data)
  const p = data.data || data.product || data;
  if (!p) return null;

  // Map backend Product to frontend Product expected by this page
  return {
    ...p,
    title: p.name,
    category: p.categories?.[0]?.name || p.category,
    stock: p.stock ?? 0,
    price: p.price ?? 0
  };
}

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const pid = params.id;
  const product = await fetchProduct(pid);

  if (!product)
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center border-none shadow-lg">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Product not found</h2>
          <p className="text-muted-foreground mb-6">
            The product you&apos;re looking for doesn&apos;t exist or has been removed
          </p>
          <Button asChild>
            <Link href="/products">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Link>
          </Button>
        </Card>
      </div>
    );

  const inStock = (product.stock ?? 0) > 0;
  const lowStock = (product.stock ?? 0) > 0 && (product.stock ?? 0) <= 5;

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Breadcrumb */}
      <div className="border-b bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <Button variant="ghost" asChild className="mb-2">
            <Link href="/products">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Link>
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Image */}
          <div className="space-y-4">
            <Card className="overflow-hidden border-none shadow-xl bg-gradient-to-br from-muted/30 to-muted/10">
              <div className="aspect-square relative group">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.title}
                    width={600}
                    height={600}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <Package className="h-32 w-32 text-muted-foreground" />
                  </div>
                )}

                {/* Stock Badge */}
                {!inStock && (
                  <Badge
                    variant="destructive"
                    className="absolute top-4 right-4 text-sm"
                  >
                    Out of Stock
                  </Badge>
                )}
                {lowStock && inStock && (
                  <Badge
                    variant="secondary"
                    className="absolute top-4 right-4 text-sm bg-yellow-500/90 text-white hover:bg-yellow-500"
                  >
                    Only {product.stock} left!
                  </Badge>
                )}
              </div>
            </Card>

            {/* Features Grid */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="p-4 text-center border-none shadow-md hover:shadow-lg transition-shadow">
                <Truck className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-xs font-medium">Free Shipping</p>
              </Card>
              <Card className="p-4 text-center border-none shadow-md hover:shadow-lg transition-shadow">
                <Shield className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-xs font-medium">Secure Payment</p>
              </Card>
              <Card className="p-4 text-center border-none shadow-md hover:shadow-lg transition-shadow">
                <ShoppingBag className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-xs font-medium">Easy Returns</p>
              </Card>
            </div>
          </div>

          {/* Product Details */}
          <div className="flex flex-col">
            <div className="space-y-6">
              {/* Category Badge */}
              {product.category && (
                <div>
                  <Badge variant="secondary" className="text-sm">
                    {product.category}
                  </Badge>
                </div>
              )}

              {/* Title */}
              <div>
                <h1 className="text-4xl font-bold mb-2 leading-tight">
                  {product.title}
                </h1>
                {product.stock !== undefined && (
                  <p className="text-sm text-muted-foreground">
                    {inStock
                      ? `${product.stock} units available`
                      : 'Currently unavailable'
                    }
                  </p>
                )}
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-bold text-primary">
                  ${product.price}
                </span>
                <span className="text-muted-foreground">USD</span>
              </div>

              <Separator />

              {/* Description */}
              {product.description && (
                <div>
                  <h2 className="text-lg font-semibold mb-3">Description</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              <Separator />

              {/* Product Info */}
              <div className="space-y-3">
                <h2 className="text-lg font-semibold">Product Information</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">SKU</p>
                    <p className="font-medium">{product.id}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Availability</p>
                    <Badge variant={inStock ? "secondary" : "destructive"}>
                      {inStock ? "In Stock" : "Out of Stock"}
                    </Badge>
                  </div>
                  {product.category && (
                    <div>
                      <p className="text-muted-foreground mb-1">Category</p>
                      <p className="font-medium capitalize">{product.category}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground mb-1">Price</p>
                    <p className="font-medium">${product.price}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Add to Cart Section */}
              <Card className="p-6 border-none shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
                <ProductDetailClient product={product} />
              </Card>

              {/* Additional Info */}
              <Card className="p-4 bg-muted/50 border-none">
                <p className="text-xs text-muted-foreground text-center">
                  🔒 Secure checkout • 📦 Free shipping on orders over $50 • 🔄 30-day return policy
                </p>
              </Card>
            </div>
          </div>
        </div>

        {/* Related Products Section - Placeholder */}
        <div className="mt-16">
          <Separator className="mb-8" />
          <h2 className="text-2xl font-bold mb-6">You may also like</h2>
          <div className="text-center text-muted-foreground py-12 border rounded-lg bg-muted/20">
            Related products will appear here
          </div>
        </div>
      </div>
    </main>
  );
}
