"use client";
import React, { useState, useEffect } from "react";
import Image from "@/components/ui/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

const slides = [
  {
    id: "s1",
    title: "Autumn Sale",
    subtitle: "Up to 30% off selected items",
    image: "https://picsum.photos/seed/slide1/1200/500",
  },
  {
    id: "s2",
    title: "New Arrivals",
    subtitle: "Minimal sofas and chairs",
    image: "https://picsum.photos/seed/slide2/1200/500",
  },
  {
    id: "s3",
    title: "Free Shipping",
    subtitle: "On orders over $100",
    image: "https://picsum.photos/seed/slide3/1200/500",
  },
];

export default function PromoSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");

  const prev = () => {
    setDirection("prev");
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const next = () => {
    setDirection("next");
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  // Autoplay con pausa al hover
  useEffect(() => {
    const interval = setInterval(() => next(), 20000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative group rounded-xl overflow-hidden h-[300px] sm:h-[420px] lg:h-[520px] shadow-lg">
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
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                priority={isActive}
                className="object-cover rounded-xl"
                sizes="100vw"
              />

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
            {slides[currentIndex].subtitle}
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
