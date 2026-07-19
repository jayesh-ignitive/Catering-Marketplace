"use client";

import { useI18n } from "@/context/LocaleContext";
import Link from "next/link";
import Image from "next/image";

export type BrandLogoPreset =
  | "siteHeader"
  | "siteFooter"
  | "workspaceSidebar"
  | "workspaceHeader"
  | "onboardingHero"
  | "onboardingMobile";

type BrandLogoLinkProps = {
  preset: BrandLogoPreset;
  href?: string;
  className?: string;
  /** When false, only the chef hat/logo mark is shown (collapsed workspace sidebar). */
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
  const { w } = useI18n();
  const linkBase =
    preset === "siteHeader" || preset === "siteFooter"
      ? "flex items-center gap-2"
      : preset === "workspaceSidebar"
        ? "flex h-full items-center justify-center w-full"
        : preset === "workspaceHeader"
          ? "flex items-center gap-1.5 shrink-0"
          : preset === "onboardingHero"
            ? "inline-flex"
            : "inline-flex";

  const mergedLink = [linkBase, className].filter(Boolean).join(" ");

  const inner =
    preset === "siteHeader" ||
      preset === "siteFooter" ||
      preset === "onboardingHero" ||
      preset === "onboardingMobile" ? (
      <div className="flex items-center gap-2.5">
        <Image
          src="/brand/logo.svg"
          alt="Bharat Cater Hub"
          width={
            preset === "siteHeader"
              ? 100
              : preset === "onboardingHero"
                ? 44
                : preset === "siteFooter"
                  ? 100
                  : 32
          }
          height={
            preset === "siteHeader"
              ? 100
              : preset === "onboardingHero"
                ? 44
                : preset === "siteFooter"
                  ? 100
                  : 32
          }
          className={
            preset === "siteFooter" || preset === "onboardingHero"
              ? "object-contain brightness-0 invert"
              : preset === "siteHeader"
                ? "h-14 w-14 object-contain sm:h-[100px] sm:w-[100px]"
                : "object-contain"
          }
        />
        <div className="flex flex-col">
          <span
            className={
              preset === "siteHeader"
                ? "font-logo translate-y-0.5 text-3xl leading-none tracking-tight text-brand-dark sm:text-4xl"
                : preset === "siteFooter"
                  ? "font-heading font-extrabold text-xl uppercase tracking-wider text-white"
                  : preset === "onboardingHero"
                    ? "font-logo translate-y-0.5 text-4xl leading-none tracking-tight text-white drop-shadow-md"
                    : "font-logo translate-y-0.5 text-xl leading-none tracking-tight text-[#1c1c1c]"
            }
          >
            {w.common.brandPrimary}
          </span>
          <span
            className={
              preset === "siteHeader"
                ? "relative z-10 mt-0.5 -rotate-1 rounded-sm bg-brand-red px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.12em] text-white shadow-sm w-fit"
                : preset === "siteFooter"
                  ? "relative z-10 mt-1 w-fit rounded-sm bg-brand-red px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.15em] text-white shadow-sm"
                  : preset === "onboardingHero"
                    ? "relative z-10 mt-0.5 -rotate-1 w-fit rounded-sm bg-brand-red px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.12em] text-white shadow-md"
                    : "relative z-10 mt-0.5 -rotate-1 w-fit rounded-sm bg-brand-red px-1.5 py-px text-[6px] font-bold uppercase tracking-[0.1em] text-white shadow-sm"
            }
          >
            {w.common.brandSecondary}
          </span>
        </div>
      </div>
    ) : (
      <>
        <Image
          src="/brand/logo.svg"
          alt="Bharat Cater Hub"
          width={preset === "workspaceSidebar" ? (showWordmark ? 100 : 50) : 28}
          height={preset === "workspaceSidebar" ? (showWordmark ? 100 : 50) : 28}
          className="shrink-0 object-contain"
        />
        {showWordmark && preset !== "workspaceSidebar" ? (
          <div className="flex flex-col">
            <span className="font-logo translate-y-0.5 text-2xl leading-none tracking-tight text-brand-dark">
              {w.common.brandPrimary}
            </span>
            <span className="relative z-10 mt-0.5 w-fit -rotate-1 rounded-sm bg-brand-red px-1.5 py-px text-[6px] font-bold uppercase tracking-[0.1em] text-white shadow-sm">
              {w.common.brandSecondary}
            </span>
          </div>
        ) : null}
      </>
    );

  return (
    <Link href={href} className={mergedLink} aria-label={w.common.brandHomeAria} onClick={onClick}>
      {inner}
    </Link>
  );
}
