"use client";
import React, { useState } from 'react';
import Image from 'next/image';

const slides = [
  { id: 's1', title: 'Autumn Sale', subtitle: 'Up to 30% off selected items', image: 'https://picsum.photos/seed/slide1/1200/500' },
  { id: 's2', title: 'New Arrivals', subtitle: 'Minimal sofas and chairs', image: 'https://picsum.photos/seed/slide2/1200/500' },
  { id: 's3', title: 'Free Shipping', subtitle: 'On orders over $100', image: 'https://picsum.photos/seed/slide3/1200/500' },
];

export default function PromoSlider(){
  const [i, setI] = useState(0);

  const prev = () => setI((s) => (s - 1 + slides.length) % slides.length);
  const next = () => setI((s) => (s + 1) % slides.length);

  return (
    <div className="relative rounded-md overflow-hidden">
      <div className="h-44 sm:h-56 w-full bg-zinc-100 dark:bg-zinc-800 relative">
        {/* next/image for optimization */}
        <Image src={slides[i].image} alt={slides[i].title} fill className="object-cover" sizes="100vw" />
      </div>
      <div className="absolute left-4 bottom-4 bg-black/50 text-white px-4 py-2 rounded">
        <div className="font-semibold">{slides[i].title}</div>
        <div className="text-sm">{slides[i].subtitle}</div>
      </div>
      <div className="absolute inset-y-0 left-0 flex items-center">
        <button onClick={prev} className="p-2 m-2 bg-white/60 rounded">‹</button>
      </div>
      <div className="absolute inset-y-0 right-0 flex items-center">
        <button onClick={next} className="p-2 m-2 bg-white/60 rounded">›</button>
      </div>
    </div>
  );
}
