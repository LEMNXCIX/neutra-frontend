'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getTenantUrl } from '@/lib/tenant';
import { useAuthStore } from '@/store/auth-store';
import { tenantService } from '@/services/tenant.service';
import { Tenant } from '@/types/tenant';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, LogIn, UserPlus, Menu, X, PlusCircle } from 'lucide-react';
import { NeutralNavigation } from '@/components/neutral-navigation';
import Logo from '@/components/logo';

export default function LandingPage() {
  const [storeUrl, setStoreUrl] = useState('#');
  const [bookingUrl, setBookingUrl] = useState('#');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.isAdmin;

  useEffect(() => {
    setStoreUrl(getTenantUrl('default'));
    setBookingUrl(getTenantUrl('booking'));

    if (isAdmin) {
      const fetchTenants = async () => {
        try {
          const data = await tenantService.getAll();
          setTenants(data || []);
        } catch (error) {
          console.error('Error fetching tenants:', error);
        }
      };
      fetchTenants();
    }
  }, [isAdmin]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300">
      <NeutralNavigation />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 md:py-40 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-black mb-8 leading-[0.9] tracking-tighter uppercase text-foreground">
            Your All-in-One<br />
            Business Platform
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-16 max-w-2xl mx-auto font-medium">
            Sell products online or manage appointments seamlessly. Everything you need to run your business in one powerful platform.
          </p>

          {user && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {isAdmin && tenants.length > 0 && tenants.map(tenant => (
                <a
                  key={tenant.id}
                  href={getTenantUrl(tenant.slug)}
                  className={`flex items-center justify-center gap-4 px-10 py-5 font-black text-xl transition-all w-full sm:w-auto uppercase tracking-tight shadow-md hover:shadow-lg active:scale-95 ${tenant.type === 'STORE'
                    ? 'bg-foreground text-background hover:bg-muted-foreground border-2 border-transparent'
                    : 'bg-background text-foreground border-4 border-foreground hover:bg-foreground hover:text-background font-black'
                    }`}
                >
                  {tenant.type === 'STORE' ? (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                  <span>{tenant.name}</span>
                </a>
              ))}
              <Link
                href="/onboarding/tenant"
                className="flex items-center justify-center gap-4 px-10 py-5 font-black text-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all w-full sm:w-auto uppercase tracking-tight shadow-xl"
              >
                <PlusCircle className="w-8 h-8" />
                <span>Create your Store</span>
              </Link>
            </div>
          )}
        </div>
      </section >

      {/* Features Section */}
      <section className="bg-muted/30 border-y border-border relative" >
        <div className="container mx-auto px-4 py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* E-Commerce Card */}
            <div className="bg-card p-10 border-2 border-border shadow-sm">
              <div className="w-16 h-16 bg-primary flex items-center justify-center mb-8">
                <svg className="w-8 h-8 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="text-3xl font-black text-card-foreground mb-6 uppercase tracking-tight">E-Commerce Store</h3>
              <ul className="space-y-4 text-muted-foreground font-bold">
                <li className="flex items-center gap-3">
                  <div className="size-2 bg-primary" />
                  <span>Product catalog & inventory</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="size-2 bg-primary" />
                  <span>Shopping cart & checkout</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="size-2 bg-primary" />
                  <span>Order tracking & management</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="size-2 bg-primary" />
                  <span>Multi-tenant support</span>
                </li>
              </ul>
            </div>

            {/* Booking Card */}
            <div className="bg-primary p-10 border-2 border-primary shadow-xl">
              <div className="w-16 h-16 bg-primary-foreground flex items-center justify-center mb-8">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-3xl font-black text-primary-foreground mb-6 uppercase tracking-tight">Appointment Booking</h3>
              <ul className="space-y-4 text-primary-foreground/70 font-bold">
                <li className="flex items-center gap-3">
                  <div className="size-2 bg-primary-foreground" />
                  <span>Service catalog & pricing</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="size-2 bg-primary-foreground" />
                  <span>Staff scheduling & availability</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="size-2 bg-primary-foreground" />
                  <span>Email confirmations</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="size-2 bg-primary-foreground" />
                  <span>Customer dashboard</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section >

      {/* Footer */}
      <footer className="container mx-auto px-4 py-16" >
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 text-muted-foreground font-bold text-sm uppercase tracking-widest">
          <p>© 2025 XCIX Platforms</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-foreground transition-colors">Twitter</a>
            <a href="#" className="hover:text-foreground transition-colors">Github</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div >
  );
}
