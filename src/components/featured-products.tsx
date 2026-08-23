import React from "react";
import ProductGrid from "./product-grid";

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

    if (products.length === 0) return null;

    return <ProductGrid products={products} />;
}
