"use client";

import { ChefHat } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";

const PANEL_BG =
  "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1000&q=80";

const AVA_1 =
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80";
const AVA_2 =
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80";
const AVA_3 =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80";

export const obLabel = "mb-1 block text-sm font-semibold text-gray-700";

export function obInputClass(hasError: boolean): string {
  return [
    "w-full rounded-lg border px-4 py-3 text-sm text-brand-dark transition placeholder:text-gray-400 outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red",
    hasError ? "border-red-500 bg-red-50/50 focus:border-red-500 focus:ring-red-500" : "border-gray-300",
  ].join(" ");
}

export const obPrimaryBtn =
  "inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-red px-8 py-3 text-sm font-bold text-white shadow-md transition hover:bg-red-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:shadow-md";

export type PartnerOnboardingAuthShellProps = {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
};

export function PartnerOnboardingAuthShell({ title, subtitle, children }: PartnerOnboardingAuthShellProps) {
  return (
    <main className="flex min-h-full w-full flex-col bg-brand-gray font-sans text-gray-800 lg:flex-row lg:items-start">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-dark p-12 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-5/12 lg:shrink-0 xl:w-1/2">
        <div className="absolute inset-0 z-0">
          <Image src={PANEL_BG} alt="" fill className="object-cover opacity-30" sizes="50vw" priority />
          <div
            className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/80 to-transparent"
            aria-hidden
          />
        </div>

        <div className="relative z-10">
          <Link href="/" className="mb-12 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-brand-red text-white shadow-lg">
              <ChefHat className="text-2xl" weight="bold" aria-hidden />
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-2xl font-bold leading-none tracking-tight">BHARAT</span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-brand-red">Caterers</span>
            </div>
          </Link>

          <h1 className="mb-6 font-heading text-4xl font-bold leading-tight xl:text-5xl">
            Grow Your Catering Business With Us
          </h1>
          <p className="max-w-md text-lg leading-relaxed text-gray-300">
            Join India&apos;s largest catering directory. Get verified, showcase your menus, and start receiving
            high-quality leads today.
          </p>
        </div>

        <div className="relative z-10 max-w-md rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
          <div className="mb-4 flex items-center gap-4">
            <div className="flex -space-x-3">
              <Image
                src={AVA_1}
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 rounded-full border-2 border-brand-dark object-cover"
              />
              <Image
                src={AVA_2}
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 rounded-full border-2 border-brand-dark object-cover"
              />
              <Image
                src={AVA_3}
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 rounded-full border-2 border-brand-dark object-cover"
              />
            </div>
            <div className="text-sm font-semibold">
              <span className="text-brand-yellow">1000+</span> Caterers
              <br />
              Already Joined
            </div>
          </div>
          <p className="text-sm italic text-gray-300">
            &quot;Since joining Bharat Caterers, our wedding booking rate has increased by 300%. The platform is
            incredibly easy to use.&quot;
          </p>
        </div>
      </div>

      <div className="flex w-full min-w-0 flex-1 flex-col bg-white lg:w-7/12 xl:w-1/2">
        <div className="flex items-center gap-2 border-b border-gray-100 p-6 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-brand-red text-white shadow-md">
            <ChefHat className="text-xl" weight="bold" aria-hidden />
          </div>
          <span className="font-heading text-xl font-bold tracking-tight text-brand-dark">Bharat Caterers</span>
        </div>

        <div className="mx-auto flex w-full max-w-2xl flex-col px-6 py-8 sm:p-10 lg:p-12 xl:p-16">
          <div className="mb-8">
            <h2 className="mb-2 font-heading text-3xl font-bold text-brand-dark">{title}</h2>
            {subtitle ? <div className="text-gray-500">{subtitle}</div> : null}
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}
