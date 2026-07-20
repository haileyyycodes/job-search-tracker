import { useState } from "react";
import { Card } from "@/components/ds";
import { Button } from "@/components/ds";
import { StatusTag } from "@/components/ds";
import { statusOrder } from "@/lib/data";
import { companyStatusLabels } from "@/lib/companies";
import { bucketByCalendarWeek, daysUntil, isInCurrentCalendarMonth, isInCurrentCalendarWeek } from "@/lib/date";
import { getResponseDays } from "@/lib/responseTime";
import { GoalsEditDialog } from "./GoalsEditDialog";
import { InterviewStatsView } from "./InterviewStatsView";
import { TargetStar } from "./TargetStar";
import type { Application, Company, CompanyStatus, Contact, Goals, NetworkingEvent } from "@/lib/types";

type DashboardTab = "overview" | "interviewStats";

const tabs: { id: DashboardTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "interviewStats", label: "Interview stats" },
];

function TabBar({ active, onChange }: { active: DashboardTab; onChange: (tab: DashboardTab) => void }) {
  return (
    <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border-default)", padding: "0 32px" }}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            background: "none",
            border: "none",
            borderBottom: `2px solid ${active === t.id ? "var(--accent-primary)" : "transparent"}`,
            padding: "12px 4px",
            marginRight: 20,
            font: "700 13px var(--font-body)",
            color: active === t.id ? "var(--text-primary)" : "var(--text-tertiary)",
            cursor: "pointer",
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function formatCurrency(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function salaryGoalText(goals: Goals): string | null {
  if (goals.salaryMin == null && goals.salaryMax == null) return null;
  if (goals.salaryMin != null && goals.salaryMax != null) {
    return `${formatCurrency(goals.salaryMin)}–${formatCurrency(goals.salaryMax)}`;
  }
  if (goals.salaryMin != null) return `${formatCurrency(goals.salaryMin)}+`;
  return null;
}

function earliestAcceptedOfferDate(apps: Application[]): string | null {
  let earliest: string | null = null;
  for (const app of apps) {
    for (const entry of app.statusHistory) {
      if (entry.status !== "offer_accepted") continue;
      if (!earliest || new Date(entry.at).getTime() < new Date(earliest).getTime()) earliest = entry.at;
    }
  }
  return earliest;
}

const sectionHeaderStyle = {
  font: "700 15px var(--font-display)",
  color: "var(--text-primary)",
  marginBottom: 12,
} as const;

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
}

function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <Card padding="md">
      <div
        style={{
          font: "var(--text-label)",
          color: "var(--text-tertiary)",
          textTransform: "uppercase",
          letterSpacing: "var(--tracking-wide)",
          fontSize: 11,
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div style={{ font: "700 32px var(--font-display)", color: "var(--text-primary)" }}>{value}</div>
      {sub && <div style={{ font: "var(--text-body-s)", color: "var(--text-tertiary)", marginTop: 4 }}>{sub}</div>}
    </Card>
  );
}

const VELOCITY_WEEKS = 8;

interface VelocityChartProps {
  buckets: { weekStart: Date; label: string; count: number }[];
  weeklyTarget?: number;
}

function VelocityChart({ buckets, weeklyTarget }: VelocityChartProps) {
  const chartHeight = 120;
  const maxCount = Math.max(1, weeklyTarget ?? 0, ...buckets.map((b) => b.count));
  const targetPct = weeklyTarget != null ? Math.min(100, (weeklyTarget / maxCount) * 100) : null;

  return (
    <Card padding="md">
      <div style={{ font: "700 15px var(--font-display)", color: "var(--text-primary)", marginBottom: 14 }}>
        Application velocity
      </div>
      <div style={{ position: "relative", height: chartHeight, marginBottom: 8 }}>
        {targetPct != null && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: `${targetPct}%`,
              borderTop: "1.5px dashed var(--text-tertiary)",
            }}
          />
        )}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: "100%" }}>
          {buckets.map((b, i) => {
            const pct = Math.max((b.count / maxCount) * 100, b.count > 0 ? 4 : 0);
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%", justifyContent: "flex-end" }}>
                <span style={{ font: "var(--text-caption)", color: "var(--text-tertiary)" }}>{b.count > 0 ? b.count : ""}</span>
                <div
                  style={{
                    width: "100%",
                    maxWidth: 32,
                    height: `${pct}%`,
                    minHeight: b.count > 0 ? 3 : 1,
                    background: b.count > 0 ? "var(--blue-400)" : "var(--ink-100)",
                    borderRadius: "3px 3px 0 0",
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        {buckets.map((b, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center", font: "var(--text-caption)", color: "var(--text-tertiary)" }}>
            {b.label}
          </div>
        ))}
      </div>
      {weeklyTarget != null && (
        <div style={{ font: "var(--text-caption)", color: "var(--text-tertiary)", marginTop: 10 }}>
          Dashed line marks your weekly target of {weeklyTarget}.
        </div>
      )}
    </Card>
  );
}

interface TargetCompaniesCardProps {
  companies: Company[];
  contacts: Contact[];
  apps: Application[];
  networkingEvents: NetworkingEvent[];
  onSelectCompany: (company: Company) => void;
}

/**
 * Per-target coverage: applications logged and networking touches. Events carry no
 * companyId, so touches are attributed via the event's contacts' employer and via the
 * linked application's company (union).
 */
function TargetCompaniesCard({ companies, contacts, apps, networkingEvents, onSelectCompany }: TargetCompaniesCardProps) {
  const targets = companies.filter((c) => c.isTarget);

  const networkingEventCount = (companyId: string) => {
    const contactIdsAtCompany = new Set(contacts.filter((c) => c.companyId === companyId).map((c) => c.id));
    return networkingEvents.filter((e) => {
      if (e.contactIds.some((id) => contactIdsAtCompany.has(id))) return true;
      const app = e.applicationId ? apps.find((a) => a.id === e.applicationId) : undefined;
      return app?.companyId === companyId;
    }).length;
  };

  const rows = targets
    .map((c) => ({
      company: c,
      appCount: apps.filter((a) => a.companyId === c.id).length,
      eventCount: networkingEventCount(c.id),
    }))
    .sort((a, b) => (a.appCount > 0 ? 1 : 0) + (a.eventCount > 0 ? 1 : 0) - ((b.appCount > 0 ? 1 : 0) + (b.eventCount > 0 ? 1 : 0)));

  const statusCounts = (Object.keys(companyStatusLabels) as CompanyStatus[])
    .map((s) => ({ status: s, count: targets.filter((c) => c.status === s).length }))
    .filter((s) => s.count > 0);

  const breakdown = [
    `${targets.length} target${targets.length === 1 ? "" : "s"}`,
    ...statusCounts.map((s) => `${s.count} ${companyStatusLabels[s.status].toLowerCase()}`),
  ].join(" · ");

  return (
    <Card padding="md">
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ font: "700 15px var(--font-display)", color: "var(--text-primary)" }}>
          <TargetStar isTarget size={13} /> Target companies
        </div>
        <span style={{ font: "var(--text-body-s)", color: "var(--text-secondary)" }}>{breakdown}</span>
      </div>
      {targets.length === 0 && (
        <div style={{ font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>
          No target companies yet — star companies on the Companies tab to track your coverage here.
        </div>
      )}
      {rows.map(({ company, appCount, eventCount }, i) => (
        <div
          key={company.id}
          onClick={() => onSelectCompany(company)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            padding: "9px 0",
            borderBottom: i < rows.length - 1 ? "1px solid var(--border-default)" : "none",
            cursor: "pointer",
          }}
        >
          <span style={{ font: "700 13px var(--font-body)", color: "var(--text-link)" }}>{company.name}</span>
          <span style={{ font: "var(--text-body-s)" }}>
            <span style={{ color: appCount > 0 ? "var(--text-secondary)" : "var(--warning)" }}>
              {appCount > 0 ? `${appCount} application${appCount === 1 ? "" : "s"}` : "no applications"}
            </span>
            <span style={{ color: "var(--text-tertiary)" }}> · </span>
            <span style={{ color: eventCount > 0 ? "var(--text-secondary)" : "var(--warning)" }}>
              {eventCount > 0 ? `${eventCount} networking event${eventCount === 1 ? "" : "s"}` : "no networking"}
            </span>
          </span>
        </div>
      ))}
    </Card>
  );
}

interface DashboardViewProps {
  apps: Application[];
  goals: Goals;
  companies: Company[];
  contacts: Contact[];
  networkingEvents: NetworkingEvent[];
  onSaveGoals: (goals: Goals) => void;
  onSelectCompany: (company: Company) => void;
}

const reachedInterview = (a: Application) => a.statusHistory.some((s) => s.status === "interviewing");
const rateOf = (list: Application[]) =>
  list.length ? Math.round((list.filter(reachedInterview).length / list.length) * 100) : 0;

export function DashboardView({ apps, goals, companies, contacts, networkingEvents, onSaveGoals, onSelectCompany }: DashboardViewProps) {
  const [goalsDialogOpen, setGoalsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const total = apps.length;
  const todoCount = apps.filter((a) => a.status === "todo").length;
  const submittedApps = apps.filter((a) => a.status !== "todo");
  const interviewedCount = submittedApps.filter(reachedInterview).length;
  const interviewRate = submittedApps.length ? Math.round((interviewedCount / submittedApps.length) * 100) : 0;
  const offerCount = apps.filter((a) => ["offer_extended", "offer_accepted", "offer_declined"].includes(a.status)).length;
  const referred = submittedApps.filter((a) => a.referral);
  const notReferred = submittedApps.filter((a) => !a.referral);
  const tailored = submittedApps.filter((a) => a.resumeType === "tailored");
  const sprayAndPray = submittedApps.filter((a) => a.resumeType === "spray_and_pray");
  const withCoverLetter = submittedApps.filter((a) => a.coverLetterSubmitted);
  const withoutCoverLetter = submittedApps.filter((a) => !a.coverLetterSubmitted);

  const responseDaysList = apps.map(getResponseDays).filter((d): d is number => d != null);
  const avgResponseDays = responseDaysList.length
    ? Math.round(responseDaysList.reduce((sum, d) => sum + d, 0) / responseDaysList.length)
    : null;

  const eventsThisMonth = networkingEvents.filter((e) => isInCurrentCalendarMonth(e.date));
  const contactsMetThisMonth = new Set(eventsThisMonth.flatMap((e) => e.contactIds)).size;

  const salaryText = salaryGoalText(goals);
  const weeklyCount = apps.filter((a) => isInCurrentCalendarWeek(a.dateApplied)).length;
  const velocityBuckets = bucketByCalendarWeek(
    apps.filter((a) => a.dateApplied).map((a) => a.dateApplied),
    VELOCITY_WEEKS
  );
  const acceptedOfferDate = earliestAcceptedOfferDate(apps);
  const overdue = !acceptedOfferDate && goals.targetOfferDate != null && daysUntil(goals.targetOfferDate) < 0;

  return (
    <>
    <TabBar active={activeTab} onChange={setActiveTab} />
    {activeTab === "interviewStats" ? (
      <InterviewStatsView apps={apps} />
    ) : (
    <div style={{ padding: "24px 32px 32px", overflow: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ font: "700 15px var(--font-display)", color: "var(--text-primary)" }}>Goals</div>
          <Button variant="secondary" size="sm" onClick={() => setGoalsDialogOpen(true)}>
            Edit goals
          </Button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          <Card padding="md">
            <div
              style={{
                font: "var(--text-label)",
                color: "var(--text-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "var(--tracking-wide)",
                fontSize: 11,
                marginBottom: 8,
              }}
            >
              Salary goal
            </div>
            {salaryText ? (
              <div style={{ font: "700 24px var(--font-display)", color: "var(--text-primary)" }}>{salaryText}</div>
            ) : (
              <div style={{ font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>No salary goal set.</div>
            )}
          </Card>
          <Card padding="md">
            <div
              style={{
                font: "var(--text-label)",
                color: "var(--text-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "var(--tracking-wide)",
                fontSize: 11,
                marginBottom: 8,
              }}
            >
              Applications this week
            </div>
            {goals.applicationsPerWeekTarget != null ? (
              <>
                <div style={{ font: "700 24px var(--font-display)", color: "var(--text-primary)" }}>
                  {weeklyCount} of {goals.applicationsPerWeekTarget}
                </div>
                <div
                  style={{
                    marginTop: 10,
                    height: 8,
                    borderRadius: "var(--radius-pill)",
                    background: "var(--ink-100)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(100, (weeklyCount / goals.applicationsPerWeekTarget) * 100)}%`,
                      height: "100%",
                      background: "var(--blue-400)",
                    }}
                  />
                </div>
              </>
            ) : (
              <div style={{ font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>No weekly target set.</div>
            )}
          </Card>
          <Card padding="md">
            <div
              style={{
                font: "var(--text-label)",
                color: "var(--text-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "var(--tracking-wide)",
                fontSize: 11,
                marginBottom: 8,
              }}
            >
              Offer target
            </div>
            {acceptedOfferDate ? (
              <div style={{ font: "700 20px var(--font-display)", color: "var(--text-primary)" }}>
                Accepted {acceptedOfferDate}
              </div>
            ) : goals.targetOfferDate ? (
              overdue ? (
                <div style={{ font: "var(--text-body-s)", color: "var(--red-600)" }}>
                  Target was {goals.targetOfferDate} — no offer yet
                </div>
              ) : (
                <>
                  <div style={{ font: "700 24px var(--font-display)", color: "var(--text-primary)" }}>
                    {daysUntil(goals.targetOfferDate)} days left
                  </div>
                  <div style={{ font: "var(--text-body-s)", color: "var(--text-tertiary)", marginTop: 4 }}>
                    Target: {goals.targetOfferDate}
                  </div>
                </>
              )
            ) : (
              <div style={{ font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>No target date set.</div>
            )}
          </Card>
        </div>
      </div>
      <VelocityChart buckets={velocityBuckets} weeklyTarget={goals.applicationsPerWeekTarget} />
      <TargetCompaniesCard
        companies={companies}
        contacts={contacts}
        apps={apps}
        networkingEvents={networkingEvents}
        onSelectCompany={onSelectCompany}
      />
      <div>
        <div style={sectionHeaderStyle}>Pipeline performance</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
          <StatCard
            label="Interview rate"
            value={`${interviewRate}%`}
            sub={`${interviewedCount} of ${submittedApps.length} applications`}
          />
          <StatCard label="Job offers" value={offerCount} sub="Offer extended or later" />
          <StatCard
            label="Interview rate by referral"
            value={`${rateOf(referred)}% / ${rateOf(notReferred)}%`}
            sub="Referred vs. non-referred"
          />
          <StatCard
            label="Interview rate by resume type"
            value={`${rateOf(tailored)}% / ${rateOf(sprayAndPray)}%`}
            sub="Tailored vs. spray and pray"
          />
          <StatCard
            label="Interview rate by cover letter"
            value={`${rateOf(withCoverLetter)}% / ${rateOf(withoutCoverLetter)}%`}
            sub="With vs. without cover letter"
          />
          <StatCard label="Applications to submit" value={todoCount} sub="Queued and ready to go" />
          <StatCard
            label="Avg. response time"
            value={avgResponseDays != null ? `${avgResponseDays} days` : "—"}
            sub={
              avgResponseDays != null
                ? `Based on ${responseDaysList.length} application${responseDaysList.length === 1 ? "" : "s"}`
                : "No responses yet"
            }
          />
        </div>
      </div>
      <div>
        <div style={sectionHeaderStyle}>Networking activity</div>
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ flex: "0 1 260px" }}>
            <StatCard label="Networking events" value={eventsThisMonth.length} sub="Logged this month" />
          </div>
          <div style={{ flex: "0 1 260px" }}>
            <StatCard label="Contacts met" value={contactsMetThisMonth} sub="Unique contacts this month" />
          </div>
        </div>
      </div>
      <div>
        <div style={sectionHeaderStyle}>Status breakdown</div>
        <Card padding="md">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {statusOrder
              .filter((s) => apps.some((a) => a.status === s))
              .map((s) => {
                const count = apps.filter((a) => a.status === s).length;
                return (
                  <div key={s} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 150, flexShrink: 0 }}>
                      <StatusTag status={s} />
                    </div>
                    <div
                      style={{
                        flex: 1,
                        height: 8,
                        borderRadius: "var(--radius-pill)",
                        background: "var(--ink-100)",
                        overflow: "hidden",
                      }}
                    >
                      <div style={{ width: `${(count / total) * 100}%`, height: "100%", background: "var(--blue-400)" }} />
                    </div>
                    <span style={{ font: "var(--text-body-s)", color: "var(--text-secondary)", width: 20, textAlign: "right" }}>
                      {count}
                    </span>
                  </div>
                );
              })}
          </div>
        </Card>
      </div>
    </div>
    )}
    {goalsDialogOpen && (
      <GoalsEditDialog
        goals={goals}
        onClose={() => setGoalsDialogOpen(false)}
        onSave={(updated) => {
          onSaveGoals(updated);
          setGoalsDialogOpen(false);
        }}
      />
    )}
    </>
  );
}
