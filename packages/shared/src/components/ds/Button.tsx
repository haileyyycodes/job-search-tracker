"use client";

import { ButtonHTMLAttributes, CSSProperties, ReactNode, useState } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const sizeMap: Record<ButtonSize, { h: number; px: number; fs: string }> = {
  sm: { h: 32, px: 12, fs: "var(--text-body-s)" },
  md: { h: 40, px: 16, fs: "var(--text-body-m)" },
  lg: { h: 48, px: 20, fs: "var(--text-body-l)" },
};

const variantStyle: Record<
  ButtonVariant,
  { bg: string; fg: string; border: string; hoverBg: string; activeBg: string }
> = {
  primary: {
    bg: "var(--accent-primary)",
    fg: "var(--text-on-accent)",
    border: "transparent",
    hoverBg: "var(--accent-primary-hover)",
    activeBg: "var(--accent-primary-active)",
  },
  secondary: {
    bg: "var(--bg-surface)",
    fg: "var(--text-primary)",
    border: "var(--border-strong)",
    hoverBg: "var(--bg-surface-hover)",
    activeBg: "var(--cream-200)",
  },
  ghost: {
    bg: "transparent",
    fg: "var(--text-primary)",
    border: "transparent",
    hoverBg: "var(--bg-surface-hover)",
    activeBg: "var(--cream-200)",
  },
  danger: {
    bg: "var(--red-600)",
    fg: "var(--white)",
    border: "transparent",
    hoverBg: "var(--red-500)",
    activeBg: "var(--red-600)",
  },
};

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "size"> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  icon,
  type = "button",
  style,
  ...rest
}: ButtonProps) {
  const v = variantStyle[variant];
  const s = sizeMap[size];
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);
  const bg = disabled ? "var(--ink-200)" : active ? v.activeBg : hover ? v.hoverBg : v.bg;
  const fg = disabled ? "var(--ink-400)" : v.fg;

  const computedStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: s.h,
    padding: `0 ${s.px}px`,
    background: bg,
    color: fg,
    border: `1px solid ${disabled ? "var(--ink-200)" : v.border}`,
    borderRadius: "var(--radius-s)",
    font: s.fs,
    fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "background var(--duration-fast) var(--ease-standard)",
    boxShadow: variant === "primary" && !disabled ? "var(--shadow-s)" : "none",
    whiteSpace: "nowrap",
    ...style,
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setActive(false);
      }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      style={computedStyle}
      {...rest}
    >
      {icon && <span style={{ display: "flex", width: 16, height: 16 }}>{icon}</span>}
      {children}
    </button>
  );
}
