"use client";

import { useCallback, useEffect, useRef } from "react";

const LENGTH = 6;

function cellsFromValue(value: string): string[] {
  const d = value.replace(/\D/g, "").slice(0, LENGTH);
  return Array.from({ length: LENGTH }, (_, i) => d[i] ?? "");
}

export type OtpInputProps = {
  value: string;
  onChange: (digits: string) => void;
  /** Called once when all 6 digits are present (paste or typing). */
  onComplete?: (digits: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  autoFocus?: boolean;
};

export function OtpInput({
  value,
  onChange,
  onComplete,
  disabled,
  hasError,
  autoFocus,
}: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const parts = cellsFromValue(value);
  const completedRef = useRef(false);

  const focusCell = useCallback((i: number) => {
    requestAnimationFrame(() => {
      refs.current[Math.max(0, Math.min(LENGTH - 1, i))]?.focus();
    });
  }, []);

  useEffect(() => {
    if (autoFocus) focusCell(0);
  }, [autoFocus, focusCell]);

  useEffect(() => {
    if (value.replace(/\D/g, "").length < LENGTH) {
      completedRef.current = false;
    }
  }, [value]);

  const commit = useCallback(
    (nextParts: string[]) => {
      const digits = nextParts.join("");
      onChange(digits);
      if (digits.length < LENGTH) {
        completedRef.current = false;
        return;
      }
      if (onComplete && !completedRef.current) {
        completedRef.current = true;
        onComplete(digits);
      }
    },
    [onChange, onComplete]
  );

  const applyPastedDigits = useCallback(
    (text: string) => {
      const digits = text.replace(/\D/g, "").slice(0, LENGTH);
      onChange(digits);
      focusCell(digits.length >= LENGTH ? LENGTH - 1 : digits.length);
      if (digits.length < LENGTH) {
        completedRef.current = false;
        return;
      }
      if (onComplete && !completedRef.current) {
        completedRef.current = true;
        onComplete(digits);
      }
    },
    [onChange, onComplete, focusCell]
  );

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const digit = e.target.value.replace(/\D/g, "").slice(-1);
    const next = [...parts];
    next[index] = digit;
    commit(next);
    if (digit && index < LENGTH - 1) {
      focusCell(index + 1);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (parts[index]) {
        e.preventDefault();
        const next = [...parts];
        next[index] = "";
        commit(next);
      } else if (index > 0) {
        e.preventDefault();
        focusCell(index - 1);
        const next = [...parts];
        next[index - 1] = "";
        commit(next);
      }
      return;
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusCell(index - 1);
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      focusCell(index + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    applyPastedDigits(e.clipboardData.getData("text"));
  };

  const boxBase =
    "h-12 w-full min-w-0 rounded-xl border text-center text-lg font-semibold tabular-nums shadow-sm outline-none transition sm:h-14 sm:text-xl";
  const boxOk =
    "border-gray-200 bg-white text-brand-dark focus:z-10 focus:border-brand-red focus:ring-4 focus:ring-brand-red/12";
  const boxErr =
    "border-red-400 bg-red-50/40 text-brand-dark focus:z-10 focus:border-red-500 focus:ring-4 focus:ring-red-500/15";
  const boxDisabled = "cursor-not-allowed opacity-60";

  return (
    <div className="w-full">
      <div
        className="grid grid-cols-6 gap-2 sm:gap-3"
        role="group"
        aria-label="Verification code, 6 digits. You can paste the full code."
      >
        {parts.map((char, index) => (
          <input
            key={index}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={1}
            value={char}
            disabled={disabled}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            aria-label={`Digit ${index + 1} of ${LENGTH}`}
            aria-invalid={hasError || undefined}
            className={`${boxBase} ${disabled ? boxDisabled : ""} ${hasError ? boxErr : boxOk}`}
          />
        ))}
      </div>
      <p className="mt-2 text-xs text-gray-500">
        Tip: paste your 6-digit code from email — all boxes fill automatically.
      </p>
    </div>
  );
}
