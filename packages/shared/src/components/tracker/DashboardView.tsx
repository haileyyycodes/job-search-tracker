import { useState } from "react";
import { Card } from "@/components/ds";
import { StatusTag } from "@/components/ds";
import { statusOrder } from "@/lib/data";
import { bucketByCalendarWeek, isInCurrentCalendarMonth } from "@/lib/date";
import { getResponseDays } from "@/lib/responseTime";
import { InterviewStatsView } from "./InterviewStatsView";
import type { Application, NetworkingEvent } from "@/lib/types";

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
}

function VelocityChart({ buckets }: VelocityChartProps) {
  const chartHeight = 120;
  const maxCount = Math.max(1, ...buckets.map((b) => b.count));

  return (
    <Card padding="md">
      <div style={{ font: "700 15px var(--font-display)", color: "var(--text-primary)", marginBottom: 14 }}>
        Application velocity
      </div>
      <div style={{ position: "relative", height: chartHeight, marginBottom: 8 }}>
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
    </Card>
  );
}

interface DashboardViewProps {
  apps: Application[];
  networkingEvents: NetworkingEvent[];
}

const reachedInterview = (a: Application) => a.statusHistory.some((s) => s.status === "interviewing");
const rateOf = (list: Application[]) =>
  list.length ? Math.round((list.filter(reachedInterview).length / list.length) * 100) : 0;

export function DashboardView({ apps, networkingEvents }: DashboardViewProps) {
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
  const untailored = submittedApps.filter((a) => a.resumeType === "untailored");
  const withCoverLetter = submittedApps.filter((a) => a.coverLetterSubmitted);
  const withoutCoverLetter = submittedApps.filter((a) => !a.coverLetterSubmitted);

  const responseDaysList = apps.map(getResponseDays).filter((d): d is number => d != null);
  const avgResponseDays = responseDaysList.length
    ? Math.round(responseDaysList.reduce((sum, d) => sum + d, 0) / responseDaysList.length)
    : null;

  const eventsThisMonth = networkingEvents.filter((e) => isInCurrentCalendarMonth(e.date));
  const contactsMetThisMonth = new Set(eventsThisMonth.flatMap((e) => e.contactIds)).size;

  const velocityBuckets = bucketByCalendarWeek(
    apps.filter((a) => a.dateApplied).map((a) => a.dateApplied),
    VELOCITY_WEEKS
  );

  return (
    <>
    <TabBar active={activeTab} onChange={setActiveTab} />
    {activeTab === "interviewStats" ? (
      <InterviewStatsView apps={apps} />
    ) : (
    <div style={{ padding: "24px 32px 32px", overflow: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 24 }}>
      <VelocityChart buckets={velocityBuckets} />
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
            value={`${rateOf(tailored)}% / ${rateOf(untailored)}%`}
            sub="Tailored vs. untailored"
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
    </>
  );
}
