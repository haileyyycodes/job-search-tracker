"use client";

import { useState } from "react";
import { Select } from "@/components/ds";
import type { SelectOption } from "@/components/ds";
import type { Application, Interview } from "@/lib/types";

const typeOptions: SelectOption[] = [
  { value: "", label: "All types" },
  { value: "Screening Call", label: "Screening Call" },
  { value: "Technical Interview", label: "Technical" },
  { value: "Onsite/Panel", label: "Onsite/Panel" },
  { value: "Behavioral", label: "Behavioral" },
  { value: "Other", label: "Other" },
];

interface InterviewRow extends Interview {
  app: Application;
  key: string;
}

interface InterviewsListViewProps {
  apps: Application[];
}

export function InterviewsListView({ apps }: InterviewsListViewProps) {
  const [type, setType] = useState("");

  const rows: InterviewRow[] = [];
  apps.forEach((a) => a.interviews.forEach((iv, idx) => rows.push({ ...iv, app: a, key: `${a.id}-${idx}` })));
  rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const filtered = type ? rows.filter((r) => r.type === type) : rows;

  return (
    <div style={{ padding: "0 32px 32px", overflow: "auto", flex: 1 }}>
      <div style={{ padding: "16px 0", width: 220 }}>
        <Select value={type} options={typeOptions} onChange={setType} placeholder="All types" />
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 170px 130px 1fr",
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
        <span>Type</span>
        <span>Date</span>
        <span>Notes</span>
      </div>
      {filtered.map((r) => (
        <div
          key={r.key}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 170px 130px 1fr",
            padding: "14px 4px",
            borderBottom: "1px solid var(--border-default)",
            alignItems: "start",
          }}
        >
          <div>
            <div style={{ font: "700 13px var(--font-body)", color: "var(--text-primary)" }}>{r.app.role}</div>
            <div style={{ font: "var(--text-caption)", color: "var(--text-tertiary)" }}>{r.app.company}</div>
          </div>
          <span style={{ font: "var(--text-body-s)", color: "var(--text-secondary)" }}>{r.type}</span>
          <span style={{ font: "var(--text-body-s)", color: "var(--text-secondary)" }}>{r.date}</span>
          <span style={{ font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>{r.notes || "—"}</span>
        </div>
      ))}
      {filtered.length === 0 && (
        <div style={{ padding: "24px 4px", font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>
          No interviews logged yet.
        </div>
      )}
    </div>
  );
}
