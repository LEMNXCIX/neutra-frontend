import React from 'react';
import { Mail, MapPin, Phone, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function ContactPage() {
      return (
        <div className="max-w-6xl mx-auto px-6 py-24 animate-slide-up">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                <div className="space-y-10">
                    <div className="space-y-6">
                        <Badge variant="secondary" className="px-4 py-1 rounded-full">Support & Inquiry</Badge>
                        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-tight">
                            Get In <span className="text-primary">Touch</span>
                        </h1>
                        <p className="text-lg text-muted-foreground font-medium max-w-md leading-relaxed">
                            Have questions? We're here to help. Reach out to our team for any assistance or inquiries.
                        </p>
                    </div>
    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
                        <div className="space-y-4 group">
                            <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center rounded-xl group-hover:scale-110 transition-transform duration-500 shadow-sm">
                                <Mail className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm text-muted-foreground mb-1">Email Us</h3>
                                <p className="font-bold text-base hover:text-primary transition-colors">contact@xcix.com</p>
                                <p className="text-[11px] font-medium text-emerald-600 mt-1 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Active Support
                                </p>
                            </div>
                        </div>
    
                        <div className="space-y-4 group">
                            <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center rounded-xl group-hover:scale-110 transition-transform duration-500 shadow-sm">
                                <Phone className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm text-muted-foreground mb-1">Call Us</h3>
                                <p className="font-bold text-base">+1 (555) 800-XCIX</p>
                                <p className="text-[11px] font-medium text-muted-foreground mt-1">Mon - Fri • 9AM - 6PM</p>
                            </div>
                        </div>
    
                        <div className="space-y-4 group col-span-1 sm:col-span-2">
                            <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center rounded-xl group-hover:scale-110 transition-transform duration-500 shadow-sm">
                                <MapPin className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm text-muted-foreground mb-1">Visit Our Office</h3>
                                <p className="font-bold text-base">123 Design Avenue, Metropolis, NY 10012</p>
                                <button className="text-[11px] font-semibold text-primary mt-1 hover:underline underline-offset-4 flex items-center gap-1">
                                    Open in Maps →
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
    
                <Card className="t-card border-none shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />
                    <CardHeader className="p-8 pb-4">
                        <CardTitle className="text-2xl font-bold tracking-tight">Send Message</CardTitle>
                        <p className="text-sm text-muted-foreground">Fill out the form below and we'll get back to you shortly.</p>
                    </CardHeader>
                    <CardContent className="p-8 pt-4 space-y-5">
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-xs font-semibold text-foreground ml-1">Full Name</label>
                            <Input type="text" id="name" placeholder="John Doe" className="h-12 border-muted-foreground/20 focus:border-primary transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-xs font-semibold text-foreground ml-1">Email Address</label>
                            <Input type="email" id="email" placeholder="john@example.com" className="h-12 border-muted-foreground/20 focus:border-primary transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="message" className="text-xs font-semibold text-foreground ml-1">Your Message</label>
                            <Textarea id="message" rows={5} className="border-muted-foreground/20 focus:border-primary transition-all resize-none" placeholder="How can we help you?" />
                        </div>
                        <Button type="button" className="w-full h-14 text-sm font-bold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all">
                            <Send size={16} className="mr-2" /> Send Transmission
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
      );}
