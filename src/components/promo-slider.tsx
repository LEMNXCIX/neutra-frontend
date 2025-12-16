"use client";
import React, { useState, useEffect } from "react";
import Image from "@/components/ui/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Slide = {
  id: string;
  title: string;
  desc?: string;
  img?: string;
};

export default function PromoSlider() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");

  // Touch/Swipe state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum swipe distance (in px) to trigger slide change
  const minSwipeDistance = 50;

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const res = await fetch('/api/sliders');
        const data = await res.json();
        if (data.sliders && Array.isArray(data.sliders)) {
          setSlides(data.sliders);
        }
      } catch (error) {
        console.error("Failed to fetch sliders", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSlides();
  }, []);

  const prev = () => {
    setDirection("prev");
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const next = () => {
    setDirection("next");
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  // Touch event handlers for swipe detection
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null); // Reset touch end
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      next(); // Swipe left = next slide
    } else if (isRightSwipe) {
      prev(); // Swipe right = previous slide
    }
  };

  // Autoplay con pausa al hover
  useEffect(() => {
    if (slides.length === 0) return;
    const interval = setInterval(() => next(), 20000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length]);

  if (loading) {
    return (
      <div className="relative group rounded-xl overflow-hidden h-[300px] sm:h-[420px] lg:h-[520px] shadow-lg bg-muted">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  if (slides.length === 0) return null;

  return (
    <div
      className="relative group rounded-xl overflow-hidden h-[300px] sm:h-[420px] lg:h-[520px] shadow-lg"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Contenedor de slides */}
      <div className="relative w-full h-full bg-zinc-100 dark:bg-zinc-800">
        {slides.map((slide, index) => {
          const isActive = index === currentIndex;

          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-all duration-700 ease-out transform
                ${isActive
                  ? "opacity-100 translate-x-0 scale-100"
                  : direction === "next"
                    ? "-translate-x-10 opacity-0 scale-105"
                    : "translate-x-10 opacity-0 scale-105"
                }`}
            >
              {slide.img && (
                <Image
                  src={slide.img}
                  alt={slide.title}
                  fill
                  priority={isActive}
                  className="object-cover rounded-xl"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1280px"
                />
              )}

              {/* Fondo de gradiente para mejorar la legibilidad del texto */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent"></div>
            </div>
          );
        })}
      </div>

      {/* Texto con animación de entrada */}
      <div
        key={slides[currentIndex].id}
        className="absolute bottom-6 sm:bottom-10 left-4 sm:left-8 text-white transition-all duration-700 ease-out animate-slide-up delay-100"
      >
        <div className="overflow-hidden ">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
            {slides[currentIndex].title}
          </h2>
        </div>
        <div className="overflow-hidden">
          <p className="text-sm sm:text-base opacity-90">
            {slides[currentIndex].desc}
          </p>
        </div>
      </div>

      {/* Botones de navegación */}
      <button
        onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/70 dark:bg-zinc-700/70 p-2 rounded-full backdrop-blur-sm shadow-md hover:scale-110 transition-all duration-300 opacity-0 group-hover:opacity-100"
        aria-label="Previous Slide"
      >
        <ChevronLeft className="text-zinc-900 dark:text-zinc-100 size-6" />
      </button>

      <button
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/70 dark:bg-zinc-700/70 p-2 rounded-full backdrop-blur-sm shadow-md hover:scale-110 transition-all duration-300 opacity-0 group-hover:opacity-100"
        aria-label="Next Slide"
      >
        <ChevronRight className="text-zinc-900 dark:text-zinc-100 size-6" />
      </button>

      {/* Indicadores (dots) */}
      <div className="absolute bottom-4 w-full flex justify-center gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${index === currentIndex
              ? "bg-white scale-125 shadow-md"
              : "bg-white/50 hover:bg-white/80"
              }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Animaciones personalizadas */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.6s ease-out forwards;
        }
        .delay-200 {
          animation-delay: 0.2s;
        }
      `}</style>
    </div>
  );
}
