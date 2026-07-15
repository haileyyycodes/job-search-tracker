"use client";

import { ReactNode, useState } from "react";

export type IconButtonVariant = "primary" | "secondary" | "ghost";
export type IconButtonSize = "sm" | "md" | "lg";

const sizeMap: Record<IconButtonSize, number> = { sm: 28, md: 36, lg: 44 };

const variantStyle: Record<IconButtonVariant, { bg: string; fg: string; hoverBg: string; border: string }> = {
  primary: { bg: "var(--accent-primary)", fg: "var(--white)", hoverBg: "var(--accent-primary-hover)", border: "transparent" },
  secondary: { bg: "var(--bg-surface)", fg: "var(--text-primary)", hoverBg: "var(--bg-surface-hover)", border: "var(--border-strong)" },
  ghost: { bg: "transparent", fg: "var(--text-secondary)", hoverBg: "var(--bg-surface-hover)", border: "transparent" },
};

interface IconButtonProps {
  icon: ReactNode;
  "aria-label": string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  disabled?: boolean;
  onClick?: () => void;
}

export function IconButton({
  icon,
  "aria-label": ariaLabel,
  variant = "ghost",
  size = "md",
  disabled = false,
  onClick,
}: IconButtonProps) {
  const v = variantStyle[variant];
  const s = sizeMap[size];
  const [hover, setHover] = useState(false);

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: s,
        height: s,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: disabled ? "var(--ink-100)" : hover ? v.hoverBg : v.bg,
        color: disabled ? "var(--ink-300)" : v.fg,
        border: `1px solid ${disabled ? "var(--ink-200)" : v.border}`,
        borderRadius: "var(--radius-s)",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background var(--duration-fast) var(--ease-standard)",
      }}
    >
      <span style={{ width: 18, height: 18, display: "flex" }}>{icon}</span>
    </button>
  );
}
