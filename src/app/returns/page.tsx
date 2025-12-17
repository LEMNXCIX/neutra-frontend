import React from 'react';

export default function ReturnsPage() {
    return (
        <div className="max-w-3xl mx-auto px-4 py-16">
            <h1 className="text-3xl font-bold mb-8">Returns & Exchanges</h1>
            <div className="prose dark:prose-invert max-w-none space-y-6">
                <p className="text-lg text-muted-foreground">
                    We want you to love your purchase. If you are not completely satisfied, we offer returns within 30 days of delivery.
                </p>

                <section className="bg-muted/30 p-6 rounded-lg my-8">
                    <h2 className="text-xl font-semibold mb-3">How to Start a Return</h2>
                    <ol className="list-decimal pl-5 space-y-2">
                        <li>Log in to your account and go to "Order History".</li>
                        <li>Select the order containing the item(s) you wish to return.</li>
                        <li>Click "Request Return" and follow the instructions to print your prepaid shipping label.</li>
                        <li>Pack your item(s) securely and drop off the package at any authorized carrier location.</li>
                    </ol>
                </section>

                <h2 className="text-2xl font-semibold">Return Policy Details</h2>
                <ul className="list-disc pl-5 space-y-2">
                    <li>Items must be returned within 30 days of the delivery date.</li>
                    <li>Items must be unused, unwashed, and in their original packaging with tags attached.</li>
                    <li>Furniture returns may be subject to a restocking fee.</li>
                    <li>Final sale items cannot be returned or exchanged.</li>
                </ul>

                <h2 className="text-2xl font-semibold">Refunds</h2>
                <p>
                    Once we receive your return, please allow 5-7 business days for us to process your refund.
                    Refunds will be issued to the original payment method. Shipping costs are non-refundable.
                </p>
            </div>
        </div>
    );
}
