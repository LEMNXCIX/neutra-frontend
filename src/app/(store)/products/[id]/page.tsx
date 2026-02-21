import React from "react";
import ProductDetailClient from "@/components/product-detail-client";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    Package,
    Sparkles,
    ShoppingBag,
    Shield,
    Truck,
    ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "@/components/ui/image";
import { backendFetch } from "@/lib/backend-api";

async function fetchProduct(id: string) {
    try {
        const result = await backendFetch(`/products/${id}`, {
            cache: "no-store",
        });
        if (!result.success) return null;

        const p = result.data as any;
        if (!p) return null;

        // Map backend Product to frontend Product expected by this page
        return {
            ...p,
            title: p.name,
            category: p.categories?.[0]?.name || p.category,
            stock: p.stock ?? 0,
            price: p.price ?? 0,
        };
    } catch (error) {
        console.error(`Error fetching product ${id}:`, error);
        return null;
    }
}

export default async function Page(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const product = await fetchProduct(params.id);

    if (!product)
        return (
            <div className="min-h-[60vh] flex items-center justify-center p-6">
                <Card className="max-w-md w-full p-8 text-center border-none shadow-lg">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2 text-foreground">
                        Product not found
                    </h2>
                    <p className="text-muted-foreground mb-6">
                        The product you&apos;re looking for doesn&apos;t exist
                        or has been removed
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
        <main className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background animate-in fade-in duration-700">
            {/* Breadcrumb / Navigation */}
            <div className="border-b border-border/50 bg-background/50 backdrop-blur-md sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Button
                        variant="ghost"
                        asChild
                        className="group font-bold uppercase tracking-widest text-[10px] hover:bg-muted rounded-xl transition-all"
                    >
                        <Link
                            href="/products"
                            className="flex items-center gap-3"
                        >
                            <ArrowLeft
                                className="h-4 w-4 transition-transform group-hover:-translate-x-1 text-primary"
                                strokeWidth={3}
                            />
                            Back to Catalog
                        </Link>
                    </Button>
                    <div className="flex items-center gap-2">
                        <Badge
                            variant="outline"
                            className="rounded-full px-4 border-primary/20 bg-primary/5 text-primary"
                        >
                            {product.category}
                        </Badge>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
                    {/* Product Image Section */}
                    <div className="space-y-8 sticky top-24">
                        <Card className="overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-muted group relative">
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            <div className="aspect-square relative overflow-hidden">
                                {product.image ? (
                                    <Image
                                        src={product.image}
                                        alt={product.title}
                                        fill
                                        priority
                                        className="object-cover transition-transform duration-1000 group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-muted">
                                        <Package className="h-32 w-32 text-muted-foreground/20" />
                                    </div>
                                )}

                                <div className="absolute top-6 right-6 flex flex-col gap-3">
                                    {!inStock && (
                                        <Badge
                                            variant="destructive"
                                            className="shadow-xl font-bold uppercase tracking-widest text-[10px] px-4 py-2 rounded-full border-2 border-background animate-pulse"
                                        >
                                            Out of Stock
                                        </Badge>
                                    )}
                                    {lowStock && inStock && (
                                        <Badge className="bg-orange-500 text-white shadow-xl font-bold uppercase tracking-widest text-[10px] px-4 py-2 rounded-full border-2 border-background">
                                            Only {product.stock} left
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </Card>

                        <div className="grid grid-cols-3 gap-4">
                            {[
                                {
                                    icon: Truck,
                                    label: "Express Shipping",
                                    color: "text-blue-500",
                                    bg: "bg-blue-500/10",
                                },
                                {
                                    icon: Shield,
                                    label: "Secure Payment",
                                    color: "text-emerald-500",
                                    bg: "bg-emerald-500/10",
                                },
                                {
                                    icon: ShoppingBag,
                                    label: "Easy Returns",
                                    color: "text-purple-500",
                                    bg: "bg-purple-500/10",
                                },
                            ].map((item, i) => (
                                <Card
                                    key={i}
                                    className="p-6 text-center border-none bg-background shadow-lg rounded-3xl hover:shadow-xl transition-all group"
                                >
                                    <div
                                        className={`w-12 h-12 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}
                                    >
                                        <item.icon className="h-6 w-6" />
                                    </div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                        {item.label}
                                    </p>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Product Details Section */}
                    <div className="flex flex-col space-y-8 pt-4">
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground leading-[1.1]">
                                    {product.title}
                                </h1>
                                <div className="flex items-center gap-4">
                                    <div className="h-1.5 w-24 bg-primary rounded-full" />
                                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                        Product Reference:{" "}
                                        {product.id.slice(0, 8)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <span className="text-6xl font-bold tracking-tight text-primary">
                                    ${product.price}
                                </span>
                                <Badge
                                    variant="secondary"
                                    className="rounded-full px-4 py-1 text-xs font-bold"
                                >
                                    Tax Included
                                </Badge>
                            </div>

                            <div className="space-y-4 pt-4">
                                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                    <span className="w-8 h-px bg-muted-foreground/30" />
                                    Description
                                </h2>
                                <p className="text-xl text-foreground/80 font-medium leading-relaxed">
                                    {product.description ||
                                        "Experience the perfect blend of minimalist design and exceptional functionality with this carefully curated piece."}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-6 py-8 border-y border-border/50">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                        Availability
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <div
                                            className={`w-2 h-2 rounded-full ${inStock ? "bg-emerald-500 animate-pulse" : "bg-destructive"}`}
                                        />
                                        <span className="font-bold text-sm">
                                            {inStock
                                                ? "Ready to ship"
                                                : "Currently unavailable"}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                        Condition
                                    </p>
                                    <p className="font-bold text-sm flex items-center gap-2">
                                        Brand New{" "}
                                        <Sparkles className="h-3 w-3 text-yellow-500" />
                                    </p>
                                </div>
                            </div>

                            <div className="pt-6">
                                <Card className="p-8 border-none bg-muted/30 backdrop-blur-sm shadow-inner rounded-[2rem]">
                                    <ProductDetailClient product={product} />
                                </Card>
                            </div>

                            <div className="pt-6 flex items-center justify-center gap-8 text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                                <span className="flex items-center gap-2">
                                    <Shield className="h-4 w-4" />
                                    Safe Payment
                                </span>
                                <span className="flex items-center gap-2">
                                    <Truck className="h-4 w-4" />
                                    Fast Delivery
                                </span>
                                <span className="flex items-center gap-2">
                                    <ShoppingBag className="h-4 w-4" />
                                    Quality Guaranteed
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
