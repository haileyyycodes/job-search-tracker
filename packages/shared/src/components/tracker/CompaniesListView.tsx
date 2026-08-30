"use client";

import { useState } from "react";
import { Input, Select, RowActionMenu, Pagination, Switch, ListRow } from "@/components/ds";
import type { SelectOption } from "@/components/ds";
import { ListCount } from "./ListCount";
import { TargetStar } from "./TargetStar";
import { companyStatusLabels, companyStatusColor, displayedCompanyStatus, formatCompanyLocations } from "@/lib/companies";
import type { Application, Company, CompanyStatus } from "@/lib/types";

const statusOptions: SelectOption[] = [
  { value: "", label: "All statuses" },
  ...(Object.keys(companyStatusLabels) as CompanyStatus[]).map((s) => ({ value: s, label: companyStatusLabels[s] })),
];

const gridTemplateColumns = "36px 28px 1fr 160px 200px 130px 110px";

const PAGE_SIZE = 10;

interface CompanyRowProps {
  company: Company;
  appCount: number;
  onSelect: (company: Company) => void;
  onToggleTarget: (companyId: number) => void;
  onRequestDelete: (company: Company) => void;
}

function CompanyRow({ company: c, appCount, onSelect, onToggleTarget, onRequestDelete }: CompanyRowProps) {
  const shownStatus = displayedCompanyStatus(c);
  return (
    <ListRow columns={gridTemplateColumns} onClick={() => onSelect(c)}>
      <RowActionMenu
        label="Company actions"
        actions={[{ label: "Delete company", tone: "danger", onSelect: () => onRequestDelete(c) }]}
      />
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
      {shownStatus ? (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            height: 24,
            padding: "0 10px",
            borderRadius: "var(--radius-pill)",
            background: "var(--ink-100)",
            color: companyStatusColor(shownStatus),
            font: "var(--text-caption)",
            fontWeight: 700,
            width: "fit-content",
          }}
        >
          <span
            style={{ width: 6, height: 6, borderRadius: "50%", background: companyStatusColor(shownStatus), flexShrink: 0 }}
          />
          {companyStatusLabels[shownStatus]}
        </span>
      ) : (
        <span style={{ font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>—</span>
      )}
      <span style={{ font: "var(--text-body-s)", color: "var(--text-secondary)" }}>{appCount}</span>
    </ListRow>
  );
}

interface CompaniesListViewProps {
  companies: Company[];
  apps: Application[];
  onSelect: (company: Company) => void;
  onToggleTarget: (companyId: number) => void;
  onRequestDelete: (company: Company) => void;
}

export function CompaniesListView({ companies, apps, onSelect, onToggleTarget, onRequestDelete }: CompaniesListViewProps) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<CompanyStatus | "">("");
  const [targetsOnly, setTargetsOnly] = useState(false);
  const [page, setPage] = useState(1);

  // Any filter change can shrink the result set, so jump back to the first page.
  const resetPage = () => setPage(1);

  const matchesSearch = (c: Company) =>
    c.name.toLowerCase().includes(q.toLowerCase()) || (c.industry ?? "").toLowerCase().includes(q.toLowerCase());

  const filtered = companies.filter(
    (c) =>
      matchesSearch(c) &&
      (!status || displayedCompanyStatus(c) === status) &&
      (!targetsOnly || c.isTarget)
  );

  const appCount = (c: Company) => apps.filter((a) => a.companyId === c.id).length;
  const rowProps = { onSelect, onToggleTarget, onRequestDelete };

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div style={{ padding: "0 32px 32px", overflow: "auto", flex: 1 }}>
      <div style={{ display: "flex", gap: 16, padding: "16px 0", alignItems: "center" }}>
        <div style={{ width: 260 }}>
          <Input
            placeholder="Search name or industry…"
            value={q}
            onChange={(v) => {
              setQ(v);
              resetPage();
            }}
          />
        </div>
        <div style={{ width: 200 }}>
          <Select
            value={status}
            options={statusOptions}
            onChange={(v) => {
              setStatus(v as CompanyStatus | "");
              resetPage();
            }}
            placeholder="All statuses"
          />
        </div>
        <Switch
          label="Targets only"
          checked={targetsOnly}
          onChange={(v) => {
            setTargetsOnly(v);
            resetPage();
          }}
        />
        <ListCount shown={filtered.length} total={companies.length} noun="company" nounPlural="companies" />
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
        <span />
        <span>Name</span>
        <span>Industry</span>
        <span>Locations</span>
        <span>Status</span>
        <span>Applications</span>
      </div>

      {visible.map((c) => (
        <CompanyRow key={c.id} company={c} appCount={appCount(c)} {...rowProps} />
      ))}
      {filtered.length === 0 && (
        <div style={{ padding: "24px 4px", font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>
          No companies match.
        </div>
      )}

      <Pagination page={currentPage} pageCount={pageCount} onPageChange={setPage} />
    </div>
  );
}
