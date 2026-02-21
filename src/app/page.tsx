'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getTenantUrl } from '@/lib/tenant';
import { useAuthStore } from '@/store/auth-store';
import { tenantService } from '@/services/tenant.service';
import { Tenant } from '@/types/tenant';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LayoutDashboard, LogIn, UserPlus, Menu, X, PlusCircle, ShoppingCart, Calendar } from 'lucide-react';
import { NeutralNavigation } from '@/components/neutral-navigation';
import Logo from '@/components/logo';
import { cn } from '@/lib/utils';

export default function LandingPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [storeUrl, setStoreUrl] = useState('#');
  const [bookingUrl, setBookingUrl] = useState('#');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.isAdmin;

  useEffect(() => {
    setIsMounted(true);
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

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300">
      <NeutralNavigation />

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-24 md:py-40 text-center animate-slide-up">
        <div className="max-w-4xl mx-auto space-y-8">
          <Badge variant="secondary" className="px-4 py-1 rounded-full mb-4">Version 2.5 Dynamic Core</Badge>
          
          <h1 className="text-5xl md:text-8xl font-bold mb-6 tracking-tight text-foreground">
            The Complete<br />
            Business Core.
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
            Architecting the future of multi-tenant <span className="text-foreground font-bold">commerce</span> and <span className="text-foreground font-bold">appointments</span>. Run your entire business from a single unified platform.
          </p>

          {user ? (
            <div className="flex flex-wrap gap-4 justify-center items-center">
              {isAdmin && tenants.length > 0 && tenants.map(tenant => (
                <a
                  key={tenant.id}
                  href={getTenantUrl(tenant.slug)}
                  className={cn(
                    "flex items-center justify-center gap-3 px-8 py-4 font-semibold text-sm transition-all rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5",
                    tenant.type === 'STORE'
                    ? 'bg-foreground text-background'
                    : 'bg-background text-foreground border border-border'
                  )}
                >
                  {tenant.type === 'STORE' ? (
                    <ShoppingCart className="w-4 h-4" />
                  ) : (
                    <Calendar className="w-4 h-4" />
                  )}
                  <span>{tenant.name}</span>
                </a>
              ))}
              <Link
                href="/onboarding/tenant"
                className="flex items-center justify-center gap-3 px-8 py-4 font-semibold text-sm bg-primary text-primary-foreground hover:opacity-90 transition-all rounded-xl shadow-md hover:-translate-y-0.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Launch New Instance</span>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                <Button size="lg" className="h-14 px-10 rounded-xl font-bold text-sm shadow-lg shadow-primary/20" asChild>
                    <Link href="/register">Get Started Now</Link>
                </Button>
                <Button variant="outline" size="lg" className="h-14 px-10 rounded-xl font-bold text-sm" asChild>
                    <Link href="/login">Identity Access</Link>
                </Button>
            </div>
          )}
        </div>
      </section >

      {/* Features Section - Precision Grid */}
      <section className="bg-muted/30 py-24 border-y border-border" >
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* E-Commerce Card */}
            <div className="p-12 t-card space-y-8 group">
              <div className="w-16 h-16 bg-primary/10 text-primary flex items-center justify-center rounded-2xl transition-transform group-hover:scale-110 duration-500">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-bold tracking-tight">Store Engine</h3>
                <p className="font-semibold uppercase tracking-widest text-[10px] text-primary">High-Performance Commerce Core</p>
              </div>
              <ul className="space-y-3 text-sm font-medium text-muted-foreground">
                <li className="flex items-center gap-3">
                  <div className="size-1.5 rounded-full bg-primary" />
                  <span>Inventory Management</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="size-1.5 rounded-full bg-primary" />
                  <span>Real-time Analytics</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="size-1.5 rounded-full bg-primary" />
                  <span>Global Checkout Flow</span>
                </li>
              </ul>
            </div>

            {/* Booking Card */}
            <div className="p-12 t-card space-y-8 group">
              <div className="w-16 h-16 bg-primary/10 text-primary flex items-center justify-center rounded-2xl transition-transform group-hover:scale-110 duration-500">
                <Calendar className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-bold tracking-tight">Booking Layer</h3>
                <p className="font-semibold uppercase tracking-widest text-[10px] text-primary">Enterprise Scheduling Protocol</p>
              </div>
              <ul className="space-y-3 text-sm font-medium text-muted-foreground">
                <li className="flex items-center gap-3">
                  <div className="size-1.5 rounded-full bg-primary" />
                  <span>Expert Availability</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="size-1.5 rounded-full bg-primary" />
                  <span>Conflict Management</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="size-1.5 rounded-full bg-primary" />
                  <span>Unified Dashboard</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section >

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12" >
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 text-muted-foreground font-medium text-xs uppercase tracking-widest">
          <p>© 2026 XCIX Platforms</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-foreground transition-colors">Twitter</a>
            <a href="#" className="hover:text-foreground transition-colors">Github</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div >
  );
  );
}
