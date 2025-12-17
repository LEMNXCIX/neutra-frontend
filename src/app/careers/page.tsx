import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function CareersPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-16">
            <h1 className="text-3xl font-bold mb-8">Careers at Neutra</h1>
            <div className="space-y-8">
                <section className="prose dark:prose-invert max-w-none">
                    <p className="text-lg text-muted-foreground">
                        Join our team of designers, curators, and craftspeople. We are always looking for
                        talented individuals who share our passion for minimalist design and sustainable living.
                    </p>
                </section>

                <section className="mt-12">
                    <h2 className="text-2xl font-semibold mb-6">Open Positions</h2>

                    <div className="space-y-4">
                        {/* Job Listing 1 */}
                        <div className="border rounded-lg p-6 hover:bg-muted/30 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold text-lg">Senior Interior Designer</h3>
                                <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded">Remote</span>
                            </div>
                            <p className="text-muted-foreground text-sm mb-4">We are looking for an experienced Interior Designer to lead our design consultation team.</p>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/contact">Apply Now</Link>
                            </Button>
                        </div>

                        {/* Job Listing 2 */}
                        <div className="border rounded-lg p-6 hover:bg-muted/30 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold text-lg">E-commerce Specialist</h3>
                                <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded">New York, NY</span>
                            </div>
                            <p className="text-muted-foreground text-sm mb-4">Help us optimize our online store and improve the customer journey.</p>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/contact">Apply Now</Link>
                            </Button>
                        </div>
                    </div>

                    <div className="mt-8 text-center text-muted-foreground text-sm">
                        Don't see a role that fits? Email us at <a href="mailto:careers@neutra.com" className="underline hover:text-primary">careers@neutra.com</a> with your portfolio.
                    </div>
                </section>
            </div>
        </div>
    );
}
