"use client";

import { useState } from "react";
import { Input, Select, StatusTag, IconButton } from "@/components/ds";
import type { SelectOption } from "@/components/ds";
import type { Application, ApplicationStatus } from "@/lib/types";

const statusOptions: SelectOption[] = [
  { value: "", label: "All statuses" },
  { value: "todo", label: "To do" },
  { value: "applied", label: "Applied" },
  { value: "interviewing", label: "Interviewing" },
  { value: "offer_extended", label: "Offer extended" },
  { value: "offer_accepted", label: "Offer accepted" },
  { value: "offer_declined", label: "Offer declined" },
  { value: "rejected_no_interview", label: "Rejected (no interview)" },
  { value: "rejected_after_interview", label: "Rejected (after interview)" },
  { value: "withdrawn", label: "Withdrawn" },
];

const referralOptions: SelectOption[] = [
  { value: "", label: "All referrals" },
  { value: "yes", label: "Referred" },
  { value: "no", label: "Not referred" },
];

interface ApplicationsListViewProps {
  apps: Application[];
  onSelect: (app: Application) => void;
  onRequestDelete: (app: Application) => void;
}

export function ApplicationsListView({ apps, onSelect, onRequestDelete }: ApplicationsListViewProps) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<ApplicationStatus | "">("");
  const [referral, setReferral] = useState("");

  const filtered = apps.filter(
    (a) =>
      (!status || a.status === status) &&
      (!referral || (referral === "yes" ? a.referral : !a.referral)) &&
      (a.company.toLowerCase().includes(q.toLowerCase()) || a.role.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div style={{ padding: "0 32px 32px", overflow: "auto", flex: 1 }}>
      <div style={{ display: "flex", gap: 12, padding: "16px 0" }}>
        <div style={{ width: 260 }}>
          <Input placeholder="Search company or role…" value={q} onChange={setQ} />
        </div>
        <div style={{ width: 220 }}>
          <Select
            value={status}
            options={statusOptions}
            onChange={(v) => setStatus(v as ApplicationStatus | "")}
            placeholder="All statuses"
          />
        </div>
        <div style={{ width: 180 }}>
          <Select value={referral} options={referralOptions} onChange={setReferral} placeholder="All referrals" />
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 170px 110px 90px 40px",
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
        <span>Role</span>
        <span>Status</span>
        <span>Applied</span>
        <span>Referral</span>
        <span />
      </div>
      {filtered.map((a) => (
        <div
          key={a.id}
          onClick={() => onSelect(a)}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 170px 110px 90px 40px",
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
              {a.logo}
            </div>
            <div>
              <div style={{ font: "700 14px var(--font-body)", color: "var(--text-primary)" }}>{a.role}</div>
              <div style={{ font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>{a.company}</div>
            </div>
          </div>
          <StatusTag status={a.status} />
          <span style={{ font: "var(--text-body-s)", color: "var(--text-secondary)" }}>{a.dateApplied || "—"}</span>
          <span style={{ font: "var(--text-body-s)", color: a.referral ? "var(--green-600)" : "var(--text-tertiary)" }}>
            {a.referral ? "Yes" : "No"}
          </span>
          <IconButton
            aria-label="Delete application"
            icon={<span>✕</span>}
            onClick={(e) => {
              e.stopPropagation();
              onRequestDelete(a);
            }}
          />
        </div>
      ))}
      {filtered.length === 0 && (
        <div style={{ padding: "24px 4px", font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>
          No applications match.
        </div>
      )}
    </div>
  );
}
