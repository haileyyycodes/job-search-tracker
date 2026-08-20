"use client";

import { ReactNode, useState } from "react";

export type InputSize = "sm" | "md" | "lg";

interface InputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  type?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  size?: InputSize;
  leadingIcon?: ReactNode;
}

const heightMap: Record<InputSize, number> = { sm: 32, md: 40, lg: 48 };

export function Input({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  error,
  hint,
  disabled = false,
  size = "md",
  leadingIcon,
}: InputProps) {
  const [focus, setFocus] = useState(false);
  const h = heightMap[size];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", minWidth: 0 }}>
      {label && <label style={{ font: "var(--text-label)", color: "var(--text-secondary)" }}>{label}</label>}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          height: h,
          padding: "0 12px",
          background: disabled ? "var(--bg-surface-sunken)" : "var(--bg-surface)",
          border: `1.5px solid ${error ? "var(--red-500)" : focus ? "var(--accent-primary)" : "var(--border-default)"}`,
          borderRadius: "var(--radius-s)",
          boxShadow: focus ? "0 0 0 3px var(--blue-100)" : "none",
          transition: "border-color var(--duration-fast), box-shadow var(--duration-fast)",
        }}
      >
        {leadingIcon && (
          <span style={{ width: 16, height: 16, color: "var(--text-tertiary)", display: "flex" }}>{leadingIcon}</span>
        )}
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
            font: "var(--text-body-m)",
            color: "var(--text-primary)",
            minWidth: 0,
          }}
        />
      </div>
      {error ? (
        <span style={{ font: "var(--text-caption)", color: "var(--red-600)" }}>{error}</span>
      ) : (
        hint && <span style={{ font: "var(--text-caption)", color: "var(--text-tertiary)" }}>{hint}</span>
      )}
    </div>
  );
}
