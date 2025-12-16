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

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
      <BannerBar />

      {/* HERO */}
      {/* HERO – 3 columnas en desktop, slider ocupa 2/3 */}
      <section className="relative overflow-hidden py-24 md:py-32">
        {/* Fondo sutil */}
        <div className="absolute inset-0 bg-gradient-to-b from-muted/20 via-transparent to-transparent" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12 items-center">

            {/* COLUMNA 1 – Texto (1/3 en desktop) */}
            <div className="text-center lg:text-left space-y-8 lg:space-y-10 lg:col-span-1">

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-light tracking-tight">
                <span className="block text-foreground/80">Timeless</span>
                <span className="block font-bold text-foreground">Designs for</span>
                <span className="block text-primary">Modern Living</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Handpicked furniture and decor that blend Scandinavian minimalism with contemporary comfort.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="lg" className="h-14 px-10 text-lg font-medium rounded-full" asChild>
                  <Link href="/products">
                    Shop the Collection
                    <ArrowRight className="ml-3 h-5 w-5 transition group-hover:translate-x-1" />
                  </Link>
                </Button>

              </div>
            </div>

            {/* COLUMNAS 2 y 3 – Slider ocupa 2/3 en desktop */}
            <div className="lg:col-span-2">
              <div className="relative">
                {/* Marco suave solo visible en desktop */}
                <div className="hidden lg:block absolute inset-0 -m-6 bg-muted/20 rounded-3xl blur-3xl -z-10" />

                <div className="relative bg-background rounded-3xl overflow-hidden shadow-xl">
                  <PromoSlider />
                </div>

                {/* Detalles decorativos sutiles */}
                <div className="hidden lg:block absolute -bottom-8 -left-8 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
                <div className="hidden lg:block absolute -top-8 -right-8 w-48 h-48 bg-purple-600/5 rounded-full blur-3xl" />
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* FEATURED PRODUCTS */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <div>
              <Badge variant="outline">Curated Selection</Badge>
              <h2 className="text-4xl font-black mt-3">
                Featured <span className="text-primary">Products</span>
              </h2>
            </div>

            <Button variant="outline" size="lg" className="hidden sm:flex">
              <Link href="/products" className="flex items-center gap-2">
                View All <ArrowRight className="h-5" />
              </Link>
            </Button>
          </div>

          <FeaturedProducts />

          <div className="mt-8 text-center sm:hidden">
            <Button variant="outline" className="w-full h-12">
              View All Products
            </Button>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="px-4 py-2 text-sm">
              Why Choose Neutra
            </Badge>
            <h2 className="text-4xl font-black mt-4">The Neutra Experience</h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              Premium materials, modern design, and exceptional shopping
              experience.
            </p>
          </div>

          {/* Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Truck, title: "Fast Delivery", c1: "from-blue-500", c2: "to-cyan-500", desc: "Free shipping on orders over $50" },
              { icon: Shield, title: "Secure Checkout", c1: "from-green-500", c2: "to-emerald-500", desc: "Industry-leading payment security" },
              { icon: Tag, title: "Best Prices", c1: "from-purple-500", c2: "to-pink-500", desc: "Exclusive deals and offers" },
              { icon: Heart, title: "Quality Assured", c1: "from-orange-500", c2: "to-red-500", desc: "Premium craftsmanship guaranteed" }
            ].map((f, i) => (
              <Card
                key={i}
                className="group border-none shadow-md hover:shadow-xl hover:-translate-y-1 transition-all bg-background/60 backdrop-blur-xl"
              >
                <CardContent className="pt-8 text-center">
                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${f.c1} ${f.c2} flex items-center justify-center mx-auto mb-4 text-white shadow-lg group-hover:scale-110 transition`}
                  >
                    <f.icon className="h-8 w-8" />
                  </div>
                  <h3 className="font-bold text-xl">{f.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-32 md:py-40 overflow-hidden">
        {/* Fondo con gradiente profundo + blobs animados */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-600 to-pink-600" />
        <div className="absolute inset-0 bg-black/20" />

        {/* Blobs decorativos con movimiento sutil */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-x-[-50%] translate-y-[-50%]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-pink-500/20 rounded-full blur-3xl translate-x-[30%] translate-y-[40%]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-6 text-center text-white">

          {/* Título principal con gradiente brillante */}
          <h2 className="text-6xl md:text-8xl font-black tracking-tighter">
            <span className="block">UP TO</span>
            <span className="block text-7xl md:text-9xl bg-gradient-to-r from-white via-yellow-300 to-white bg-clip-text text-transparent drop-shadow-2xl">
              30% OFF
            </span>
            <span className="block mt-4 text-4xl md:text-5xl">Everything Sitewide</span>
          </h2>

          <p className="mt-8 text-xl md:text-2xl opacity-90 max-w-3xl mx-auto leading-relaxed">
            First-time customers only • Ends in 48 hours • No code needed
          </p>

          {/* Botones principales */}
          <div className="mt-12 flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button
              size="lg"
              className="h-16 px-12 text-xl font-bold bg-white text-black hover:bg-white/90 
                   shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 
                   rounded-full group"
              asChild
            >
              <Link href="/register" className="flex items-center gap-3">
                <Box className="h-6 w-6 group-hover:animate-bounce" />
                Claim Your Discount
                <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition" />
              </Link>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="h-16 px-12 text-xl font-bold border-2 border-white/50 text-white 
                   hover:bg-white hover:text-black backdrop-blur-xl
                   shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 
                   rounded-full"
              asChild
            >
              <Link href="/products">
                Shop New Arrivals
              </Link>
            </Button>
          </div>

        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="py-20 relative overflow-hidden">
        {/* Fondo con gradiente sutil y blob decorativo */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-600/5" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20  blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/10  blur-3xl" />

        <div className="relative  mx-auto ">
          <div className="relative overflow-hidden bg-background/70 backdrop-blur-2xl border border-border/50 shadow-2xl">
            {/* Gradiente superior decorativo */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500" />

            <div className="p-16 md:p-20 text-center">
              {/* Icono grande animado */}
              {/* <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-8 group-hover:scale-110 transition-transform duration-500">
                <Sparkles className="h-10 w-10 text-primary" />
              </div> */}

              <h2 className="text-5xl md:text-6xl font-black tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Never Miss a Drop
              </h2>

              <p className="mt-1 text-lg md:text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                Exclusive early access, private sales, and interior inspiration delivered straight to your inbox.
              </p>

              {/* Formulario */}
              <form className="mt-12 flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="flex-1 px-8 py-5 rounded-2xl bg-background/80 border border-border/70 
                     focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10
                     text-base md:text-lg placeholder:text-muted-foreground/70
                     transition-all duration-300 shadow-inner"
                />
                <Button
                  size="lg"
                  className="h-14 px-10 text-lg font-bold bg-primary hover:bg-primary/90 
                     shadow-xl hover:shadow-2xl hover:scale-105 
                     transition-all duration-300 rounded-2xl"
                >
                  <Zap className="mr-2 h-5 w-5" />
                  Join the List
                </Button>
              </form>

              {/* Texto pequeño con confianza */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  No spam, ever. Unsubscribe anytime.
                </span>
                <span className="hidden sm:block">•</span>
                <span>Join 48,000+ design lovers</span>
              </div>

              {/* Badges decorativos opcionales */}
              {/* <div className="mt-10 flex justify-center gap-4 flex-wrap">
                {["Exclusive Deals", "Early Access", "Interior Tips"].map((badge) => (
                  <Badge
                    key={badge}
                    variant="secondary"
                    className="px-5 py-2 bg-primary/10 text-primary font-medium hover:bg-primary/20 transition"
                  >
                    {badge}
                  </Badge>
                ))}
              </div> */}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
