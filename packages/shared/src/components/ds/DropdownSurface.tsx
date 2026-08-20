"use client";

import { CSSProperties, ReactNode, RefObject, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

const GAP = 4;
const VIEWPORT_MARGIN = 8;

/** True when the event target sits inside a portaled dropdown surface — outside-click handlers must not treat those clicks as outside. */
export function isInsideDropdownSurface(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest("[data-dropdown-surface]") != null;
}

interface DropdownSurfaceProps {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  children: ReactNode;
  maxHeight?: number;
}

/**
 * Portals dropdown content to <body> as a fixed-position layer, so menus overlay
 * dialogs and scroll containers instead of being clipped by them or forcing the
 * modal to scroll. Flips upward when the space below the anchor is tight, caps
 * height to the available space (scrolling internally), and tracks the anchor on
 * scroll/resize.
 */
export function DropdownSurface({ open, anchorRef, children, maxHeight = 240 }: DropdownSurfaceProps) {
  const [position, setPosition] = useState<CSSProperties | null>(null);

  // Position persists while closed (the surface isn't rendered then) and is
  // recomputed by this layout effect before paint on every open.
  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const below = window.innerHeight - rect.bottom - GAP - VIEWPORT_MARGIN;
      const above = rect.top - GAP - VIEWPORT_MARGIN;
      const openUp = below < Math.min(maxHeight, 160) && above > below;
      setPosition({
        left: rect.left,
        width: rect.width,
        maxHeight: Math.max(Math.min(maxHeight, openUp ? above : below), 80),
        ...(openUp ? { bottom: window.innerHeight - rect.top + GAP } : { top: rect.bottom + GAP }),
      });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, anchorRef, maxHeight]);

  if (!open || !position) return null;

  return createPortal(
    <div
      data-dropdown-surface=""
      style={{
        position: "fixed",
        zIndex: 200,
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-s)",
        boxShadow: "var(--shadow-m)",
        overflowY: "auto",
        overflowX: "hidden",
        ...position,
      }}
    >
      {children}
    </div>,
    document.body
  );
}
