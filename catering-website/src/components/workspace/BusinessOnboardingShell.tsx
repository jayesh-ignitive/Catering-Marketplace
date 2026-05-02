"use client";

import Image from "next/image";
import { BrandLogoLink } from "@/components/common/BrandLogoLink";

type Props = {
  children: React.ReactNode;
};

export function BusinessOnboardingShell({ children }: Props) {
  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[#f5f5f5] font-sans text-stone-800">
      {/* Left: branding (desktop) */}
      <aside className="relative hidden h-full w-[42%] flex-col justify-between overflow-hidden bg-[#1c1c1c] p-10 text-white lg:flex xl:w-1/2 xl:p-12">
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="relative h-full w-full">
            <Image
              src="https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80"
              alt=""
              fill
              className="object-cover opacity-30"
              sizes="(min-width: 1024px) 50vw, 0"
              priority
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#1c1c1c] via-[#1c1c1c]/85 to-transparent" />
        </div>

        <div className="relative z-10">
          <BrandLogoLink preset="onboardingHero" className="mb-10" />

          <h1 className="mb-5 max-w-lg font-black text-4xl leading-tight tracking-tight text-white xl:text-5xl">
            Grow your catering business with us
          </h1>
          <p className="max-w-md text-lg leading-relaxed text-stone-300">
            Complete your business profile to join our marketplace, show up in search, and start receiving
            quality leads from customers near you.
          </p>
        </div>

        <div className="relative z-10 max-w-md rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
          <div className="mb-4 flex items-center gap-4">
            <div className="flex -space-x-3">
              <Image
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 rounded-full border-2 border-[#1c1c1c] object-cover"
              />
              <Image
                src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80"
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 rounded-full border-2 border-[#1c1c1c] object-cover"
              />
              <Image
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80"
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 rounded-full border-2 border-[#1c1c1c] object-cover"
              />
            </div>
            <div className="text-sm font-semibold leading-snug">
              <span className="text-[#ffc107]">1000+</span> caterers
              <br />
              on the platform
            </div>
          </div>
          <p className="text-sm italic leading-relaxed text-stone-300">
            &ldquo;Since joining, our wedding enquiries doubled. The workspace makes it easy to keep our listing
            accurate.&rdquo;
          </p>
        </div>
      </aside>

      {/* Right: wizard — mobile logo only (no top header bar) */}
      <div className="relative flex min-h-0 flex-1 flex-col bg-white lg:w-[58%] xl:w-1/2">
        <BrandLogoLink
          preset="onboardingMobile"
          className="absolute left-6 top-5 z-10 sm:left-10 lg:hidden"
        />

        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="mx-auto w-full max-w-2xl px-6 pt-14 pb-8 sm:px-10 sm:pt-14 sm:pb-10 lg:px-11 lg:pt-10 lg:pb-12 xl:px-16 xl:pt-12 xl:pb-14">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
