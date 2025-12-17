import React from 'react';

export default function PrivacyPage() {
    return (
        <div className="max-w-3xl mx-auto px-4 py-16">
            <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
            <div className="prose dark:prose-invert max-w-none space-y-6 text-sm">
                <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

                <section>
                    <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
                    <p>
                        At Neutra, we simplify your life, and that includes respecting your privacy.
                        This Privacy Policy explains how we collect, use, and protect your personal information
                        when you visit our website or make a purchase.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
                    <p>
                        We collect information you provide directly to us, such as when you create an account,
                        make a purchase, or sign up for our newsletter. This may include your name, email address,
                        shipping address, and payment information.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
                    <p>
                        We use your information to:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                        <li>Process and fulfill your orders.</li>
                        <li>Communicate with you about your order or our products.</li>
                        <li>Improve our website and customer service.</li>
                        <li>Detect and prevent fraud.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3">4. Cookies</h2>
                    <p>
                        We use cookies to enhance your browsing experience and analyze site traffic.
                        You can control cookie preferences through your browser settings.
                    </p>
                </section>
            </div>
        </div>
    );
}
