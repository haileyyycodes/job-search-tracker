"use client";

import { CSSProperties, MouseEvent, ReactNode, useState } from "react";

export type MenuItemTone = "default" | "accent" | "danger";

interface MenuItemProps {
  children: ReactNode;
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
  /** Marks the row as the current selection (persistent blue fill). */
  selected?: boolean;
  /** "accent" for constructive action rows like "+ New company"; "danger" for destructive ones like "Delete". */
  tone?: MenuItemTone;
  style?: CSSProperties;
}

/**
 * One clickable row inside a DropdownSurface menu. Owns its own hover/press
 * feedback so every menu across the app reacts to the pointer the same way.
 */
export function MenuItem({ children, onClick, selected = false, tone = "default", style }: MenuItemProps) {
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);

  const background = selected
    ? active
      ? "var(--blue-300)"
      : hover
        ? "var(--blue-200)"
        : "var(--blue-100)"
    : tone === "danger"
      ? active
        ? "var(--red-200)"
        : hover
          ? "var(--red-100)"
          : "transparent"
      : active
        ? "var(--ink-200)"
        : hover
          ? "var(--bg-surface-hover)"
          : "transparent";

  return (
    <div
      role="option"
      aria-selected={selected}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setActive(false);
      }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      style={{
        padding: "8px 12px",
        font: "var(--text-body-m)",
        color: tone === "accent" ? "var(--text-link)" : tone === "danger" ? "var(--danger)" : "var(--text-primary)",
        fontWeight: tone === "default" ? 400 : 700,
        background,
        cursor: "pointer",
        transition: "background var(--duration-fast) var(--ease-standard)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
