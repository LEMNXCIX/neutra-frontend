"use client";

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { Facebook, Twitter, Instagram, Linkedin, Youtube, Mail, ArrowRight } from 'lucide-react';
import { categoriesService } from '@/services/categories.service';
import { Category } from '@/types/category.types';
import Logo from "@/components/logo";

export default function Footer({ minimal = false }: { minimal?: boolean }) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (minimal) return;
    const fetchCategories = async () => {
      try {
        const data = await categoriesService.getAll();
        setCategories(data.filter(c => c.active).slice(0, 5));
      } catch (error) {
        console.error("Failed to fetch footer categories", error);
      }
    };
    fetchCategories();
  }, [minimal]);

  return (
    <footer className="bg-background border-t border-border pt-24 pb-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          {/* Brand Column */}
          <div className="md:col-span-1 space-y-8">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/5 rounded-xl border border-primary/10">
                    <Logo size={32} className="text-primary" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-foreground">XCIX</h3>
            </div>
            <p className="text-sm font-medium text-muted-foreground leading-relaxed max-w-[240px]">
                Redefining the digital architecture of modern commerce and high-performance scheduling systems.
            </p>
            {/* Social Media Icons */}
            <div className="flex items-center gap-3">
              {[
                { icon: Facebook, label: "Facebook" },
                { icon: Twitter, label: "Twitter" },
                { icon: Instagram, label: "Instagram" },
                { icon: Linkedin, label: "LinkedIn" }
              ].map((social, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-10 h-10 rounded-full bg-muted/50 border border-transparent hover:border-primary/20 hover:bg-background hover:text-primary transition-all duration-300 flex items-center justify-center group"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4 transition-transform group-hover:scale-110" />
                </a>
              ))}
            </div>
          </div>

          {/* Shop Column */}
          {!minimal && (
            <div className="space-y-6">
              <h4 className="text-xs font-bold uppercase tracking-widest text-primary">Shop Catalog</h4>
              <ul className="space-y-3">
                <li>
                    <Link href="/products" className="text-sm font-medium text-muted-foreground hover:text-primary transition-all flex items-center group">
                        <ArrowRight className="w-3 h-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                        All Inventory
                    </Link>
                </li>
                {categories.map((category) => (
                  <li key={category.id}>
                    <Link
                      href={`/products?category=${encodeURIComponent(category.id)}`}
                      className="text-sm font-medium text-muted-foreground hover:text-primary transition-all flex items-center group"
                    >
                      <ArrowRight className="w-3 h-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Customer Service Column */}
          <div className="space-y-6">
            <h4 className="text-xs font-bold uppercase tracking-widest text-primary">Assistance</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/contact" className="text-sm font-medium text-muted-foreground hover:text-primary transition-all flex items-center group">
                    <ArrowRight className="w-3 h-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    Help Center
                </Link>
              </li>
              {!minimal && (
                <>
                  <li>
                    <Link href="/shipping" className="text-sm font-medium text-muted-foreground hover:text-primary transition-all flex items-center group">
                        <ArrowRight className="w-3 h-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                        Shipping Info
                    </Link>
                  </li>
                  <li>
                    <Link href="/returns" className="text-sm font-medium text-muted-foreground hover:text-primary transition-all flex items-center group">
                        <ArrowRight className="w-3 h-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                        Returns & RMAs
                    </Link>
                  </li>
                  <li>
                    <Link href="/faq" className="text-sm font-medium text-muted-foreground hover:text-primary transition-all flex items-center group">
                        <ArrowRight className="w-3 h-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                        Common FAQ
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Company Column */}
          <div className="space-y-6">
            <h4 className="text-xs font-bold uppercase tracking-widest text-primary">Company</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-sm font-medium text-muted-foreground hover:text-primary transition-all flex items-center group">
                    <ArrowRight className="w-3 h-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    Our Story
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-sm font-medium text-muted-foreground hover:text-primary transition-all flex items-center group">
                    <ArrowRight className="w-3 h-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    Join Network
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm font-medium text-muted-foreground hover:text-primary transition-all flex items-center group">
                    <ArrowRight className="w-3 h-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm font-medium text-muted-foreground hover:text-primary transition-all flex items-center group">
                    <ArrowRight className="w-3 h-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[11px] font-medium text-muted-foreground">
            &copy; {new Date().getFullYear()} XCIX Platforms. All rights reserved.
          </p>
          <div className="flex items-center gap-8">
            <a href="mailto:support@xcix.com" className="text-[11px] font-semibold text-foreground hover:text-primary transition-all flex items-center gap-2">
              <Mail className="h-3.5 w-3.5" />
              support@xcix.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
