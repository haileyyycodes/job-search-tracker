"use client";

import { useState } from "react";
import { Input, Select } from "@/components/ds";
import type { SelectOption } from "@/components/ds";
import { interviewTypeOptions } from "@/lib/data";
import { isWithinDateRange } from "@/lib/date";
import { companyName } from "@/lib/companies";
import { ListCount } from "./ListCount";
import type { Application, Company, Interview } from "@/lib/types";

const typeOptions: SelectOption[] = [{ value: "", label: "All types" }, ...interviewTypeOptions];

interface InterviewRow extends Interview {
  app: Application;
  key: string;
}

interface InterviewsListViewProps {
  apps: Application[];
  companies: Company[];
  onSelectApp: (app: Application) => void;
}

export function InterviewsListView({ apps, companies, onSelectApp }: InterviewsListViewProps) {
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const rows: InterviewRow[] = [];
  apps.forEach((a) => a.interviews.forEach((iv, idx) => rows.push({ ...iv, app: a, key: `${a.id}-${idx}` })));
  rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const filtered = rows.filter(
    (r) =>
      (!type || r.type === type) &&
      (companyName(r.app.companyId, companies).toLowerCase().includes(q.toLowerCase()) ||
        r.app.role.toLowerCase().includes(q.toLowerCase())) &&
      isWithinDateRange(r.date, from, to)
  );

  return (
    <div style={{ padding: "0 32px 32px", overflow: "auto", flex: 1 }}>
      <div style={{ display: "flex", gap: 12, padding: "16px 0", alignItems: "flex-end" }}>
        <div style={{ width: 260 }}>
          <Input placeholder="Search company or role…" value={q} onChange={setQ} />
        </div>
        <div style={{ width: 200 }}>
          <Select value={type} options={typeOptions} onChange={setType} placeholder="All types" />
        </div>
        <div style={{ width: 160 }}>
          <Input label="From" type="date" value={from} onChange={setFrom} />
        </div>
        <div style={{ width: 160 }}>
          <Input label="To" type="date" value={to} onChange={setTo} />
        </div>
        <ListCount shown={filtered.length} total={rows.length} noun="interview" />
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 190px 130px 1fr 1fr",
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
        <span>Type</span>
        <span>Date</span>
        <span>Categories</span>
        <span>Notes</span>
      </div>
      {filtered.map((r) => (
        <div
          key={r.key}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 190px 130px 1fr 1fr",
            columnGap: 16,
            padding: "14px 4px",
            borderBottom: "1px solid var(--border-default)",
            alignItems: "start",
          }}
        >
          <div onClick={() => onSelectApp(r.app)} style={{ cursor: "pointer" }}>
            <div style={{ font: "700 13px var(--font-body)", color: "var(--text-link)" }}>{r.app.role}</div>
            <div style={{ font: "var(--text-caption)", color: "var(--text-tertiary)" }}>{companyName(r.app.companyId, companies)}</div>
          </div>
          <span style={{ font: "var(--text-body-s)", color: "var(--text-secondary)" }}>
            {r.type}
            {r.style && <span style={{ color: "var(--text-tertiary)" }}> · {r.style}</span>}
          </span>
          <span style={{ font: "var(--text-body-s)", color: "var(--text-secondary)" }}>{r.date}</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {(r.categories ?? []).map((c) => (
              <span
                key={c}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  height: 20,
                  padding: "0 7px",
                  borderRadius: "var(--radius-pill)",
                  background: "var(--blue-100)",
                  color: "var(--blue-700)",
                  font: "var(--text-caption)",
                  fontWeight: 700,
                }}
              >
                {c}
              </span>
            ))}
            {(!r.categories || r.categories.length === 0) && (
              <span style={{ font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>—</span>
            )}
          </div>
          <span style={{ font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>{r.notes || "—"}</span>
        </div>
      ))}
      {filtered.length === 0 && (
        <div style={{ padding: "24px 4px", font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>
          No interviews match.
        </div>
      )}
    </div>
  );
}
