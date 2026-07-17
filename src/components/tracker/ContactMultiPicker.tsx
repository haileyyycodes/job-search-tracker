"use client";

import { useEffect, useRef, useState } from "react";
import { companyName } from "@/lib/companies";
import type { Company, Contact } from "@/lib/types";

interface ContactMultiPickerProps {
  label?: string;
  contacts: Contact[];
  companies: Company[];
  value: string[];
  onChange: (contactIds: string[]) => void;
  onCreateContact: (contact: Contact) => void;
  defaultCompanyId?: string;
  error?: string;
}

/** Multi-select typeahead over existing contacts (chips), with inline "+ New contact" quick-create. */
export function ContactMultiPicker({
  label,
  contacts,
  companies,
  value,
  onChange,
  onCreateContact,
  defaultCompanyId,
  error,
}: ContactMultiPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedContacts = value
    .map((id) => contacts.find((c) => c.id === id))
    .filter((c): c is Contact => c != null);
  const filtered = contacts.filter((c) => !value.includes(c.id) && c.name.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setCreating(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const addContact = (id: string) => {
    onChange([...value, id]);
    setQuery("");
  };

  const removeContact = (id: string) => onChange(value.filter((v) => v !== id));

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    const contact: Contact = { id: crypto.randomUUID(), name, companyId: defaultCompanyId, notes: "" };
    onCreateContact(contact);
    addContact(contact.id);
    setNewName("");
    setCreating(false);
  };

  return (
    <div
      ref={containerRef}
      style={{ display: "flex", flexDirection: "column", gap: 6, position: "relative", width: "100%", minWidth: 0 }}
    >
      {label && <label style={{ font: "var(--text-label)", color: "var(--text-secondary)" }}>{label}</label>}
      <div
        onClick={() => setOpen(true)}
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 6,
          minHeight: 40,
          padding: "6px 10px",
          background: "var(--bg-surface)",
          border: `1.5px solid ${error ? "var(--red-500)" : open ? "var(--accent-primary)" : "var(--border-default)"}`,
          borderRadius: "var(--radius-s)",
          cursor: "text",
        }}
      >
        {selectedContacts.map((c) => (
          <span
            key={c.id}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              background: "var(--blue-100)",
              color: "var(--blue-700)",
              borderRadius: "var(--radius-pill)",
              padding: "2px 8px",
              font: "var(--text-caption)",
              fontWeight: 700,
            }}
          >
            {c.name}
            <span
              onClick={(e) => {
                e.stopPropagation();
                removeContact(c.id);
              }}
              style={{ cursor: "pointer" }}
            >
              ✕
            </span>
          </span>
        ))}
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={selectedContacts.length ? "" : "Search contacts…"}
          style={{
            flex: 1,
            minWidth: 100,
            border: "none",
            outline: "none",
            background: "transparent",
            font: "var(--text-body-m)",
            color: "var(--text-primary)",
          }}
        />
      </div>
      {error && <span style={{ font: "var(--text-caption)", color: "var(--red-600)" }}>{error}</span>}
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
            zIndex: 20,
            maxHeight: 240,
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          {filtered.map((c) => (
            <div
              key={c.id}
              onClick={() => addContact(c.id)}
              style={{ padding: "8px 12px", font: "var(--text-body-m)", color: "var(--text-primary)", cursor: "pointer" }}
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
        </div>
      )}
    </div>
  );
}
