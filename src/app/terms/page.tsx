import React from 'react';

export default function TermsPage() {
    return (
        <div className="max-w-3xl mx-auto px-4 py-16">
            <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
            <div className="prose dark:prose-invert max-w-none space-y-6 text-sm">
                <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

                <section>
                    <h2 className="text-xl font-semibold mb-3">1. Agreement to Terms</h2>
                    <p>
                        By accessing or using the XCIX website, you agree to be bound by these Terms of Service.
                        If you do not agree, please do not use our services.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3">2. Products and Pricing</h2>
                    <p>
                        We make every effort to display the colors and images of our products accurately.
                        However, we cannot guarantee that your computer monitor's display of any color will be accurate.
                        Prices for our products are subject to change without notice.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3">3. Returns and Refunds</h2>
                    <p>
                        Our return policy is strictly 30 days. If 30 days have gone by since your purchase,
                        unfortunately, we can’t offer you a refund or exchange. To be eligible for a return,
                        your item must be unused and in the same condition that you received it.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3">4. Limitation of Liability</h2>
                    <p>
                        XCIX shall not be liable for any direct, indirect, incidental, special, or consequential
                        damages resulting from the use or inability to use our products or services.
                    </p>
                </section>
            </div>
        </div>
    );
}
