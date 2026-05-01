"use client";

import type { CSSProperties, RefObject } from "react";
import { useCallback, useLayoutEffect, useState } from "react";

const hiddenStyle: CSSProperties = { visibility: "hidden", pointerEvents: "none" };

/**
 * Positions a floating panel (e.g. suggestion list) below `anchorRef` using `position: fixed`
 * so it is not clipped by ancestor `overflow-y-auto` (workspace shell main scroll).
 */
export function useAnchoredFixedPanelStyle(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  repositionKey: string | number
): CSSProperties {
  const [style, setStyle] = useState<CSSProperties>(hiddenStyle);

  const measure = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const gap = 4;
    const maxH = Math.min(240, Math.max(80, window.innerHeight - rect.bottom - gap - 16));
    setStyle({
      position: "fixed",
      left: rect.left,
      top: rect.bottom + gap,
      width: rect.width,
      maxHeight: maxH,
      zIndex: 200,
      visibility: "visible",
      pointerEvents: "auto",
    });
  }, [anchorRef]);

  useLayoutEffect(() => {
    if (!open) return;
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, measure, repositionKey]);

  return open ? style : hiddenStyle;
}
