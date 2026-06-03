import React from "react";
import ProductGrid from "./product-grid";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Product = {
    id: string;
    title: string;
    price: number;
    description?: string;
    image?: string;
    category?: string;
};

export default function FeaturedProducts({
    initialProducts,
}: {
    initialProducts?: Product[];
}) {
    const products = initialProducts || [];
    const loading = products.length === 0;

    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {["skeleton-1", "skeleton-2", "skeleton-3", "skeleton-4"].map(
                    (k) => (
                        <Card
                            key={k}
                            className="overflow-hidden border-none shadow-md hover:shadow-xl transition-shadow rounded-2xl bg-background/80"
                        >
                            {/* Imagen */}
                            <div className="relative aspect-square overflow-hidden bg-muted/50">
                                <Skeleton className="w-full h-full" />
                            </div>

                            <CardContent className="p-5 space-y-4">
                                {/* Título + categoría */}
                                <div className="space-y-2">
                                    <Skeleton className="h-6 w-3/4 rounded-lg" />
                                    <Skeleton className="h-4 w-1/2 rounded-lg" />
                                </div>

                                {/* Precio + rating */}
                                <div className="flex items-center justify-between">
                                    <Skeleton className="h-7 w-24 rounded-md" />
                                    <Skeleton className="h-5 w-20 rounded-full" />
                                </div>

                                {/* Botón */}
                                <Skeleton className="h-11 w-full rounded-xl" />
                            </CardContent>
                        </Card>
                    ),
                )}
            </div>
        );
    }

    if (products.length === 0) return null;

    return <ProductGrid products={products} />;
}
