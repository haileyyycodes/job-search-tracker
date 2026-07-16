"use client";

import { useState } from "react";
import { Input, IconButton } from "@/components/ds";
import type { Contact } from "@/lib/types";

interface ContactsListViewProps {
  contacts: Contact[];
  onSelect: (contact: Contact) => void;
  onRequestDelete: (contact: Contact) => void;
}

export function ContactsListView({ contacts, onSelect, onRequestDelete }: ContactsListViewProps) {
  const [q, setQ] = useState("");

  const filtered = contacts.filter(
    (c) => c.name.toLowerCase().includes(q.toLowerCase()) || (c.employer ?? "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div style={{ padding: "0 32px 32px", overflow: "auto", flex: 1 }}>
      <div style={{ display: "flex", gap: 12, padding: "16px 0" }}>
        <div style={{ width: 260 }}>
          <Input placeholder="Search name or employer…" value={q} onChange={setQ} />
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 40px",
          columnGap: 16,
          padding: "12px 4px",
          font: "var(--text-label)",
          color: "var(--text-tertiary)",
          borderBottom: "1px solid var(--border-default)",
          textTransform: "uppercase",
          letterSpacing: "var(--tracking-wide)",
          fontSize: 11,
        }}
      >
        <span>Name</span>
        <span>Employer / role</span>
        <span>Contact info</span>
        <span />
      </div>
      {filtered.map((c) => (
        <div
          key={c.id}
          onClick={() => onSelect(c)}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 40px",
            columnGap: 16,
            alignItems: "center",
            padding: "14px 4px",
            borderBottom: "1px solid var(--border-default)",
            cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "var(--blue-100)",
                color: "var(--blue-700)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                font: "700 14px var(--font-display)",
                flexShrink: 0,
              }}
            >
              {c.name.charAt(0).toUpperCase()}
            </div>
            <span style={{ font: "700 14px var(--font-body)", color: "var(--text-primary)" }}>{c.name}</span>
          </div>
          <div>
            <div style={{ font: "var(--text-body-s)", color: "var(--text-primary)" }}>{c.employer || "—"}</div>
            {c.role && <div style={{ font: "var(--text-caption)", color: "var(--text-tertiary)" }}>{c.role}</div>}
          </div>
          <span style={{ font: "var(--text-body-s)", color: "var(--text-secondary)" }}>
            {[c.email, c.phone].filter(Boolean).join(" · ") || "—"}
          </span>
          <IconButton
            aria-label="Delete contact"
            icon={<span>✕</span>}
            onClick={(e) => {
              e.stopPropagation();
              onRequestDelete(c);
            }}
          />
        </div>
      ))}
      {filtered.length === 0 && (
        <div style={{ padding: "24px 4px", font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>
          No contacts match.
        </div>
      )}
    </div>
  );
}
