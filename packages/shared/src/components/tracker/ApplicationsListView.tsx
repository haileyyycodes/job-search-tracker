"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Input, Select, StatusTag, IconButton, Card, Pagination } from "@/components/ds";
import type { SelectOption } from "@/components/ds";
import { formatSalaryRange, getSalaryMatch, salaryMatchColor } from "@/lib/salary";
import { formatLocation } from "@/lib/location";
import { companyName } from "@/lib/companies";
import { getDaysSinceActivity, getLastActivityDate } from "@/lib/funnel";
import { resumeTypeLabels } from "@/lib/data";
import { TargetStar } from "./TargetStar";
import type { Application, ApplicationStatus, Company, Goals } from "@/lib/types";

/** "Saved" in the UI is an application still in the `todo` stage — saved but not yet applied. */
const SAVED_STATUS: ApplicationStatus = "todo";
/** An applied application with no activity in this many days is worth a nudge. */
const STALE_DAYS = 14;
/** Past this, the stale marker escalates from amber to red. */
const VERY_STALE_DAYS = 45;

type ViewMode = "list" | "kanban";
type Tab = "all" | "needs_action";

const statusOptions: SelectOption[] = [
  { value: "", label: "All statuses" },
  { value: "todo", label: "Saved" },
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

const GRID_COLUMNS = "minmax(220px,1fr) 150px 100px 110px 150px 160px 90px 130px 40px";
const GRID_MIN_WIDTH = 1300;

const PAGE_SIZE = 10;

const kanbanColumnDefs: { key: string; label: string; match: (s: ApplicationStatus) => boolean }[] = [
  { key: "saved", label: "Saved", match: (s) => s === "todo" },
  { key: "applied", label: "Applied", match: (s) => s === "applied" },
  { key: "interviewing", label: "Interviewing", match: (s) => s === "interviewing" },
  { key: "offer", label: "Offer", match: (s) => s.startsWith("offer") },
  { key: "closed", label: "Rejected / withdrawn", match: (s) => s.includes("rejected") || s === "withdrawn" },
];

interface EnrichedApp {
  app: Application;
  company: string;
  isTarget: boolean;
  isSaved: boolean;
  dateAppliedLabel: string;
  lastActivityLabel: string;
  daysSinceActivity: number | null;
  isStale: boolean;
  staleColor: string;
  location: string;
  salaryLabel: string;
  salaryColor: string;
  referralLabel: string;
  referralColor: string;
  resumeLabel: string;
}

const eyebrowStyle = {
  font: "var(--text-label)",
  color: "var(--text-tertiary)",
  textTransform: "uppercase",
  letterSpacing: "var(--tracking-wide)",
  fontSize: 11,
} as const;

const sectionHeadingStyle = {
  font: "var(--text-heading-s)",
  color: "var(--text-primary)",
  margin: "0 0 4px",
} as const;

const sectionSubStyle = {
  font: "var(--text-body-s)",
  color: "var(--text-tertiary)",
  margin: "0 0 12px",
} as const;

const cardGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
  gap: 16,
} as const;

interface ApplicationsListViewProps {
  apps: Application[];
  companies: Company[];
  goals: Goals;
  onSelect: (app: Application) => void;
  onSelectCompany: (company: Company) => void;
  onRequestDelete: (app: Application) => void;
}

export function ApplicationsListView({
  apps,
  companies,
  goals,
  onSelect,
  onSelectCompany,
  onRequestDelete,
}: ApplicationsListViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<ApplicationStatus | "">("");
  const [referral, setReferral] = useState("");
  const [page, setPage] = useState(1);

  // Any filter change can shrink the result set, so jump back to the first page.
  const resetPage = () => setPage(1);

  const enriched = useMemo<EnrichedApp[]>(
    () =>
      apps.map((app) => {
        const daysSinceActivity = getDaysSinceActivity(app);
        const lastActivity = getLastActivityDate(app);
        const isSaved = app.status === SAVED_STATUS;
        const isStale =
          app.status === "applied" && daysSinceActivity !== null && daysSinceActivity > STALE_DAYS;
        return {
          app,
          company: companyName(app.companyId, companies),
          isTarget: companies.find((c) => c.id === app.companyId)?.isTarget ?? false,
          isSaved,
          dateAppliedLabel: app.dateApplied || "—",
          lastActivityLabel: lastActivity ? (isSaved ? `on ${lastActivity}` : lastActivity) : "—",
          daysSinceActivity,
          isStale,
          staleColor: isStale
            ? daysSinceActivity! > VERY_STALE_DAYS
              ? "var(--red-600)"
              : "var(--yellow-600)"
            : "var(--text-secondary)",
          location: formatLocation(app) || "—",
          salaryLabel: formatSalaryRange(app.salaryMin, app.salaryMax) || "—",
          salaryColor: salaryMatchColor(getSalaryMatch(app, goals)),
          referralLabel: app.referral ? "Yes" : "No",
          referralColor: app.referral ? "var(--green-600)" : "var(--text-tertiary)",
          resumeLabel: resumeTypeLabels[app.resumeType],
        };
      }),
    [apps, companies, goals]
  );

  const savedApps = enriched.filter((e) => e.isSaved);
  const offerApps = enriched.filter((e) => e.app.status === "offer_extended");
  const staleApps = enriched
    .filter((e) => e.isStale)
    .sort((a, b) => (b.daysSinceActivity ?? 0) - (a.daysSinceActivity ?? 0));
  const needsActionCount = savedApps.length + offerApps.length + staleApps.length;

  const qLower = q.toLowerCase();
  const filtered = enriched.filter(
    (e) =>
      (!status || e.app.status === status) &&
      (!referral || (referral === "yes" ? e.app.referral : !e.app.referral)) &&
      (e.company.toLowerCase().includes(qLower) || e.app.role.toLowerCase().includes(qLower))
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleApps = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const kanbanColumns = kanbanColumnDefs.map((col) => {
    const columnApps = enriched.filter((e) => col.match(e.app.status));
    return { ...col, apps: columnApps, count: columnApps.length };
  });

  const openCompany = (companyId: number) => {
    const company = companies.find((c) => c.id === companyId);
    if (company) onSelectCompany(company);
  };

  return (
    <div style={{ padding: "0 32px 32px", overflow: "auto", flex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0 4px" }}>
        {viewMode === "list" ? (
          <div style={{ display: "flex", gap: 24 }}>
            <TabButton active={tab === "all"} onClick={() => setTab("all")}>
              All
            </TabButton>
            <TabButton active={tab === "needs_action"} onClick={() => setTab("needs_action")}>
              Needs action · {needsActionCount}
            </TabButton>
          </div>
        ) : (
          <div />
        )}
        <div
          style={{
            display: "flex",
            gap: 2,
            background: "var(--bg-surface-sunken)",
            borderRadius: "var(--radius-s)",
            padding: 2,
          }}
        >
          <ViewModeButton
            label="List view"
            glyph="☰"
            active={viewMode === "list"}
            onClick={() => setViewMode("list")}
          />
          <ViewModeButton
            label="Kanban view"
            glyph="▦"
            active={viewMode === "kanban"}
            onClick={() => setViewMode("kanban")}
          />
        </div>
      </div>

      {viewMode === "list" && tab === "all" && (
        <>
          <div style={{ display: "flex", gap: 12, padding: "8px 0 16px", alignItems: "center" }}>
            <div style={{ width: 280 }}>
              <Input
                placeholder="Search company or role…"
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
                  setStatus(v as ApplicationStatus | "");
                  resetPage();
                }}
                placeholder="All statuses"
              />
            </div>
            <div style={{ width: 180 }}>
              <Select
                value={referral}
                options={referralOptions}
                onChange={(v) => {
                  setReferral(v);
                  resetPage();
                }}
                placeholder="All referrals"
              />
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ font: "var(--text-body-s)", color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>
              {filtered.length} of {enriched.length} applications
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <div
              style={{
                minWidth: GRID_MIN_WIDTH,
                display: "grid",
                gridTemplateColumns: GRID_COLUMNS,
                columnGap: 16,
                padding: "10px 4px",
                ...eyebrowStyle,
                borderBottom: "1px solid var(--border-default)",
              }}
            >
              <span>Role</span>
              <span>Status</span>
              <span>Applied</span>
              <span>Last activity</span>
              <span>Location</span>
              <span>Salary</span>
              <span>Referral</span>
              <span>Resume</span>
              <span />
            </div>

            {visibleApps.map((e) => (
              <div
                key={e.app.id}
                onClick={() => onSelect(e.app)}
                style={{
                  minWidth: GRID_MIN_WIDTH,
                  display: "grid",
                  gridTemplateColumns: GRID_COLUMNS,
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
                    {e.app.logo}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ font: "700 14px var(--font-body)", color: "var(--text-primary)" }}>{e.app.role}</div>
                    <div
                      onClick={(event) => {
                        event.stopPropagation();
                        openCompany(e.app.companyId);
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
                      {e.company}
                      {e.isTarget && <TargetStar isTarget size={12} />}
                    </div>
                  </div>
                </div>
                {e.isSaved ? <SavedTag /> : <StatusTag status={e.app.status} />}
                <span style={{ font: "var(--text-body-s)", color: "var(--text-secondary)" }}>{e.dateAppliedLabel}</span>
                <span style={{ font: "var(--text-body-s)", color: e.staleColor }}>{e.lastActivityLabel}</span>
                <span style={{ font: "var(--text-body-s)", color: "var(--text-secondary)" }}>{e.location}</span>
                <span style={{ font: "var(--text-mono-s)", color: e.salaryColor, whiteSpace: "nowrap" }}>
                  {e.salaryLabel}
                </span>
                <span style={{ font: "var(--text-body-s)", color: e.referralColor }}>{e.referralLabel}</span>
                <span style={{ font: "var(--text-body-s)", color: "var(--text-secondary)" }}>{e.resumeLabel}</span>
                <IconButton
                  aria-label="Delete application"
                  icon={<span>✕</span>}
                  onClick={(event) => {
                    event.stopPropagation();
                    onRequestDelete(e.app);
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

          <Pagination page={currentPage} pageCount={pageCount} onPageChange={setPage} />
        </>
      )}

      {viewMode === "list" && tab === "needs_action" && (
        <div style={{ padding: "24px 0", display: "flex", flexDirection: "column", gap: 32 }}>
          <section>
            <h2 style={sectionHeadingStyle}>Ready to apply</h2>
            <p style={sectionSubStyle}>Saved roles you haven&rsquo;t applied to yet.</p>
            {savedApps.length === 0 ? (
              <EmptyLine>Nothing saved right now.</EmptyLine>
            ) : (
              <div style={cardGridStyle}>
                {savedApps.map((e) => (
                  <Card key={e.app.id} hover onClick={() => onSelect(e.app)}>
                    <NeedsActionCardBody e={e} footer={<span style={{ color: "var(--text-tertiary)" }}>Saved {e.lastActivityLabel}</span>} />
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 style={sectionHeadingStyle}>Awaiting your response</h2>
            <p style={sectionSubStyle}>Offers on the table — don&rsquo;t leave these too long.</p>
            {offerApps.length === 0 ? (
              <EmptyLine>No open offers right now.</EmptyLine>
            ) : (
              <div style={cardGridStyle}>
                {offerApps.map((e) => (
                  <Card key={e.app.id} hover onClick={() => onSelect(e.app)}>
                    <NeedsActionCardBody
                      e={e}
                      footer={
                        <span style={{ color: "var(--green-700)", fontWeight: 700 }}>
                          Offer received {e.lastActivityLabel}
                        </span>
                      }
                    />
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 style={sectionHeadingStyle}>Needs a follow-up</h2>
            <p style={sectionSubStyle}>Applied, but no reply in a while — worth a nudge.</p>
            {staleApps.length === 0 ? (
              <EmptyLine>No stale applications — nice work.</EmptyLine>
            ) : (
              <div style={cardGridStyle}>
                {staleApps.map((e) => (
                  <Card key={e.app.id} hover onClick={() => onSelect(e.app)}>
                    <NeedsActionCardBody
                      e={e}
                      footer={
                        <span style={{ color: e.staleColor, fontWeight: 700 }}>
                          {e.daysSinceActivity === 1 ? "1 day" : `${e.daysSinceActivity} days`} since last activity
                        </span>
                      }
                    />
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {viewMode === "kanban" && (
        <div style={{ padding: "24px 0", display: "flex", gap: 16, overflowX: "auto" }}>
          {kanbanColumns.map((col) => (
            <div key={col.key} style={{ width: 250, flexShrink: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px" }}>
                <span style={{ ...eyebrowStyle, color: "var(--text-secondary)" }}>{col.label}</span>
                <span
                  style={{
                    font: "var(--text-caption)",
                    color: "var(--text-tertiary)",
                    background: "var(--bg-surface-sunken)",
                    borderRadius: "var(--radius-pill)",
                    padding: "2px 8px",
                  }}
                >
                  {col.count}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {col.apps.map((e) => (
                  <Card key={e.app.id} hover onClick={() => onSelect(e.app)}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ font: "700 13px var(--font-body)", color: "var(--text-primary)" }}>{e.app.role}</div>
                      <div style={{ font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>{e.company}</div>
                      <div style={{ font: "var(--text-caption)", color: "var(--text-tertiary)" }}>{e.dateAppliedLabel}</div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "none",
        border: "none",
        borderBottom: `2px solid ${active ? "var(--accent-primary)" : "transparent"}`,
        padding: "10px 2px",
        font: "700 13px var(--font-body)",
        color: active ? "var(--text-primary)" : "var(--text-tertiary)",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function ViewModeButton({
  label,
  glyph,
  active,
  onClick,
}: {
  label: string;
  glyph: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      style={{
        width: 34,
        height: 30,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "none",
        borderRadius: 8,
        cursor: "pointer",
        fontSize: 15,
        background: active ? "var(--bg-surface)" : "transparent",
        color: active ? "var(--text-primary)" : "var(--text-tertiary)",
      }}
    >
      {glyph}
    </button>
  );
}

function SavedTag() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 24,
        padding: "0 10px",
        borderRadius: "var(--radius-pill)",
        background: "var(--status-saved-bg)",
        color: "var(--status-saved-fg)",
        font: "var(--text-caption)",
        fontWeight: 700,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ink-500)", flexShrink: 0 }} />
      Saved
    </span>
  );
}

function EmptyLine({ children }: { children: ReactNode }) {
  return <div style={{ font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>{children}</div>;
}

function NeedsActionCardBody({ e, footer }: { e: EnrichedApp; footer: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div>
        <div style={{ font: "700 15px var(--font-body)", color: "var(--text-primary)" }}>{e.app.role}</div>
        <div style={{ font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>{e.company}</div>
      </div>
      <div style={{ font: "var(--text-body-s)", color: "var(--text-secondary)" }}>
        {e.location} · {e.salaryLabel}
      </div>
      <div style={{ font: "var(--text-caption)" }}>{footer}</div>
    </div>
  );
}
