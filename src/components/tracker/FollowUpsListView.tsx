"use client";

import { useState } from "react";
import { Input } from "@/components/ds";
import { isWithinDateRange } from "@/lib/date";
import type { Application, FollowUp } from "@/lib/types";

interface FollowUpRow extends FollowUp {
  app: Application;
  key: string;
}

interface FollowUpsListViewProps {
  apps: Application[];
}

export function FollowUpsListView({ apps }: FollowUpsListViewProps) {
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const rows: FollowUpRow[] = [];
  apps.forEach((a) => a.followUps.forEach((f, idx) => rows.push({ ...f, app: a, key: `${a.id}-${idx}` })));
  rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const filtered = rows.filter(
    (r) =>
      (r.contact.toLowerCase().includes(q.toLowerCase()) || r.app.company.toLowerCase().includes(q.toLowerCase())) &&
      isWithinDateRange(r.date, from, to)
  );

  return (
    <div style={{ padding: "0 32px 32px", overflow: "auto", flex: 1 }}>
      <div style={{ display: "flex", gap: 12, padding: "16px 0", alignItems: "flex-end" }}>
        <div style={{ width: 260 }}>
          <Input placeholder="Search contact or company…" value={q} onChange={setQ} />
        </div>
        <div style={{ width: 160 }}>
          <Input label="From" type="date" value={from} onChange={setFrom} />
        </div>
        <div style={{ width: 160 }}>
          <Input label="To" type="date" value={to} onChange={setTo} />
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 150px 130px 1fr 1fr",
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
        <span>Application</span>
        <span>Contact</span>
        <span>Date</span>
        <span>Contact info</span>
        <span>Notes</span>
      </div>
      {filtered.map((r) => (
        <div
          key={r.key}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 150px 130px 1fr 1fr",
            columnGap: 16,
            padding: "14px 4px",
            borderBottom: "1px solid var(--border-default)",
            alignItems: "start",
          }}
        >
          <div>
            <div style={{ font: "700 13px var(--font-body)", color: "var(--text-primary)" }}>{r.app.role}</div>
            <div style={{ font: "var(--text-caption)", color: "var(--text-tertiary)" }}>{r.app.company}</div>
          </div>
          <span style={{ font: "var(--text-body-s)", color: "var(--text-secondary)" }}>{r.contact}</span>
          <span style={{ font: "var(--text-body-s)", color: "var(--text-secondary)" }}>{r.date}</span>
          <span style={{ font: "var(--text-mono-s)", color: "var(--text-secondary)" }}>{r.info}</span>
          <span style={{ font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>{r.notes || "—"}</span>
        </div>
      ))}
      {filtered.length === 0 && (
        <div style={{ padding: "24px 4px", font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>
          No follow-ups match.
        </div>
      )}
    </div>
  );
}
