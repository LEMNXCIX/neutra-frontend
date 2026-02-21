"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { X, Sparkles } from "lucide-react";
import { Button } from "./ui/button";

import { bannersService } from "@/services/banners.service";
import { Banner } from "@/types/banner.types";

// Removed local Banner type definition

export default function BannerBar() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [visibleId, setVisibleId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await bannersService.getAll();
        if (!mounted) return;
        setBanners(list || []);
        if (list && list.length) setVisibleId(list[0].id);
      } catch { }
    })();
    return () => { mounted = false };
  }, []);

  if (!visibleId) return null;
  const b = banners.find(x => x.id === visibleId);
  if (!b) return null;

  return (
    <div className="w-full bg-foreground text-background relative overflow-hidden mt-8 shadow-2xl border-b border-white/5">
      {/* Subtle animated background pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--primary)_0%,_transparent_70%)]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left content */}
          <div className="flex items-center gap-6 flex-1 text-center md:text-left">
            <div className="hidden sm:flex items-center justify-center w-12 h-12 bg-background/10 backdrop-blur-md text-background rounded-xl border border-white/10">
              <Sparkles className="h-6 w-6 stroke-[2px]" />
            </div>
            <div className="space-y-0.5">
              <div className="text-2xl md:text-3xl font-black tracking-tight uppercase leading-none italic">
                {b.title}
              </div>
              {b.subtitle && (
                <div className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-40">
                  {b.subtitle}
                </div>
              )}
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {b.ctaUrl ? (
              <Button
                asChild
                className="bg-background text-foreground hover:bg-background/90 font-black uppercase tracking-widest text-[10px] shadow-2xl h-11 px-8 rounded-none transition-all active:scale-95"
                size="sm"
              >
                <Link href={b.ctaUrl}>
                  {b.cta || 'Initialize'} →
                </Link>
              </Button>
            ) : b.cta ? (
              <span className="bg-background text-foreground px-8 py-3 rounded-none font-black uppercase tracking-widest text-[10px] shadow-2xl">
                {b.cta}
              </span>
            ) : null}

            <button
              onClick={() => setVisibleId(null)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-all active:scale-90"
              aria-label="Dismiss banner"
            >
              <X className="h-5 w-5 opacity-40 hover:opacity-100" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
