"use client";

import { useState } from "react";

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
}

export function Select({ label, value, options = [], onChange, placeholder = "Select…" }: SelectProps) {
  const [open, setOpen] = useState(false);
  const sel = options.find((o) => o.value === value);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, position: "relative", width: "100%", minWidth: 0 }}>
      {label && <label style={{ font: "var(--text-label)", color: "var(--text-secondary)" }}>{label}</label>}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 40,
          padding: "0 12px",
          background: "var(--bg-surface)",
          border: `1.5px solid ${open ? "var(--accent-primary)" : "var(--border-default)"}`,
          borderRadius: "var(--radius-s)",
          font: "var(--text-body-m)",
          color: sel ? "var(--text-primary)" : "var(--text-tertiary)",
          cursor: "pointer",
        }}
      >
        <span>{sel ? sel.label : placeholder}</span>
        <span style={{ fontSize: 10, color: "var(--text-tertiary)" }}>▾</span>
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 4,
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-s)",
            boxShadow: "var(--shadow-m)",
            zIndex: 10,
            overflow: "hidden",
          }}
        >
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
        </div>
      )}
    </div>
  );
}
