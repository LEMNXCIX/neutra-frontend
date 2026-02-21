"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PromoSlider from "@/components/promo-slider";
import BannerBar from "@/components/banner-bar";
import FeaturedProducts from "@/components/featured-products";
import {
    Truck,
    Shield,
    ArrowRight,
    Tag,
    Heart,
    Box,
    Zap,
} from "lucide-react";

import { useFeatures } from "@/hooks/useFeatures";

export default function Home() {
    const { isFeatureEnabled } = useFeatures();

    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
            {isFeatureEnabled("BANNERS") && <BannerBar />}

            {/* HERO */}
            <section className="relative overflow-hidden py-24 md:py-32">
                <div className="absolute inset-0 bg-gradient-to-b from-muted/20 via-transparent to-transparent" />

                <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="grid lg:grid-cols-3 gap-12 items-center">

                        {/* COLUMNA 1 – Texto */}
                        <div className="text-center lg:text-left space-y-8 lg:col-span-1">
                            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.1]">
                                Timeless <span className="text-primary">Design</span> for Modern Living
                            </h1>

                            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                                Handpicked furniture and decor that blend Scandinavian minimalism with contemporary comfort.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                <Button size="lg" className="h-14 px-10 text-base font-bold rounded-xl shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all" asChild>
                                    <Link href="/products">
                                        Shop Collection
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        {/* COLUMNAS 2 y 3 – Slider */}
                        <div className="lg:col-span-2">
                            <div className="relative">
                                <div className="hidden lg:block absolute inset-0 -m-6 bg-primary/5 rounded-[3rem] blur-3xl -z-10" />
                                <div className="relative bg-background rounded-3xl overflow-hidden shadow-2xl border border-border/50">
                                    {isFeatureEnabled("BANNERS") && <PromoSlider />}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            {/* FEATURED PRODUCTS */}
            <section className="py-24 border-t border-border/50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16">
                        <div className="space-y-4">
                            <Badge variant="secondary" className="px-4 py-1 rounded-full">Curated Selection</Badge>
                            <h2 className="text-4xl font-bold tracking-tight">
                                Featured <span className="text-primary">Products</span>
                            </h2>
                        </div>

                        <Button variant="outline" size="lg" className="hidden md:flex rounded-xl font-bold border-border" asChild>
                            <Link href="/products" className="flex items-center gap-2">
                                View Full Catalog <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>

                    <FeaturedProducts />

                    <div className="mt-12 text-center md:hidden">
                        <Button variant="outline" className="w-full h-14 rounded-xl font-bold border-border" asChild>
                            <Link href="/products">View All Products</Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* FEATURES */}
            <section className="py-24 bg-muted/30 border-y border-border/50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20 max-w-2xl mx-auto space-y-4">
                        <Badge variant="secondary" className="px-4 py-1 rounded-full text-xs">
                            Why Choose XCIX
                        </Badge>
                        <h2 className="text-4xl font-bold tracking-tight">The XCIX Experience</h2>
                        <p className="text-muted-foreground font-medium">
                            Premium materials, modern design, and exceptional shopping
                            experience at every step.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { icon: Truck, title: "Fast Delivery", c1: "from-blue-500", c2: "to-cyan-500", desc: "Free shipping on all orders over $50" },
                            { icon: Shield, title: "Secure Checkout", c1: "from-emerald-500", c2: "to-teal-500", desc: "Industry-leading payment security" },
                            { icon: Tag, title: "Best Prices", c1: "from-purple-500", c2: "to-pink-500", desc: "Exclusive deals and seasonal offers" },
                            { icon: Heart, title: "Quality Assured", c1: "from-rose-500", c2: "to-orange-500", desc: "Premium craftsmanship guaranteed" }
                        ].map((f, i) => (
                            <Card
                                key={i}
                                className="t-card border-none shadow-md hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group bg-background/60 backdrop-blur-xl"
                            >
                                <CardContent className="p-10 text-center space-y-6">
                                    <div
                                        className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${f.c1} ${f.c2} flex items-center justify-center mx-auto text-white shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-3 duration-500`}
                                    >
                                        <f.icon className="h-10 w-10" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="font-bold text-xl tracking-tight">{f.title}</h3>
                                        <p className="text-sm font-medium text-muted-foreground leading-relaxed">{f.desc}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="relative py-32 md:py-48 overflow-hidden bg-foreground text-background">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--primary)_0%,_transparent_70%)]" />
                </div>

                <div className="relative max-w-5xl mx-auto px-6 text-center space-y-12">
                    <h2 className="text-6xl md:text-8xl font-black tracking-tighter leading-none uppercase">
                        UP TO <span className="text-primary italic">30% OFF</span> <br />
                        <span className="text-3xl md:text-5xl opacity-80">Everything Sitewide</span>
                    </h2>

                    <p className="text-xl md:text-2xl font-medium opacity-60 max-w-2xl mx-auto leading-relaxed italic">
                        Join the minimalist movement. Limited time offer for our new collection.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-4">
                        <Button
                            size="lg"
                            className="h-16 px-12 text-xl font-bold bg-background text-foreground hover:bg-background/90 
                   shadow-2xl rounded-none transition-all hover:-translate-y-1"
                            asChild
                        >
                            <Link href="/register" className="flex items-center gap-3">
                                Claim Discount
                                <ArrowRight className="h-6 w-6" />
                            </Link>
                        </Button>

                        <Button
                            size="lg"
                            variant="outline"
                            className="h-16 px-12 text-xl font-bold border-2 border-background text-background 
                   hover:bg-background hover:text-foreground rounded-none transition-all"
                            asChild
                        >
                            <Link href="/products">
                                Explore Arrivals
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* NEWSLETTER */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-600/5" />
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />

                <div className="max-w-5xl mx-auto px-6 relative">
                    <Card className="t-card border-none shadow-2xl bg-background/70 backdrop-blur-2xl relative overflow-hidden rounded-3xl">
                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary via-purple-500 to-pink-500" />
                        
                        <CardContent className="p-16 md:p-24 text-center space-y-10">
                            <div className="space-y-4">
                                <h2 className="text-5xl md:text-6xl font-black tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                    Never Miss a Drop
                                </h2>
                                <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
                                    Exclusive early access, private sales, and interior inspiration delivered straight to your inbox.
                                </p>
                            </div>

                            <form className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
                                <input
                                    type="email"
                                    required
                                    placeholder="your@email.com"
                                    className="flex-1 h-16 px-8 rounded-2xl bg-background border border-border/50
                     focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10
                     font-medium transition-all shadow-inner text-lg"
                                />
                                <Button
                                    size="lg"
                                    className="h-16 px-10 font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 hover:-translate-y-1 hover:scale-105 rounded-2xl transition-all text-lg"
                                >
                                    <Zap className="mr-2 h-5 w-5" />
                                    Subscribe
                                </Button>
                            </form>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6 text-base text-muted-foreground font-medium">
                                <span className="flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-emerald-500" />
                                    No spam, unsubscribe anytime
                                </span>
                                <span className="hidden sm:block opacity-20 text-foreground">|</span>
                                <span>Join 48,000+ design lovers</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>
        </div>
    );
}
