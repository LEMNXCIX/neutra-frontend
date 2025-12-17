import React from 'react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQPage() {
    return (
        <div className="max-w-3xl mx-auto px-4 py-16">
            <h1 className="text-3xl font-bold mb-8">Frequently Asked Questions</h1>
            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                    <AccordionTrigger>What payment methods do you accept?</AccordionTrigger>
                    <AccordionContent>
                        We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and Apple Pay.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                    <AccordionTrigger>Do you ship internationally?</AccordionTrigger>
                    <AccordionContent>
                        Yes, we ship to over 50 countries worldwide. International shipping rates and delivery times vary by location.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                    <AccordionTrigger>Can I machine wash the textiles?</AccordionTrigger>
                    <AccordionContent>
                        Care instructions vary by product. Please check the specific product page and the care label attached to the item for detailed instructions.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                    <AccordionTrigger>How do I track my order?</AccordionTrigger>
                    <AccordionContent>
                        Once your order ships, you will receive an email with a tracking number. You can also view the status of your order in your account dashboard.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-5">
                    <AccordionTrigger>What is your warranty policy?</AccordionTrigger>
                    <AccordionContent>
                        We offer a 1-year warranty on all furniture and lighting against manufacturing defects. Textiles and accessories are covered for 90 days.
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            <div className="mt-12 text-center">
                <p className="text-muted-foreground mb-4">Still have questions?</p>
                <a href="/contact" className="text-primary hover:underline font-medium">Contact our support team</a>
            </div>
        </div>
    );
}
