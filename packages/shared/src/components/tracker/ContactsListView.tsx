"use client";

import { useState } from "react";
import { Input, Select, IconButton, Pagination } from "@/components/ds";
import type { SelectOption } from "@/components/ds";
import { companyName } from "@/lib/companies";
import { compareByOutreachUrgency, outreachInfo, outreachTiming, type OutreachStatus } from "@/lib/outreach";
import { ListCount } from "./ListCount";
import { OutreachTag } from "./OutreachTag";
import { TargetStar } from "./TargetStar";
import type { Company, Contact, NetworkingEvent } from "@/lib/types";

const companyFilterOptions: SelectOption[] = [
  { value: "", label: "All companies" },
  { value: "target", label: "★ Target companies" },
  { value: "other", label: "Other companies" },
];

const outreachFilterOptions: SelectOption[] = [
  { value: "", label: "Any outreach status" },
  { value: "needs", label: "Needs outreach" },
  { value: "overdue", label: "Overdue" },
  { value: "due", label: "Due" },
  { value: "on_track", label: "On track" },
  { value: "untracked", label: "No tier" },
];

interface ContactsListViewProps {
  contacts: Contact[];
  companies: Company[];
  networkingEvents: NetworkingEvent[];
  onSelect: (contact: Contact) => void;
  onSelectCompany: (company: Company) => void;
  onRequestDelete: (contact: Contact) => void;
}

const PAGE_SIZE = 10;

const GRID = "1.1fr 1fr 0.9fr 132px 40px";

export function ContactsListView({
  contacts,
  companies,
  networkingEvents,
  onSelect,
  onSelectCompany,
  onRequestDelete,
}: ContactsListViewProps) {
  const [q, setQ] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [outreachFilter, setOutreachFilter] = useState("");
  const [page, setPage] = useState(1);

  const isAtTarget = (c: Contact) => companies.find((co) => co.id === c.companyId)?.isTarget === true;

  // Contacts with no employer only appear when the company filter is off.
  const matchesCompanyFilter = (c: Contact) =>
    !companyFilter || (companyFilter === "target" ? isAtTarget(c) : c.companyId != null && !isAtTarget(c));

  const infoById = new Map(contacts.map((c) => [c.id, outreachInfo(c, networkingEvents)]));

  const matchesOutreachFilter = (c: Contact) => {
    if (!outreachFilter) return true;
    const status = infoById.get(c.id)!.status;
    if (outreachFilter === "needs") return status === "due" || status === "overdue";
    return status === (outreachFilter as OutreachStatus);
  };

  const filtered = contacts
    .filter(
      (c) =>
        matchesCompanyFilter(c) &&
        matchesOutreachFilter(c) &&
        (c.name.toLowerCase().includes(q.toLowerCase()) ||
          (c.companyId ? companyName(c.companyId, companies).toLowerCase().includes(q.toLowerCase()) : false))
    )
    // Most urgent to reach out first; ties fall back to name.
    .sort(
      (a, b) =>
        compareByOutreachUrgency(infoById.get(a.id)!, infoById.get(b.id)!) || a.name.localeCompare(b.name)
    );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Any filter change can shrink the result set, so jump back to the first page.
  const resetPage = () => setPage(1);

  return (
    <div style={{ padding: "0 32px 32px", overflow: "auto", flex: 1 }}>
      <div style={{ display: "flex", gap: 12, padding: "16px 0", flexWrap: "wrap" }}>
        <div style={{ width: 260 }}>
          <Input
            placeholder="Search name or employer…"
            value={q}
            onChange={(v) => {
              setQ(v);
              resetPage();
            }}
          />
        </div>
        <div style={{ width: 190 }}>
          <Select
            value={companyFilter}
            options={companyFilterOptions}
            onChange={(v) => {
              setCompanyFilter(v);
              resetPage();
            }}
            placeholder="All companies"
          />
        </div>
        <div style={{ width: 190 }}>
          <Select
            value={outreachFilter}
            options={outreachFilterOptions}
            onChange={(v) => {
              setOutreachFilter(v);
              resetPage();
            }}
            placeholder="Any outreach status"
          />
        </div>
        <ListCount shown={filtered.length} total={contacts.length} noun="contact" />
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
        <span>Name</span>
        <span>Employer / role</span>
        <span>Contact info</span>
        <span>Outreach</span>
        <span />
      </div>
      {visible.map((c) => {
        const info = infoById.get(c.id)!;
        return (
          <div
            key={c.id}
            onClick={() => onSelect(c)}
            style={{
              display: "grid",
              gridTemplateColumns: GRID,
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
              {c.companyId ? (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    const company = companies.find((co) => co.id === c.companyId);
                    if (company) onSelectCompany(company);
                  }}
                  style={{
                    font: "var(--text-body-s)",
                    color: "var(--text-link)",
                    cursor: "pointer",
                    width: "fit-content",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  {companyName(c.companyId, companies)}
                  {companies.find((co) => co.id === c.companyId)?.isTarget && <TargetStar isTarget size={12} />}
                </div>
              ) : (
                <div style={{ font: "var(--text-body-s)", color: "var(--text-primary)" }}>—</div>
              )}
              {c.role && <div style={{ font: "var(--text-caption)", color: "var(--text-tertiary)" }}>{c.role}</div>}
            </div>
            <span style={{ font: "var(--text-body-s)", color: "var(--text-secondary)" }}>
              {[c.email, c.phone].filter(Boolean).join(" · ") || "—"}
            </span>
            {info.status === "untracked" ? (
              <span style={{ font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>—</span>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "flex-start" }}>
                <OutreachTag info={info} />
                <span style={{ font: "var(--text-caption)", color: "var(--text-tertiary)" }}>{outreachTiming(info)}</span>
              </div>
            )}
            <IconButton
              aria-label="Delete contact"
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
          No contacts match.
        </div>
      )}
      <Pagination page={currentPage} pageCount={pageCount} onPageChange={setPage} />
    </div>
  );
}
