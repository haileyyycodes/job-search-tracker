"use client";

import { useEffect, useRef, useState } from "react";
import { DropdownSurface, isInsideDropdownSurface } from "@/components/ds";
import { companyName } from "@/lib/companies";
import type { Company, Contact } from "@/lib/types";

interface ContactPickerProps {
  label?: string;
  contacts: Contact[];
  companies: Company[];
  value: string;
  onChange: (contactId: string) => void;
  onCreateContact: (contact: Contact) => void;
  defaultCompanyId?: string;
  error?: string;
  placeholder?: string;
}

/** Typeahead search over existing contacts, with inline "+ New contact" quick-create (name only, required). */
export function ContactPicker({
  label,
  contacts,
  companies,
  value,
  onChange,
  onCreateContact,
  defaultCompanyId,
  error,
  placeholder = "Search contacts…",
}: ContactPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  const selected = contacts.find((c) => c.id === value);
  const filtered = contacts.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));

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

  const selectContact = (id: string) => {
    onChange(id);
    setQuery("");
    setOpen(false);
    setCreating(false);
  };

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    const contact: Contact = { id: crypto.randomUUID(), name, companyId: defaultCompanyId, notes: "" };
    onCreateContact(contact);
    selectContact(contact.id);
    setNewName("");
  };

  return (
    <div
      ref={containerRef}
      style={{ display: "flex", flexDirection: "column", gap: 6, position: "relative", width: "100%", minWidth: 0 }}
    >
      {label && <label style={{ font: "var(--text-label)", color: "var(--text-secondary)" }}>{label}</label>}
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
            <div
              key={c.id}
              onClick={() => selectContact(c.id)}
              style={{
                padding: "8px 12px",
                font: "var(--text-body-m)",
                color: "var(--text-primary)",
                cursor: "pointer",
                background: c.id === value ? "var(--blue-100)" : "transparent",
              }}
            >
              {c.name}
              {c.companyId && (
                <span style={{ color: "var(--text-tertiary)", marginLeft: 6, font: "var(--text-caption)" }}>
                  {companyName(c.companyId, companies)}
                </span>
              )}
            </div>
          ))}
          {filtered.length === 0 && !creating && (
            <div style={{ padding: "10px 12px", font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>
              No contacts match.
            </div>
          )}
          {!creating && (
            <div
              onClick={() => {
                setCreating(true);
                setNewName(query);
              }}
              style={{
                padding: "8px 12px",
                font: "700 13px var(--font-body)",
                color: "var(--blue-600)",
                cursor: "pointer",
                borderTop: "1px solid var(--border-default)",
              }}
            >
              + New contact{query ? `: "${query}"` : ""}
            </div>
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
                placeholder="Contact name"
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
