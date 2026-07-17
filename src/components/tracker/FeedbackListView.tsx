"use client";

import { useState } from "react";
import { Input } from "@/components/ds";
import { companyName } from "@/lib/companies";
import type { Application, Company, Feedback } from "@/lib/types";

interface FeedbackRow extends Feedback {
  app: Application;
}

interface FeedbackListViewProps {
  apps: Application[];
  companies: Company[];
  onSelectApp: (app: Application) => void;
}

export function FeedbackListView({ apps, companies, onSelectApp }: FeedbackListViewProps) {
  const [q, setQ] = useState("");

  const rows: FeedbackRow[] = apps
    .filter((a): a is Application & { feedback: Feedback } => a.feedback != null)
    .map((a) => ({ ...a.feedback, app: a }));
  rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filtered = rows.filter(
    (r) =>
      companyName(r.app.companyId, companies).toLowerCase().includes(q.toLowerCase()) ||
      r.app.role.toLowerCase().includes(q.toLowerCase()) ||
      r.text.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div style={{ padding: "0 32px 32px", overflow: "auto", flex: 1 }}>
      <div style={{ display: "flex", gap: 12, padding: "16px 0" }}>
        <div style={{ width: 260 }}>
          <Input placeholder="Search company, role, or feedback…" value={q} onChange={setQ} />
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 2fr 130px",
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
        <span>Feedback</span>
        <span>Date</span>
      </div>
      {filtered.map((r) => (
        <div
          key={r.app.id}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 2fr 130px",
            columnGap: 16,
            padding: "14px 4px",
            borderBottom: "1px solid var(--border-default)",
            alignItems: "start",
          }}
        >
          <div onClick={() => onSelectApp(r.app)} style={{ cursor: "pointer" }}>
            <div style={{ font: "700 13px var(--font-body)", color: "var(--text-link)" }}>{r.app.role}</div>
            <div style={{ font: "var(--text-caption)", color: "var(--text-tertiary)" }}>
              {companyName(r.app.companyId, companies)}
            </div>
          </div>
          <span style={{ font: "var(--text-body-s)", color: "var(--text-secondary)" }}>{r.text}</span>
          <span style={{ font: "var(--text-body-s)", color: "var(--text-secondary)" }}>{r.date}</span>
        </div>
      ))}
      {filtered.length === 0 && (
        <div style={{ padding: "24px 4px", font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>
          No feedback yet.
        </div>
      )}
    </div>
  );
}
