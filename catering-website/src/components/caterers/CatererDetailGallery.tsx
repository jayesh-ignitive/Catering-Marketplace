"use client";

import { RemoteContentImage } from "@/components/common/RemoteContentImage";
import { CaretLeft, CaretRight, X } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

export function CatererDetailGallery({
  images,
  businessName,
}: {
  images: string[];
  businessName: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const preview = images.slice(0, 3);

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenIndex(null);
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setOpenIndex((i) => (i === null ? null : i > 0 ? i - 1 : images.length - 1));
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setOpenIndex((i) => (i === null ? null : i < images.length - 1 ? i + 1 : 0));
      }
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [openIndex, images.length]);

  return (
    <>
      <div className="mb-6 flex items-end justify-between">
        <h2 className="flex items-center gap-3 font-heading text-2xl font-bold text-brand-dark">
          <span className="h-8 w-1.5 rounded-full bg-brand-yellow" aria-hidden />
          Photo Gallery
        </h2>
        {images.length > 3 ? (
          <button
            type="button"
            className="cursor-pointer text-sm font-bold text-brand-red hover:underline"
            onClick={() => setOpenIndex(0)}
          >
            View All Photos
          </button>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {preview.map((url, i) => (
          <button
            key={`${url}-${i}`}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="relative h-48 cursor-pointer overflow-hidden rounded-2xl text-left outline-none focus-visible:ring-2 focus-visible:ring-brand-red"
            aria-label={`Open gallery image ${i + 1}`}
          >
            <RemoteContentImage
              src={url}
              alt=""
              fill
              sizes="(max-width: 768px) 50vw, 280px"
              className="object-cover transition duration-500 hover:scale-110"
            />
          </button>
        ))}
      </div>

      {openIndex !== null ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`${businessName} gallery`}
        >
          <button
            type="button"
            className="absolute inset-0 z-[60] cursor-pointer bg-black/92"
            aria-label="Close gallery"
            onClick={() => setOpenIndex(null)}
          />
          <button
            type="button"
            className="absolute right-3 top-3 z-[110] flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Close"
            onClick={() => setOpenIndex(null)}
          >
            <X className="text-2xl" aria-hidden />
          </button>
          {images.length > 1 ? (
            <>
              <button
                type="button"
                className="absolute left-3 top-1/2 z-[110] flex h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white"
                aria-label="Previous"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenIndex((i) => (i === null ? null : i > 0 ? i - 1 : images.length - 1));
                }}
              >
                <CaretLeft aria-hidden />
              </button>
              <button
                type="button"
                className="absolute right-3 top-1/2 z-[110] flex h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white"
                aria-label="Next"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenIndex((i) => (i === null ? null : i < images.length - 1 ? i + 1 : 0));
                }}
              >
                <CaretRight aria-hidden />
              </button>
            </>
          ) : null}
          <div className="relative z-[70]" onClick={(e) => e.stopPropagation()}>
            <RemoteContentImage
              src={images[openIndex]!}
              alt={`${businessName} — photo ${openIndex + 1}`}
              width={1200}
              height={880}
              sizes="96vw"
              className="max-h-[min(88vh,880px)] max-w-[min(96vw,1200px)] h-auto w-auto rounded-lg object-contain shadow-2xl"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
