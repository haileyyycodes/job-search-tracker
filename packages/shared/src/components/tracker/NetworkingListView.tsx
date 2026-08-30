"use client";

import { useState } from "react";
import { Input, Select, RowActionMenu, Pagination, TextLink } from "@/components/ds";
import type { SelectOption } from "@/components/ds";
import { networkingEventTypes } from "@/lib/data";
import { companyName } from "@/lib/companies";
import { ListCount } from "./ListCount";
import type { Application, Company, Contact, NetworkingEvent } from "@/lib/types";

interface NetworkingListViewProps {
  events: NetworkingEvent[];
  contacts: Contact[];
  apps: Application[];
  companies: Company[];
  onEdit: (event: NetworkingEvent) => void;
  onDelete: (id: number) => void;
  onSelectContact: (contact: Contact) => void;
  onSelectApp: (app: Application) => void;
}

const typeOptions: SelectOption[] = [{ value: "", label: "All types" }, ...networkingEventTypes.map((t) => ({ value: t, label: t }))];

const GRID = "36px 1.2fr 150px 130px 1fr 1.4fr";

const PAGE_SIZE = 10;

export function NetworkingListView({
  events,
  contacts,
  apps,
  companies,
  onEdit,
  onDelete,
  onSelectContact,
  onSelectApp,
}: NetworkingListViewProps) {
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);

  // Any filter change can shrink the result set, so jump back to the first page.
  const resetPage = () => setPage(1);

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
          (e.app ? companyName(e.app.companyId, companies).toLowerCase().includes(q.toLowerCase()) : false))
    );
  rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div style={{ padding: "0 32px 32px", overflow: "auto", flex: 1 }}>
      <div style={{ display: "flex", gap: 12, padding: "16px 0" }}>
        <div style={{ width: 260 }}>
          <Input
            placeholder="Search contact or company…"
            value={q}
            onChange={(v) => {
              setQ(v);
              resetPage();
            }}
          />
        </div>
        <div style={{ width: 200 }}>
          <Select
            value={type}
            options={typeOptions}
            onChange={(v) => {
              setType(v);
              resetPage();
            }}
            placeholder="All types"
          />
        </div>
        <ListCount shown={rows.length} total={events.length} noun="event" />
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: GRID,
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
        <span />
        <span>Contacts</span>
        <span>Type</span>
        <span>Date</span>
        <span>Application</span>
        <span>Notes</span>
      </div>
      {visibleRows.map((e) => (
        <div
          key={e.id}
          style={{
            display: "grid",
            gridTemplateColumns: GRID,
            columnGap: 16,
            padding: "14px 4px",
            borderBottom: "1px solid var(--border-default)",
            alignItems: "start",
          }}
        >
          <RowActionMenu
            label="Networking event actions"
            actions={[
              {
                label: "Edit event",
                onSelect: () =>
                  onEdit({
                    id: e.id,
                    contactIds: e.contactIds,
                    type: e.type,
                    date: e.date,
                    applicationId: e.applicationId,
                    notes: e.notes,
                  }),
              },
              { label: "Delete event", tone: "danger", onSelect: () => onDelete(e.id) },
            ]}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {e.contactIds.map((id, i) => {
              const c = contacts.find((contact) => contact.id === id);
              return (
                <TextLink
                  key={id}
                  disabled={!c}
                  onClick={() => c && onSelectContact(c)}
                  style={{ font: "700 13px var(--font-body)" }}
                >
                  {e.contactNames[i]}
                </TextLink>
              );
            })}
          </div>
          <span style={{ font: "var(--text-body-s)", color: "var(--text-secondary)" }}>{e.type}</span>
          <span style={{ font: "var(--text-body-s)", color: "var(--text-secondary)" }}>{e.date}</span>
          <TextLink
            disabled={!e.app}
            onClick={() => e.app && onSelectApp(e.app)}
            style={{ font: "var(--text-body-s)" }}
          >
            {e.app ? `${companyName(e.app.companyId, companies)} — ${e.app.role}` : "—"}
          </TextLink>
          <span style={{ font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>{e.notes || "—"}</span>
        </div>
      ))}
      {rows.length === 0 && (
        <div style={{ padding: "24px 4px", font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>
          No networking events match.
        </div>
      )}
      <Pagination page={currentPage} pageCount={pageCount} onPageChange={setPage} />
    </div>
  );
}
