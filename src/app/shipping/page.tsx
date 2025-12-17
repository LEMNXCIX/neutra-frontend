import React from 'react';
import { Truck, Globe, Clock } from 'lucide-react';

export default function ShippingPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-16">
            <h1 className="text-3xl font-bold mb-8">Shipping Information</h1>
            <div className="space-y-12">
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 border rounded-lg bg-card">
                        <Truck className="h-8 w-8 text-primary mb-4" />
                        <h3 className="font-semibold text-lg mb-2">Free Standard Shipping</h3>
                        <p className="text-sm text-muted-foreground">On all orders over $99 within the continental US.</p>
                    </div>
                    <div className="p-6 border rounded-lg bg-card">
                        <Clock className="h-8 w-8 text-primary mb-4" />
                        <h3 className="font-semibold text-lg mb-2">Express Delivery</h3>
                        <p className="text-sm text-muted-foreground">Expedited options available at checkout for urgent orders.</p>
                    </div>
                    <div className="p-6 border rounded-lg bg-card">
                        <Globe className="h-8 w-8 text-primary mb-4" />
                        <h3 className="font-semibold text-lg mb-2">International Shipping</h3>
                        <p className="text-sm text-muted-foreground">We ship to over 50 countries worldwide.</p>
                    </div>
                </section>

                <section className="prose dark:prose-invert max-w-none space-y-4">
                    <h2 className="text-2xl font-semibold">Processing Time</h2>
                    <p>
                        Most orders are processed within 1-2 business days. Orders placed on weekends or holidays will be processed the following business day.
                    </p>

                    <h2 className="text-2xl font-semibold">Delivery Estimates</h2>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Standard Shipping:</strong> 3-7 business days</li>
                        <li><strong>Express Shipping:</strong> 1-3 business days</li>
                        <li><strong>International Shipping:</strong> 7-21 business days, depending on customs</li>
                    </ul>

                    <h2 className="text-2xl font-semibold">Order Tracking</h2>
                    <p>
                        Once your order has shipped, you will receive an email with a tracking number. You can also track your order in your account dashboard.
                    </p>
                </section>
            </div>
        </div>
    );
}
