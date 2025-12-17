import React from 'react';

export default function AboutPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-16">
            <h1 className="text-3xl font-bold mb-8">About Us</h1>
            <div className="prose dark:prose-invert max-w-none space-y-6">
                <p className="text-lg text-muted-foreground">
                    Neutra is a curated collection of minimalist furniture and home accessories.
                    We believe in mindful design that enhances your living space without cluttering it.
                </p>
                <p>
                    Founded in 2024, our mission is to bring high-quality, sustainably sourced,
                    and beautifully designed pieces to homes around the world. Every item in our
                    collection is hand-picked for its craftsmanship, material quality, and timeless aesthetic.
                </p>
                <p>
                    We collaborate with artisans and designers who share our passion for simplicity
                    and functionality. From our raw materials to our packaging, we strive to minimize
                    our environmental impact while maximizing the beauty and utility of our products.
                </p>
            </div>
        </div>
    );
}
