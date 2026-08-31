"use client";

import { useEffect, useRef, useState } from "react";
import { DropdownSurface, FieldLabel, isInsideDropdownSurface, MenuItem } from "@/components/ds";
import type { NewCompany } from "@/lib/dataSource/types";
import type { Company } from "@/lib/types";

interface CompanyPickerProps {
  label?: string;
  required?: boolean;
  companies: Company[];
  value: string;
  onChange: (companyId: string) => void;
  onCreateCompany: (company: NewCompany) => Promise<Company>;
  error?: string;
  placeholder?: string;
}

/** Typeahead search over existing companies, with inline "+ New company" quick-create (name only, non-target). */
export function CompanyPicker({
  label,
  required = false,
  companies,
  value,
  onChange,
  onCreateCompany,
  error,
  placeholder = "Search companies…",
}: CompanyPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  const selected = companies.find((c) => String(c.id) === value);
  const filtered = companies.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node) && !isInsideDropdownSurface(e.target)) {
        setOpen(false);
        setCreating(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const selectCompany = (id: string) => {
    onChange(id);
    setQuery("");
    setOpen(false);
    setCreating(false);
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    const company = await onCreateCompany({ name, isTarget: false, status: "researching", locations: [], notes: "" });
    selectCompany(String(company.id));
    setNewName("");
  };

  return (
    <div
      ref={containerRef}
      style={{ display: "flex", flexDirection: "column", gap: 6, position: "relative", width: "100%", minWidth: 0 }}
    >
      {label && <FieldLabel required={required}>{label}</FieldLabel>}
      <div
        ref={anchorRef}
        onClick={() => setOpen(true)}
        style={{
          display: "flex",
          alignItems: "center",
          height: 40,
          padding: "0 12px",
          background: "var(--bg-surface)",
          border: `1.5px solid ${error ? "var(--red-500)" : open ? "var(--accent-primary)" : "var(--border-default)"}`,
          borderRadius: "var(--radius-s)",
          cursor: "text",
        }}
      >
        <input
          value={open ? query : (selected?.name ?? "")}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={selected && !open ? selected.name : placeholder}
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
      {error && <span style={{ font: "var(--text-caption)", color: "var(--red-600)" }}>{error}</span>}
      <DropdownSurface open={open} anchorRef={anchorRef}>
          {filtered.map((c) => (
            <MenuItem
              key={c.id}
              selected={String(c.id) === value}
              onClick={() => selectCompany(String(c.id))}
            >
              {c.name}
              {c.industry && (
                <span style={{ color: "var(--text-tertiary)", marginLeft: 6, font: "var(--text-caption)" }}>
                  {c.industry}
                </span>
              )}
            </MenuItem>
          ))}
          {filtered.length === 0 && !creating && (
            <div style={{ padding: "10px 12px", font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>
              No companies match.
            </div>
          )}
          {!creating && (
            <MenuItem
              tone="accent"
              onClick={() => {
                setCreating(true);
                setNewName(query);
              }}
              style={{ borderTop: "1px solid var(--border-default)" }}
            >
              + New company{query ? `: "${query}"` : ""}
            </MenuItem>
          )}
          {creating && (
            <div style={{ padding: 10, borderTop: "1px solid var(--border-default)", display: "flex", gap: 8 }}>
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreate();
                  }
                }}
                placeholder="Company name"
                style={{
                  flex: 1,
                  height: 32,
                  padding: "0 8px",
                  border: "1.5px solid var(--border-default)",
                  borderRadius: "var(--radius-s)",
                  font: "var(--text-body-s)",
                  color: "var(--text-primary)",
                }}
              />
              <button
                type="button"
                onClick={handleCreate}
                style={{
                  height: 32,
                  padding: "0 12px",
                  background: "var(--blue-600)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "var(--radius-s)",
                  font: "700 12px var(--font-body)",
                  cursor: "pointer",
                }}
              >
                Add
              </button>
            </div>
          )}
      </DropdownSurface>
    </div>
  );
}
