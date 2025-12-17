import React from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';

export default function ContactPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-16">
            <h1 className="text-3xl font-bold mb-8">Contact Us</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                    <p className="text-lg text-muted-foreground">
                        Have a question or need assistance? We're here to help. Reach out to us via email
                        or visit our showroom.
                    </p>

                    <div className="space-y-4 pt-4">
                        <div className="flex items-start gap-3">
                            <Mail className="h-6 w-6 text-primary mt-1" />
                            <div>
                                <h3 className="font-semibold">Email</h3>
                                <p className="text-muted-foreground">contact@neutra.com</p>
                                <p className="text-sm text-muted-foreground">Response time within 24 hours</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Phone className="h-6 w-6 text-primary mt-1" />
                            <div>
                                <h3 className="font-semibold">Phone</h3>
                                <p className="text-muted-foreground text-sm">Unavailable at the moment</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <MapPin className="h-6 w-6 text-primary mt-1" />
                            <div>
                                <h3 className="font-semibold">Showroom</h3>
                                <p className="text-muted-foreground">123 Design Avenue</p>
                                <p className="text-muted-foreground">Metropolis, NY 10012</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Simple form placeholder */}
                <div className="bg-muted/30 p-8 rounded-lg">
                    <h2 className="text-xl font-semibold mb-4">Send us a message</h2>
                    <form className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
                            <input type="text" id="name" className="w-full p-2 rounded border bg-background" placeholder="Your name" />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
                            <input type="email" id="email" className="w-full p-2 rounded border bg-background" placeholder="your@email.com" />
                        </div>
                        <div>
                            <label htmlFor="message" className="block text-sm font-medium mb-1">Message</label>
                            <textarea id="message" rows={4} className="w-full p-2 rounded border bg-background" placeholder="How can we help?"></textarea>
                        </div>
                        <button type="button" className="w-full bg-primary text-primary-foreground py-2 rounded hover:bg-primary/90 transition-colors">
                            Send Message
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
