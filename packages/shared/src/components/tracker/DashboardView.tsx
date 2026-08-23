import { Card, StatusTag } from "@/components/ds";
import { statusOrder } from "@/lib/data";
import { companyName } from "@/lib/companies";
import { bucketByCalendarWeek } from "@/lib/date";
import { getResponseDays } from "@/lib/responseTime";
import {
  channelLabels,
  getChannelBreakdown,
  getInterviewRatio,
  getInterviewRatioTier,
  getOfferRatio,
  getResponseRate,
  getStaleApplications,
  interviewRatioTierColor,
  interviewRatioTierLabel,
  reachedInterview,
} from "@/lib/funnel";
import type { Application, Company, NetworkingEvent } from "@/lib/types";

const sectionHeaderStyle = {
  font: "700 15px var(--font-display)",
  color: "var(--text-primary)",
  marginBottom: 12,
} as const;

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  valueColor?: string;
}

function StatCard({ label, value, sub, valueColor }: StatCardProps) {
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
      <div style={{ font: "700 32px var(--font-display)", color: valueColor ?? "var(--text-primary)" }}>{value}</div>
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

const STALE_LIMIT = 6;

const rateOf = (list: Application[]) =>
  list.length ? Math.round((list.filter(reachedInterview).length / list.length) * 100) : 0;

interface DashboardViewProps {
  apps: Application[];
  companies: Company[];
  networkingEvents: NetworkingEvent[];
  onSelectApp: (app: Application) => void;
  onViewAllApplications: () => void;
}

export function DashboardView({ apps, companies, networkingEvents, onSelectApp, onViewAllApplications }: DashboardViewProps) {
  const total = apps.length;
  const todoCount = apps.filter((a) => a.status === "todo").length;
  const submittedApps = apps.filter((a) => a.status !== "todo");
  const tailored = submittedApps.filter((a) => a.resumeType === "tailored");
  const untailored = submittedApps.filter((a) => a.resumeType === "untailored");
  const withCoverLetter = submittedApps.filter((a) => a.coverLetterSubmitted);
  const withoutCoverLetter = submittedApps.filter((a) => !a.coverLetterSubmitted);

  const responseDaysList = apps.map(getResponseDays).filter((d): d is number => d != null);
  const avgResponseDays = responseDaysList.length
    ? Math.round(responseDaysList.reduce((sum, d) => sum + d, 0) / responseDaysList.length)
    : null;

  const velocityBuckets = bucketByCalendarWeek(
    apps.filter((a) => a.dateApplied).map((a) => a.dateApplied),
    VELOCITY_WEEKS
  );

  const responseRate = getResponseRate(apps);
  const interviewRatio = getInterviewRatio(apps);
  const interviewRatioTier = getInterviewRatioTier(interviewRatio);
  const offerRatio = getOfferRatio(apps);

  const staleApplications = getStaleApplications(apps, STALE_LIMIT);
  const channelBreakdown = getChannelBreakdown(apps, networkingEvents);

  return (
    <div style={{ padding: "24px 32px 32px", overflow: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <div style={sectionHeaderStyle}>Funnel health</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          <StatCard
            label="Response rate"
            value={responseRate != null ? `${responseRate}%` : "—"}
            sub="Any reply, including rejections"
          />
          <StatCard
            label="Interview ratio"
            value={interviewRatio != null ? `${interviewRatio}%` : "—"}
            sub={interviewRatioTierLabel(interviewRatioTier) || "Interviews ÷ applications sent"}
            valueColor={interviewRatioTierColor(interviewRatioTier)}
          />
          <StatCard
            label="Interview-to-offer ratio"
            value={offerRatio != null ? `${offerRatio}%` : "—"}
            sub="Offers ÷ interviews reached"
          />
        </div>
      </div>
      <div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ font: "700 15px var(--font-display)", color: "var(--text-primary)" }}>Stale applications</div>
          <span
            onClick={onViewAllApplications}
            style={{ font: "700 13px var(--font-body)", color: "var(--text-link)", cursor: "pointer" }}
          >
            View all →
          </span>
        </div>
        <Card padding="md">
          {staleApplications.length === 0 ? (
            <div style={{ font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>
              Nothing waiting on a reply right now.
            </div>
          ) : (
            staleApplications.map(({ app, daysSinceActivity }, i) => (
              <div
                key={app.id}
                onClick={() => onSelectApp(app)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  padding: "9px 0",
                  borderBottom: i < staleApplications.length - 1 ? "1px solid var(--border-default)" : "none",
                  cursor: "pointer",
                }}
              >
                <div>
                  <div style={{ font: "700 13px var(--font-body)", color: "var(--text-link)" }}>{app.role}</div>
                  <div style={{ font: "var(--text-caption)", color: "var(--text-tertiary)" }}>
                    {companyName(app.companyId, companies)}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <StatusTag status={app.status} />
                  <span style={{ font: "var(--text-body-s)", color: "var(--text-secondary)" }}>
                    {daysSinceActivity} {daysSinceActivity === 1 ? "day" : "days"}
                  </span>
                </div>
              </div>
            ))
          )}
        </Card>
      </div>
      <div>
        <div style={sectionHeaderStyle}>Channel breakdown</div>
        <Card padding="md">
          {channelBreakdown.map((row, i) => (
            <div
              key={row.channel}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                padding: "9px 0",
                borderBottom: i < channelBreakdown.length - 1 ? "1px solid var(--border-default)" : "none",
              }}
            >
              <span style={{ font: "700 13px var(--font-body)", color: "var(--text-primary)" }}>
                {channelLabels[row.channel]}
              </span>
              <span style={{ font: "var(--text-body-s)" }}>
                <span style={{ color: "var(--text-secondary)" }}>
                  {row.count} application{row.count === 1 ? "" : "s"}
                </span>
                <span style={{ color: "var(--text-tertiary)" }}> · </span>
                <span style={{ color: interviewRatioTierColor(row.tier), fontWeight: 700 }}>
                  {row.interviewRatio != null ? `${row.interviewRatio}% interview rate` : "no data"}
                </span>
              </span>
            </div>
          ))}
        </Card>
      </div>
      <VelocityChart buckets={velocityBuckets} />
      <div>
        <div style={sectionHeaderStyle}>Pipeline performance</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
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
  );
}
