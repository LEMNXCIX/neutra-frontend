"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

type Banner = { id: string; title: string; subtitle?: string; cta?: string; ctaUrl?: string; startsAt?: string; endsAt?: string; active?: boolean };

export default function BannerBar(){
  const [banners, setBanners] = useState<Banner[]>([]);
  const [visibleId, setVisibleId] = useState<string | null>(null);

  useEffect(()=>{
    let mounted = true;
    (async ()=>{
      try{
        const res = await fetch('/api/banners', { cache: 'no-store' });
        const json = await res.json().catch(()=>({}));
        const list = Array.isArray(json.banners) ? json.banners : [];
        if(!mounted) return;
        setBanners(list);
        if(list.length) setVisibleId(list[0].id);
      }catch{}
    })();
    return ()=>{ mounted = false };
  },[]);

  if(!visibleId) return null;
  const b = banners.find(x=> x.id === visibleId);
  if(!b) return null;

  return (
    <div className="w-full bg-gradient-to-r from-amber-500 to-rose-500 text-white py-3">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between gap-4">
        <div className="text-left">
          <div className="font-semibold text-lg">{b.title}</div>
          {b.subtitle && <div className="text-sm opacity-90">{b.subtitle}</div>}
        </div>
        <div className="flex items-center gap-3">
          {b.ctaUrl ? (
            <Link href={b.ctaUrl} className="bg-white text-amber-600 px-4 py-2 rounded-md font-medium">{b.cta || 'View'}</Link>
          ) : b.cta ? (
            <span className="bg-white text-amber-600 px-4 py-2 rounded-md font-medium">{b.cta}</span>
          ) : null}
          <button onClick={()=>setVisibleId(null)} className="text-white/90 hover:text-white">Dismiss</button>
        </div>
      </div>
    </div>
  )
}
