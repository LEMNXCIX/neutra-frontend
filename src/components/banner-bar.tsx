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
    <div className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white relative overflow-hidden mt-5">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left content */}
          <div className="flex items-center gap-3 flex-1">
            <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-lg leading-tight">{b.title}</div>
              {b.subtitle && (
                <div className="text-sm text-white/90 mt-0.5">{b.subtitle}</div>
              )}
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {b.ctaUrl ? (
              <Button
                asChild
                className="bg-white text-amber-600 hover:bg-white/90 font-semibold shadow-lg h-9 px-4 sm:px-6"
                size="sm"
              >
                <Link href={b.ctaUrl}>
                  {b.cta || 'View'}
                </Link>
              </Button>
            ) : b.cta ? (
              <span className="bg-white text-amber-600 px-4 sm:px-6 py-2 rounded-md font-semibold shadow-lg text-sm">
                {b.cta}
              </span>
            ) : null}

            <button
              onClick={() => setVisibleId(null)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
