"use client";

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { Facebook, Twitter, Instagram, Linkedin, Youtube, Mail } from 'lucide-react';
import { categoriesService } from '@/services/categories.service';
import { Category } from '@/types/category.types';

export default function Footer({ minimal = false }: { minimal?: boolean }) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (minimal) return;
    const fetchCategories = async () => {
      try {
        const data = await categoriesService.getAll();
        // Take only the first 5 active categories
        setCategories(data.filter(c => c.active).slice(0, 5));
      } catch (error) {
        console.error("Failed to fetch footer categories", error);
      }
    };
    fetchCategories();
  }, []);

  return (
    <footer className="bg-background border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Column */}
          <div>
            <h3 className={`font-bold text-lg mb-4 italic ${minimal ? "text-black" : ""}`}>XCIX</h3>
            {/* Social Media Icons */}
            <div className="flex items-center gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center"
                aria-label="YouTube"
              >
                <Youtube className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Shop Column */}
          {!minimal && (
            <div>
              <h4 className="font-semibold mb-4">Shop</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/products" className="hover:text-foreground transition-colors">All Products</Link></li>
                {categories.map((category) => (
                  <li key={category.id}>
                    <Link
                      href={`/products?category=${category.id}`}
                      className="hover:text-foreground transition-colors"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Customer Service Column */}
          <div>
            <h4 className={`font-semibold mb-4 ${minimal ? "text-black" : ""}`}>Customer Service</h4>
            <ul className={`space-y-2 text-sm ${minimal ? "text-zinc-500" : "text-muted-foreground"}`}>
              <li><Link href="/contact" className={`transition-colors ${minimal ? "hover:text-black" : "hover:text-foreground"}`}>Contact Us</Link></li>
              {!minimal && (
                <>
                  <li><Link href="/shipping" className="hover:text-foreground transition-colors">Shipping Info</Link></li>
                  <li><Link href="/returns" className="hover:text-foreground transition-colors">Returns</Link></li>
                  <li><Link href="/faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
                </>
              )}
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className={`font-semibold mb-4 ${minimal ? "text-black" : ""}`}>Company</h4>
            <ul className={`space-y-2 text-sm ${minimal ? "text-zinc-500" : "text-muted-foreground"}`}>
              <li><Link href="/about" className="hover:text-foreground transition-colors">About Us</Link></li>
              <li><Link href="/careers" className="hover:text-foreground transition-colors">Careers</Link></li>
              <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className={`text-sm ${minimal ? "text-zinc-500 font-bold" : "text-muted-foreground"}`}>
            © {new Date().getFullYear()} XCIX Platform. All rights reserved.
          </p>
          <div className={`flex items-center gap-4 text-sm ${minimal ? "text-zinc-500 font-bold" : "text-muted-foreground"}`}>
            <a href="mailto:contact@xcix.com" className={`flex items-center gap-2 transition-colors ${minimal ? "hover:text-black" : "hover:text-foreground"}`}>
              <Mail className="h-4 w-4" />
              contact@xcix.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
