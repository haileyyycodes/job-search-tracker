"use client";

import { useState } from "react";
import { Input, Select, IconButton } from "@/components/ds";
import type { SelectOption } from "@/components/ds";
import { TargetStar } from "./TargetStar";
import { companyStatusLabels, companyStatusColor, formatCompanyLocations } from "@/lib/companies";
import type { Application, Company, CompanyStatus } from "@/lib/types";

const statusOptions: SelectOption[] = [
  { value: "", label: "All statuses" },
  ...(Object.keys(companyStatusLabels) as CompanyStatus[]).map((s) => ({ value: s, label: companyStatusLabels[s] })),
];

const gridTemplateColumns = "28px 1fr 160px 200px 130px 110px 40px";

const sectionHeaderStyle = {
  padding: "18px 4px 8px",
  font: "var(--text-label)",
  color: "var(--text-tertiary)",
  textTransform: "uppercase",
  letterSpacing: "var(--tracking-wide)",
  fontSize: 11,
} as const;

interface CompanyRowProps {
  company: Company;
  appCount: number;
  onSelect: (company: Company) => void;
  onToggleTarget: (companyId: string) => void;
  onRequestDelete: (company: Company) => void;
}

function CompanyRow({ company: c, appCount, onSelect, onToggleTarget, onRequestDelete }: CompanyRowProps) {
  return (
    <div
      onClick={() => onSelect(c)}
      style={{
        display: "grid",
        gridTemplateColumns,
        columnGap: 16,
        alignItems: "center",
        padding: "14px 4px",
        borderBottom: "1px solid var(--border-default)",
        cursor: "pointer",
      }}
    >
      <TargetStar isTarget={c.isTarget} onToggle={() => onToggleTarget(c.id)} />
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
}

interface CompaniesListViewProps {
  companies: Company[];
  apps: Application[];
  onSelect: (company: Company) => void;
  onToggleTarget: (companyId: string) => void;
  onRequestDelete: (company: Company) => void;
}

export function CompaniesListView({ companies, apps, onSelect, onToggleTarget, onRequestDelete }: CompaniesListViewProps) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<CompanyStatus | "">("");

  const matchesSearch = (c: Company) =>
    c.name.toLowerCase().includes(q.toLowerCase()) || (c.industry ?? "").toLowerCase().includes(q.toLowerCase());

  const targets = companies.filter((c) => c.isTarget && matchesSearch(c) && (!status || c.status === status));
  // Status is a targets-only concept, so a status filter can never match a non-target.
  const others = status ? [] : companies.filter((c) => !c.isTarget && matchesSearch(c));

  const appCount = (c: Company) => apps.filter((a) => a.companyId === c.id).length;
  const rowProps = { onSelect, onToggleTarget, onRequestDelete };

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
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns,
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
        <span>Name</span>
        <span>Industry</span>
        <span>Locations</span>
        <span>Status</span>
        <span>Applications</span>
        <span />
      </div>

      <div style={sectionHeaderStyle}>
        <TargetStar isTarget size={12} /> Targets ({targets.length})
      </div>
      {targets.map((c) => (
        <CompanyRow key={c.id} company={c} appCount={appCount(c)} {...rowProps} />
      ))}
      {targets.length === 0 && (
        <div style={{ padding: "16px 4px", font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>
          {q || status
            ? "No target companies match."
            : "No target companies yet — star a company below to build your target list."}
        </div>
      )}

      {!status && (
        <>
          <div style={sectionHeaderStyle}>Other companies ({others.length})</div>
          {others.map((c) => (
            <CompanyRow key={c.id} company={c} appCount={appCount(c)} {...rowProps} />
          ))}
          {others.length === 0 && (
            <div style={{ padding: "16px 4px", font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>
              {q ? "No other companies match." : "Nothing here — every company is on your target list."}
            </div>
          )}
        </>
      )}
    </div>
  );
}
