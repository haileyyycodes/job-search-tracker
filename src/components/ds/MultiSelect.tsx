"use client";

import { useEffect, useRef, useState } from "react";
import { DropdownSurface, isInsideDropdownSurface } from "./DropdownSurface";

interface MultiSelectProps {
  label?: string;
  values: string[];
  options: string[];
  onChange: (values: string[]) => void;
  onCreateOption?: (value: string) => void;
  placeholder?: string;
}

/** Creatable tag multi-select: pick from `options`, or type a new value and add it to the pool via `onCreateOption`. */
export function MultiSelect({ label, values, options, onChange, onCreateOption, placeholder = "Add…" }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node) && !isInsideDropdownSurface(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  const normalizedQuery = query.trim();
  const matches = options.filter((o) => o.toLowerCase().includes(normalizedQuery.toLowerCase()));
  const exactMatch = options.some((o) => o.toLowerCase() === normalizedQuery.toLowerCase());

  const toggle = (value: string) => {
    onChange(values.includes(value) ? values.filter((v) => v !== value) : [...values, value]);
  };

  const create = () => {
    if (!normalizedQuery || exactMatch) return;
    onCreateOption?.(normalizedQuery);
    onChange([...values, normalizedQuery]);
    setQuery("");
  };

  return (
    <div
      ref={containerRef}
      style={{ display: "flex", flexDirection: "column", gap: 6, position: "relative", width: "100%", minWidth: 0 }}
    >
      {label && <label style={{ font: "var(--text-label)", color: "var(--text-secondary)" }}>{label}</label>}
      {values.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {values.map((v) => (
            <span
              key={v}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                height: 24,
                padding: "0 8px",
                borderRadius: "var(--radius-pill)",
                background: "var(--blue-100)",
                color: "var(--blue-700)",
                font: "var(--text-caption)",
                fontWeight: 700,
              }}
            >
              {v}
              <button
                type="button"
                aria-label={`Remove ${v}`}
                onClick={() => toggle(v)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  color: "var(--blue-700)",
                  cursor: "pointer",
                  font: "inherit",
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
      <div
        ref={anchorRef}
        style={{
          display: "flex",
          alignItems: "center",
          height: 40,
          padding: "0 12px",
          background: "var(--bg-surface)",
          border: `1.5px solid ${open ? "var(--accent-primary)" : "var(--border-default)"}`,
          borderRadius: "var(--radius-s)",
        }}
      >
        <input
          value={query}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (matches.length === 1) toggle(matches[0]);
              else create();
            }
          }}
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
      <DropdownSurface open={open} anchorRef={anchorRef} maxHeight={220}>
            {matches.map((o) => (
              <div
                key={o}
                onClick={() => toggle(o)}
                style={{
                  padding: "8px 12px",
                  font: "var(--text-body-m)",
                  background: values.includes(o) ? "var(--blue-100)" : "transparent",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>{o}</span>
                {values.includes(o) && <span>✓</span>}
              </div>
            ))}
            {normalizedQuery && !exactMatch && (
              <div
                onClick={create}
                style={{
                  padding: "8px 12px",
                  font: "var(--text-body-m)",
                  color: "var(--text-link)",
                  cursor: "pointer",
                  borderTop: matches.length > 0 ? "1px solid var(--border-default)" : "none",
                }}
              >
                Create &ldquo;{normalizedQuery}&rdquo;
              </div>
            )}
            {matches.length === 0 && !normalizedQuery && (
              <div style={{ padding: "8px 12px", font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>
                Start typing to search or create a category.
              </div>
            )}
      </DropdownSurface>
    </div>
  );
}
