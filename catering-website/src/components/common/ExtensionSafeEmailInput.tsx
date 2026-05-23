"use client";

import { useEffect, useState, type InputHTMLAttributes } from "react";

/** Reduce password-manager / autofill extensions mutating SSR markup before hydration. */
const ANTI_EXTENSION_ATTRS = {
  "data-lpignore": "true",
  "data-1p-ignore": "true",
  "data-form-type": "other",
} as const;

export type ExtensionSafeEmailInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  /** Placeholder block uses same classes as the real input (height/layout). */
  skeletonClassName?: string;
};

/**
 * Renders the email input only after mount so browser extensions cannot inject
 * autofill buttons into server HTML (avoids React hydration mismatch).
 */
export function ExtensionSafeEmailInput({
  className,
  skeletonClassName,
  autoComplete = "email",
  ...rest
}: ExtensionSafeEmailInputProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const inputClass = className ?? "";
  const skeletonClass = skeletonClassName ?? inputClass;

  if (!mounted) {
    return <div className={skeletonClass} aria-hidden />;
  }

  return (
    <input
      type="email"
      className={inputClass}
      autoComplete={autoComplete}
      {...ANTI_EXTENSION_ATTRS}
      {...rest}
    />
  );
}
