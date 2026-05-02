"use client";

import Link from "next/link";
import { ChefHat } from "@phosphor-icons/react";

export type BrandLogoPreset =
  | "siteHeader"
  | "workspaceSidebar"
  | "workspaceHeader"
  | "onboardingHero"
  | "onboardingMobile";

type BrandLogoLinkProps = {
  preset: BrandLogoPreset;
  href?: string;
  className?: string;
  /** When false, only the chef hat is shown (collapsed workspace sidebar). */
  showWordmark?: boolean;
  onClick?: () => void;
};

export function BrandLogoLink({
  preset,
  href = "/",
  className = "",
  showWordmark = true,
  onClick,
}: BrandLogoLinkProps) {
  const linkBase =
    preset === "siteHeader"
      ? "flex items-center gap-2"
      : preset === "workspaceSidebar"
        ? "flex h-full items-center gap-2"
        : preset === "workspaceHeader"
          ? "flex items-center gap-1.5 shrink-0"
          : preset === "onboardingHero"
            ? "inline-flex"
            : "inline-flex";

  const mergedLink = [linkBase, className].filter(Boolean).join(" ");

  const inner =
    preset === "siteHeader" || preset === "onboardingHero" || preset === "onboardingMobile" ? (
      <div
        className={
          preset === "onboardingMobile" ? "relative flex flex-col pl-1.5" : "relative flex flex-col pl-2"
        }
      >
        <ChefHat
          className={
            preset === "siteHeader"
              ? "absolute -left-2 -top-4 -rotate-[10deg] text-3xl text-[#d4af37]"
              : preset === "onboardingHero"
                ? "absolute -left-2 -top-4 -rotate-[10deg] text-4xl text-[#d4af37] drop-shadow-sm"
                : "absolute -left-1 -top-3 -rotate-[10deg] text-2xl text-[#d4af37]"
          }
          weight="fill"
          aria-hidden
        />
        <span
          className={
            preset === "siteHeader"
              ? "font-logo translate-y-1 text-4xl leading-none tracking-tight text-brand-dark"
              : preset === "onboardingHero"
                ? "font-logo translate-y-1 text-4xl leading-none tracking-tight text-white drop-shadow-md"
                : "font-logo translate-y-0.5 text-xl leading-none tracking-tight text-[#1c1c1c]"
          }
        >
          Bharat
        </span>
        <span
          className={
            preset === "siteHeader"
              ? "relative z-10 -mt-1 -rotate-2 rounded-sm bg-brand-red px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.3em] text-white shadow-sm"
              : preset === "onboardingHero"
                ? "relative z-10 -mt-1 -rotate-2 w-fit rounded-sm bg-brand-red px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.3em] text-white shadow-md"
                : "relative z-10 -mt-0.5 -rotate-2 w-fit rounded-sm bg-brand-red px-1.5 py-px text-[7px] font-bold uppercase tracking-[0.25em] text-white shadow-sm"
          }
        >
          Catering
        </span>
      </div>
    ) : (
      <>
        <ChefHat
          className={
            preset === "workspaceSidebar"
              ? "shrink-0 text-3xl text-[#d4af37]"
              : "shrink-0 text-2xl text-[#d4af37]"
          }
          weight="fill"
          aria-hidden
        />
        {showWordmark ? (
          <div className="flex flex-col">
            <span
              className={
                preset === "workspaceSidebar"
                  ? "font-logo translate-y-1 text-3xl leading-none tracking-tight text-brand-dark"
                  : "font-logo translate-y-0.5 text-2xl leading-none tracking-tight text-brand-dark"
              }
            >
              Bharat
            </span>
            <span
              className={
                preset === "workspaceSidebar"
                  ? "relative z-10 -mt-1 w-fit -rotate-2 rounded-sm bg-brand-red px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.3em] text-white shadow-sm"
                  : "relative z-10 -mt-0.5 w-fit -rotate-2 rounded-sm bg-brand-red px-1.5 py-px text-[7px] font-bold uppercase tracking-[0.28em] text-white shadow-sm"
              }
            >
              Catering
            </span>
          </div>
        ) : null}
      </>
    );

  return (
    <Link href={href} className={mergedLink} aria-label="Bharat Catering home" onClick={onClick}>
      {inner}
    </Link>
  );
}
