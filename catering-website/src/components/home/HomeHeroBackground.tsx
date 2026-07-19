"use client";

import type { PublicHomeHeroSlide } from "@/lib/home-banners";
import Image from "next/image";
import { useEffect, useState } from "react";

const ROTATE_MS = 8000;

export function HomeHeroBackground({
  slides,
  fallbackSrc,
}: {
  slides: PublicHomeHeroSlide[];
  fallbackSrc: string;
}) {
  const [index, setIndex] = useState(0);
  const activeSlides = slides.length > 0 ? slides : null;

  useEffect(() => {
    if (!activeSlides || activeSlides.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % activeSlides.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [activeSlides]);

  if (!activeSlides) {
    return (
      <div className="relative h-full w-full">
        <Image
          src={fallbackSrc}
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
          priority
          fetchPriority="high"
          quality={65}
        />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {activeSlides.map((slide, i) => (
        <Image
          key={slide.id}
          src={slide.imageUrl}
          alt={slide.title ?? ""}
          fill
          className={[
            "object-cover transition-opacity duration-1000 ease-in-out",
            i === index ? "opacity-100" : "opacity-0",
          ].join(" ")}
          sizes="100vw"
          priority={i === 0}
          fetchPriority={i === 0 ? "high" : undefined}
          quality={65}
        />
      ))}
      {activeSlides.length > 1 ? (
        <div
          className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2"
          aria-label="Hero slides"
        >
          {activeSlides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Show slide ${i + 1}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className={[
                "h-2 w-2 cursor-pointer rounded-full transition-all",
                i === index ? "w-6 bg-white" : "bg-white/50 hover:bg-white/80",
              ].join(" ")}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
