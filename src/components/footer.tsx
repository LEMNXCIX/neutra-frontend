import Link from 'next/link';
import React from 'react';

export default function Footer(){
  return (
    <footer className="bg-zinc-50 dark:bg-zinc-900 border-t mt-12">
      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div>
          <h4 className="font-semibold">Neutra</h4>
          <p className="text-sm text-muted-foreground max-w-sm">Minimal interiors — curated furniture and accessories. Calle Falsa 123, Ciudad Ejemplo.</p>
        </div>

        <div>
          <h5 className="font-semibold">Shop</h5>
          <ul className="mt-2 space-y-1 text-sm">
            <li><Link href="/products">Products</Link></li>
            <li><Link href="/products?category=seating">Seating</Link></li>
            <li><Link href="/products?category=lighting">Lighting</Link></li>
          </ul>
        </div>

        <div>
          <h5 className="font-semibold">Support</h5>
          <ul className="mt-2 space-y-1 text-sm">
            <li><Link href="/contact">Contact</Link></li>
            <li><Link href="/terms">Terms</Link></li>
            <li><Link href="/privacy">Privacy</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t bg-zinc-100 dark:bg-zinc-800 py-4">
        <div className="max-w-7xl mx-auto px-6 text-sm flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>© {new Date().getFullYear()} Neutra. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <a href="#" className="text-sm">Newsletter</a>
            <a href="#" className="text-sm">Instagram</a>
            <a href="#" className="text-sm">Twitter</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
