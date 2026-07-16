"use client";

import { useState } from "react";
import { Input, Select, IconButton } from "@/components/ds";
import type { SelectOption } from "@/components/ds";
import { networkingEventTypes } from "@/lib/data";
import type { Application, Contact, NetworkingEvent } from "@/lib/types";

interface NetworkingListViewProps {
  events: NetworkingEvent[];
  contacts: Contact[];
  apps: Application[];
  onDelete: (id: string) => void;
  onSelectContact: (contact: Contact) => void;
  onSelectApp: (app: Application) => void;
}

const typeOptions: SelectOption[] = [{ value: "", label: "All types" }, ...networkingEventTypes.map((t) => ({ value: t, label: t }))];

export function NetworkingListView({ events, contacts, apps, onDelete, onSelectContact, onSelectApp }: NetworkingListViewProps) {
  const [q, setQ] = useState("");
  const [type, setType] = useState("");

  const rows = events
    .map((e) => ({
      ...e,
      contactNames: e.contactIds.map((id) => contacts.find((c) => c.id === id)?.name ?? "Unknown contact"),
      app: e.applicationId ? apps.find((a) => a.id === e.applicationId) : undefined,
    }))
    .filter(
      (e) =>
        (!type || e.type === type) &&
        (e.contactNames.some((n) => n.toLowerCase().includes(q.toLowerCase())) ||
          (e.app ? e.app.company.toLowerCase().includes(q.toLowerCase()) : false))
    );
  rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div style={{ padding: "0 32px 32px", overflow: "auto", flex: 1 }}>
      <div style={{ display: "flex", gap: 12, padding: "16px 0" }}>
        <div style={{ width: 260 }}>
          <Input placeholder="Search contact or company…" value={q} onChange={setQ} />
        </div>
        <div style={{ width: 200 }}>
          <Select value={type} options={typeOptions} onChange={setType} placeholder="All types" />
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 150px 130px 1fr 1.4fr 40px",
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
        <span>Contacts</span>
        <span>Type</span>
        <span>Date</span>
        <span>Application</span>
        <span>Notes</span>
        <span />
      </div>
      {rows.map((e) => (
        <div
          key={e.id}
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 150px 130px 1fr 1.4fr 40px",
            columnGap: 16,
            padding: "14px 4px",
            borderBottom: "1px solid var(--border-default)",
            alignItems: "start",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {e.contactIds.map((id, i) => {
              const c = contacts.find((contact) => contact.id === id);
              return (
                <span
                  key={id}
                  onClick={() => c && onSelectContact(c)}
                  style={{
                    font: "700 13px var(--font-body)",
                    color: c ? "var(--text-link)" : "var(--text-tertiary)",
                    cursor: c ? "pointer" : "default",
                  }}
                >
                  {e.contactNames[i]}
                </span>
              );
            })}
          </div>
          <span style={{ font: "var(--text-body-s)", color: "var(--text-secondary)" }}>{e.type}</span>
          <span style={{ font: "var(--text-body-s)", color: "var(--text-secondary)" }}>{e.date}</span>
          <span
            onClick={() => e.app && onSelectApp(e.app)}
            style={{
              font: "var(--text-body-s)",
              color: e.app ? "var(--text-link)" : "var(--text-tertiary)",
              cursor: e.app ? "pointer" : "default",
            }}
          >
            {e.app ? `${e.app.company} — ${e.app.role}` : "—"}
          </span>
          <span style={{ font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>{e.notes || "—"}</span>
          <IconButton aria-label="Delete networking event" icon={<span>✕</span>} onClick={() => onDelete(e.id)} />
        </div>
      ))}
      {rows.length === 0 && (
        <div style={{ padding: "24px 4px", font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>
          No networking events match.
        </div>
      )}
    </div>
  );
}
