"use client";

import { useState } from "react";
import { Input, Select, IconButton } from "@/components/ds";
import type { SelectOption } from "@/components/ds";
import { companyStatusLabels, companyStatusColor, formatCompanyLocations } from "@/lib/companies";
import type { Application, Company, CompanyStatus } from "@/lib/types";

const statusOptions: SelectOption[] = [
  { value: "", label: "All statuses" },
  ...(Object.keys(companyStatusLabels) as CompanyStatus[]).map((s) => ({ value: s, label: companyStatusLabels[s] })),
];

interface CompaniesListViewProps {
  companies: Company[];
  apps: Application[];
  onSelect: (company: Company) => void;
  onRequestDelete: (company: Company) => void;
}

export function CompaniesListView({ companies, apps, onSelect, onRequestDelete }: CompaniesListViewProps) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<CompanyStatus | "">("");
  const [showAll, setShowAll] = useState(false);

  const visible = companies.filter((c) => showAll || c.isTarget);
  const filtered = visible.filter(
    (c) =>
      (!status || c.status === status) &&
      (c.name.toLowerCase().includes(q.toLowerCase()) || (c.industry ?? "").toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div style={{ padding: "0 32px 32px", overflow: "auto", flex: 1 }}>
      <div style={{ display: "flex", gap: 16, padding: "16px 0", alignItems: "center" }}>
        <div style={{ width: 260 }}>
          <Input placeholder="Search name or industry…" value={q} onChange={setQ} />
        </div>
        <div style={{ width: 200 }}>
          <Select
            value={status}
            options={statusOptions}
            onChange={(v) => setStatus(v as CompanyStatus | "")}
            placeholder="All statuses"
          />
        </div>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            font: "var(--text-body-s)",
            color: "var(--text-secondary)",
            cursor: "pointer",
          }}
        >
          <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
          Show non-target companies
        </label>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 160px 200px 130px 110px 40px",
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
        <span>Industry</span>
        <span>Locations</span>
        <span>Status</span>
        <span>Applications</span>
        <span />
      </div>
      {filtered.map((c) => {
        const appCount = apps.filter((a) => a.companyId === c.id).length;
        return (
          <div
            key={c.id}
            onClick={() => onSelect(c)}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 160px 200px 130px 110px 40px",
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
                  borderRadius: "var(--radius-s)",
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
            <span style={{ font: "var(--text-body-s)", color: "var(--text-secondary)" }}>{c.industry || "—"}</span>
            <span style={{ font: "var(--text-body-s)", color: "var(--text-secondary)" }}>
              {formatCompanyLocations(c) || "—"}
            </span>
            {c.isTarget ? (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  height: 24,
                  padding: "0 10px",
                  borderRadius: "var(--radius-pill)",
                  background: "var(--ink-100)",
                  color: companyStatusColor(c.status),
                  font: "var(--text-caption)",
                  fontWeight: 700,
                  width: "fit-content",
                }}
              >
                <span
                  style={{ width: 6, height: 6, borderRadius: "50%", background: companyStatusColor(c.status), flexShrink: 0 }}
                />
                {companyStatusLabels[c.status]}
              </span>
            ) : (
              <span style={{ font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>—</span>
            )}
            <span style={{ font: "var(--text-body-s)", color: "var(--text-secondary)" }}>{appCount}</span>
            <IconButton
              aria-label="Delete company"
              icon={<span>✕</span>}
              onClick={(e) => {
                e.stopPropagation();
                onRequestDelete(c);
              }}
            />
          </div>
        );
      })}
      {filtered.length === 0 && (
        <div style={{ padding: "24px 4px", font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>
          No companies match.
        </div>
      )}
    </div>
  );
}
