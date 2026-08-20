"use client";

import { useEffect, useRef, useState } from "react";
import { DropdownSurface, isInsideDropdownSurface } from "./DropdownSurface";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  value?: string;
  options?: SelectOption[];
  onChange?: (value: string) => void;
  placeholder?: string;
  error?: string;
}

export function Select({ label, value, options = [], onChange, placeholder = "Select…", error }: SelectProps) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const sel = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (anchorRef.current?.contains(e.target as Node)) return;
      if (isInsideDropdownSurface(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, position: "relative", width: "100%", minWidth: 0 }}>
      {label && <label style={{ font: "var(--text-label)", color: "var(--text-secondary)" }}>{label}</label>}
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 40,
          padding: "0 12px",
          background: "var(--bg-surface)",
          border: `1.5px solid ${error ? "var(--red-500)" : open ? "var(--accent-primary)" : "var(--border-default)"}`,
          borderRadius: "var(--radius-s)",
          font: "var(--text-body-m)",
          color: sel ? "var(--text-primary)" : "var(--text-tertiary)",
          cursor: "pointer",
        }}
      >
        <span>{sel ? sel.label : placeholder}</span>
        <span style={{ fontSize: 10, color: "var(--text-tertiary)" }}>▾</span>
      </button>
      <DropdownSurface open={open} anchorRef={anchorRef}>
        {options.map((o) => (
          <div
            key={o.value}
            onClick={() => {
              onChange?.(o.value);
              setOpen(false);
            }}
            style={{
              padding: "8px 12px",
              font: "var(--text-body-m)",
              background: o.value === value ? "var(--blue-100)" : "transparent",
              color: "var(--text-primary)",
              cursor: "pointer",
            }}
          >
            {o.label}
          </div>
        ))}
      </DropdownSurface>
      {error && <span style={{ font: "var(--text-caption)", color: "var(--red-600)" }}>{error}</span>}
    </div>
  );
}
