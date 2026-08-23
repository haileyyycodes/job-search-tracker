import type { CSSProperties, ReactNode } from "react";
import { Card, StatusTag, statusDotColor } from "@/components/ds";
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
  interviewRatioTierLabel,
  reachedInterview,
  type ChannelBreakdownRow,
  type InterviewRatioTier,
} from "@/lib/funnel";
import type { Application, Company, NetworkingEvent } from "@/lib/types";

const sectionHeadingStyle = {
  margin: 0,
  font: "700 17px var(--font-display)",
  letterSpacing: "-0.01em",
  color: "var(--text-primary)",
} as const;

const eyebrowStyle = {
  font: "12px var(--font-body)",
  letterSpacing: "0.09em",
  textTransform: "uppercase",
} as const;

// ---- Funnel health hero ----

const RING_RADIUS = 42;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function ringDashArray(pct: number): string {
  const filled = (Math.max(0, Math.min(100, pct)) / 100) * RING_CIRCUMFERENCE;
  return `${filled.toFixed(1)} ${RING_CIRCUMFERENCE.toFixed(1)}`;
}

const TIER_RING_STYLE: Record<InterviewRatioTier, { stroke: string; value: string; badgeText: string; dot: string }> = {
  healthy: { stroke: "var(--green-400)", value: "var(--green-300)", badgeText: "var(--green-200)", dot: "var(--green-300)" },
  at_risk: { stroke: "var(--yellow-400)", value: "var(--yellow-400)", badgeText: "var(--yellow-200)", dot: "var(--yellow-400)" },
  critical: { stroke: "var(--red-400)", value: "var(--red-400)", badgeText: "var(--red-200)", dot: "var(--red-400)" },
};

function ringPositionStyle(position: "first" | "middle" | "last"): CSSProperties {
  if (position === "middle") {
    return { padding: "0 32px", borderLeft: "1px solid rgba(255,255,255,0.14)", borderRight: "1px solid rgba(255,255,255,0.14)" };
  }
  if (position === "last") return { paddingLeft: 32 };
  return { paddingRight: 32 };
}

interface FunnelRingProps {
  label: string;
  value: number | null;
  stroke: string;
  valueColor: string;
  sub: ReactNode;
  position: "first" | "middle" | "last";
}

function FunnelRing({ label, value, stroke, valueColor, sub, position }: FunnelRingProps) {
  const filled = value != null && value > 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, ...ringPositionStyle(position) }}>
      <svg width="104" height="104" viewBox="0 0 104 104" style={{ flexShrink: 0 }}>
        <circle cx="52" cy="52" r={RING_RADIUS} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={10} />
        {filled ? (
          <circle
            cx="52"
            cy="52"
            r={RING_RADIUS}
            fill="none"
            stroke={stroke}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={ringDashArray(value)}
            transform="rotate(-90 52 52)"
          />
        ) : (
          <circle cx="52" cy="10" r={5} fill="rgba(255,255,255,0.4)" />
        )}
      </svg>
      <div>
        <div style={{ font: "11px var(--font-body)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--blue-300)", marginBottom: 8 }}>
          {label}
        </div>
        <div style={{ font: "800 42px var(--font-display)", lineHeight: 1, letterSpacing: "-0.03em", color: valueColor }}>
          {value != null ? `${value}%` : "—"}
        </div>
        <div style={{ marginTop: 8 }}>{sub}</div>
      </div>
    </div>
  );
}

function RingCaption({ children }: { children: ReactNode }) {
  return <div style={{ font: "13.5px var(--font-body)", color: "rgba(255,255,255,0.68)" }}>{children}</div>;
}

function RingBadge({ tier }: { tier: InterviewRatioTier }) {
  const s = TIER_RING_STYLE[tier];
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "4px 10px",
        borderRadius: "var(--radius-pill)",
        background: "rgba(255,255,255,0.1)",
        font: "12.5px var(--font-body)",
        color: s.badgeText,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot }} />
      {interviewRatioTierLabel(tier)}
    </div>
  );
}

interface FunnelHealthProps {
  responseRate: number | null;
  interviewRatio: number | null;
  interviewRatioTier: InterviewRatioTier | null;
  offerRatio: number | null;
}

function FunnelHealth({ responseRate, interviewRatio, interviewRatioTier, offerRatio }: FunnelHealthProps) {
  const tierStyle = interviewRatioTier ? TIER_RING_STYLE[interviewRatioTier] : null;
  const offerFilled = offerRatio != null && offerRatio > 0;

  return (
    <section
      style={{
        background: "var(--blue-900)",
        borderRadius: "var(--radius-l)",
        padding: "32px 36px 36px",
        color: "var(--white)",
        boxShadow: "0 12px 32px -18px rgba(20,32,60,0.45)",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 28 }}>
        <h2 style={{ ...sectionHeadingStyle, color: "var(--white)" }}>Funnel health</h2>
        <span style={{ ...eyebrowStyle, color: "var(--blue-300)" }}>Conversion at each step</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)" }}>
        <FunnelRing
          label="Interview ratio"
          value={interviewRatio}
          stroke={tierStyle?.stroke ?? "rgba(255,255,255,0.3)"}
          valueColor={tierStyle?.value ?? "rgba(255,255,255,0.55)"}
          sub={interviewRatioTier ? <RingBadge tier={interviewRatioTier} /> : <RingCaption>Interviews ÷ applications sent</RingCaption>}
          position="first"
        />
        <FunnelRing
          label="Response rate"
          value={responseRate}
          stroke="var(--blue-300)"
          valueColor="var(--white)"
          sub={<RingCaption>Any reply, including rejections</RingCaption>}
          position="middle"
        />
        <FunnelRing
          label="Interview-to-offer ratio"
          value={offerRatio}
          stroke="var(--blue-300)"
          valueColor={offerFilled ? "var(--white)" : "rgba(255,255,255,0.55)"}
          sub={<RingCaption>Offers ÷ interviews reached</RingCaption>}
          position="last"
        />
      </div>
    </section>
  );
}

// ---- Stale applications ----

interface StaleApplicationsProps {
  staleApplications: { app: Application; daysSinceActivity: number }[];
  companies: Company[];
  onSelectApp: (app: Application) => void;
  onViewAllApplications: () => void;
}

function StaleApplications({ staleApplications, companies, onSelectApp, onViewAllApplications }: StaleApplicationsProps) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <h2 style={sectionHeadingStyle}>Stale applications</h2>
        <span onClick={onViewAllApplications} style={{ font: "600 13.5px var(--font-body)", color: "var(--text-link)", cursor: "pointer" }}>
          View all →
        </span>
      </div>
      <Card padding="lg">
        {staleApplications.length === 0 ? (
          <div style={{ padding: "18px 0", font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>
            Nothing waiting on a reply right now.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {staleApplications.map(({ app, daysSinceActivity }, i) => (
              <div
                key={app.id}
                onClick={() => onSelectApp(app)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "18px 0",
                  borderBottom: i < staleApplications.length - 1 ? "1px solid var(--border-default)" : "none",
                  cursor: "pointer",
                }}
              >
                <div style={{ width: 3, alignSelf: "stretch", borderRadius: "var(--radius-pill)", background: statusDotColor(app.status) }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: "700 15px var(--font-display)", color: "var(--text-link)" }}>{app.role}</div>
                  <div style={{ font: "13px var(--font-body)", color: "var(--text-secondary)", marginTop: 3 }}>
                    {companyName(app.companyId, companies)}
                  </div>
                </div>
                <StatusTag status={app.status} />
                <div style={{ textAlign: "right", width: 78 }}>
                  <div style={{ font: "500 17px var(--font-mono)", letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
                    {daysSinceActivity}
                  </div>
                  <div style={{ font: "11px var(--font-body)", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>
                    {daysSinceActivity === 1 ? "day" : "days"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ---- Channel breakdown ----

const TIER_BAR_STYLE: Record<InterviewRatioTier, { text: string; bar: string }> = {
  healthy: { text: "var(--green-700)", bar: "var(--green-500)" },
  at_risk: { text: "var(--yellow-600)", bar: "var(--yellow-400)" },
  critical: { text: "var(--red-600)", bar: "var(--red-400)" },
};

function ChannelBar({ row }: { row: ChannelBreakdownRow }) {
  if (row.count === 0) {
    return (
      <div
        style={{
          height: 8,
          borderRadius: "var(--radius-pill)",
          background: "var(--bg-surface-sunken)",
          border: "1px dashed var(--border-strong)",
          boxSizing: "border-box",
        }}
      />
    );
  }
  const pct = row.interviewRatio ?? 0;
  const barColor = row.tier ? TIER_BAR_STYLE[row.tier].bar : "var(--ink-300)";
  return (
    <div style={{ height: 8, borderRadius: "var(--radius-pill)", background: "var(--bg-surface-sunken)", overflow: "hidden" }}>
      <div style={{ width: pct > 0 ? `${pct}%` : 6, height: "100%", borderRadius: "var(--radius-pill)", background: barColor }} />
    </div>
  );
}

function ChannelBreakdown({ channelBreakdown }: { channelBreakdown: ChannelBreakdownRow[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <h2 style={{ ...sectionHeadingStyle, marginBottom: 20 }}>Channel breakdown</h2>
      <div style={{ flex: 1, display: "grid" }}>
        <Card padding="lg">
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {channelBreakdown.map((row) => {
              const textColor = row.tier ? TIER_BAR_STYLE[row.tier].text : "var(--text-tertiary)";
              return (
                <div key={row.channel}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ font: "600 14px var(--font-body)", color: row.count === 0 ? "var(--text-secondary)" : "var(--text-primary)" }}>
                      {channelLabels[row.channel]}
                    </span>
                    <span style={{ font: "13px var(--font-body)", color: "var(--text-secondary)" }}>
                      {row.count} application{row.count === 1 ? "" : "s"} ·{" "}
                      <strong style={{ color: textColor, fontWeight: 700 }}>
                        {row.interviewRatio != null ? `${row.interviewRatio}% interview rate` : "no data"}
                      </strong>
                    </span>
                  </div>
                  <ChannelBar row={row} />
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ---- Application velocity ----

const VELOCITY_WEEKS = 8;

interface VelocityChartProps {
  buckets: { weekStart: Date; label: string; count: number }[];
}

function VelocityChart({ buckets }: VelocityChartProps) {
  const chartHeight = 196;
  const maxCount = Math.max(1, ...buckets.map((b) => b.count));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
        <h2 style={sectionHeadingStyle}>Application velocity</h2>
        <span style={{ ...eyebrowStyle, color: "var(--text-tertiary)" }}>Applications per week</span>
      </div>
      <div style={{ flex: 1, display: "grid" }}>
        <Card padding="lg">
          <div style={{ position: "relative", height: chartHeight }}>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ height: 1, background: "var(--border-default)" }} />
              <div style={{ height: 1, background: "var(--ink-100)" }} />
              <div style={{ height: 1, background: "var(--ink-100)" }} />
              <div style={{ height: 1, background: "var(--border-default)" }} />
            </div>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", gap: 10 }}>
              {buckets.map((b, i) => {
                const pct = Math.max((b.count / maxCount) * 100, b.count > 0 ? 4 : 0);
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, height: "100%", justifyContent: "flex-end" }}>
                    {b.count > 0 && <span style={{ font: "13px var(--font-mono)", color: "var(--blue-700)" }}>{b.count}</span>}
                    <div
                      style={{
                        width: "100%",
                        maxWidth: 38,
                        height: `${pct}%`,
                        minHeight: b.count > 0 ? 3 : 1,
                        background: b.count > 0 ? "var(--blue-500)" : "var(--ink-100)",
                        borderRadius: "8px 8px 3px 3px",
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            {buckets.map((b, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  textAlign: "center",
                  font: `${b.count > 0 ? 500 : 400} 12px var(--font-mono)`,
                  color: b.count > 0 ? "var(--text-primary)" : "var(--text-tertiary)",
                }}
              >
                {b.label}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ---- Pipeline performance ----

interface StatCardProps {
  label: string;
  value: ReactNode;
  sub?: string;
  bar?: ReactNode;
}

function StatCard({ label, value, sub, bar }: StatCardProps) {
  return (
    <Card padding="lg">
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ font: "11px var(--font-body)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>
          {label}
        </div>
        <div style={{ font: "800 36px var(--font-display)", lineHeight: 1, letterSpacing: "-0.03em", color: "var(--text-primary)" }}>
          {value}
        </div>
        {bar}
        {sub && <div style={{ font: "13px var(--font-body)", color: "var(--text-secondary)" }}>{sub}</div>}
      </div>
    </Card>
  );
}

function SplitRate({ a, b }: { a: number; b: number }) {
  return (
    <>
      <span style={{ color: a === 0 ? "var(--text-tertiary)" : "inherit" }}>{a}%</span>{" "}
      <span style={{ color: "var(--ink-300)" }}>/</span>{" "}
      <span style={{ color: b === 0 ? "var(--text-tertiary)" : "inherit" }}>{b}%</span>
    </>
  );
}

function SplitRateBar({ a, b }: { a: number; b: number }) {
  return (
    <div style={{ display: "flex", gap: 4, height: 6 }}>
      <div style={{ flex: Math.max(a, 4), borderRadius: "var(--radius-pill)", background: "var(--blue-500)" }} />
      <div style={{ flex: Math.max(b, 4), borderRadius: "var(--radius-pill)", background: "var(--bg-surface-hover)" }} />
    </div>
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
  const tailoredRate = rateOf(submittedApps.filter((a) => a.resumeType === "tailored"));
  const untailoredRate = rateOf(submittedApps.filter((a) => a.resumeType === "untailored"));
  const withCoverLetterRate = rateOf(submittedApps.filter((a) => a.coverLetterSubmitted));
  const withoutCoverLetterRate = rateOf(submittedApps.filter((a) => !a.coverLetterSubmitted));

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
    <div style={{ padding: "24px 32px 32px", overflow: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "var(--space-7)" }}>
      <FunnelHealth
        responseRate={responseRate}
        interviewRatio={interviewRatio}
        interviewRatioTier={interviewRatioTier}
        offerRatio={offerRatio}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 28 }}>
        <VelocityChart buckets={velocityBuckets} />
        <ChannelBreakdown channelBreakdown={channelBreakdown} />
      </div>

      <StaleApplications
        staleApplications={staleApplications}
        companies={companies}
        onSelectApp={onSelectApp}
        onViewAllApplications={onViewAllApplications}
      />

      <div>
        <h2 style={{ ...sectionHeadingStyle, marginBottom: 16 }}>Pipeline performance</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
          <StatCard
            label="Interview rate by resume type"
            value={<SplitRate a={tailoredRate} b={untailoredRate} />}
            bar={<SplitRateBar a={tailoredRate} b={untailoredRate} />}
            sub="Tailored vs. untailored"
          />
          <StatCard
            label="Interview rate by cover letter"
            value={<SplitRate a={withCoverLetterRate} b={withoutCoverLetterRate} />}
            bar={<SplitRateBar a={withCoverLetterRate} b={withoutCoverLetterRate} />}
            sub="With vs. without cover letter"
          />
          <StatCard
            label="Applications to submit"
            value={<span style={{ color: todoCount === 0 ? "var(--text-tertiary)" : "inherit" }}>{todoCount}</span>}
            bar={<div style={{ height: 6, borderRadius: "var(--radius-pill)", background: "var(--bg-surface-hover)" }} />}
            sub="Queued and ready to go"
          />
          <StatCard
            label="Avg. response time"
            value={
              avgResponseDays != null ? (
                <>
                  {avgResponseDays} <span style={{ font: "700 22px var(--font-display)", color: "var(--text-secondary)" }}>days</span>
                </>
              ) : (
                "—"
              )
            }
            bar={
              <div style={{ display: "flex", gap: 3, height: 6 }}>
                <div style={{ flex: 1, borderRadius: "var(--radius-pill)", background: "var(--green-500)" }} />
                <div style={{ flex: 1, borderRadius: "var(--radius-pill)", background: "var(--green-300)" }} />
                <div style={{ flex: 1, borderRadius: "var(--radius-pill)", background: "var(--green-200)" }} />
                <div style={{ flex: 5, borderRadius: "var(--radius-pill)", background: "var(--bg-surface-hover)" }} />
              </div>
            }
            sub={
              avgResponseDays != null
                ? `Based on ${responseDaysList.length} application${responseDaysList.length === 1 ? "" : "s"}`
                : "No responses yet"
            }
          />
        </div>
      </div>

      <div>
        <h2 style={{ ...sectionHeadingStyle, marginBottom: 22 }}>Status breakdown</h2>
        <Card padding="lg">
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {statusOrder
              .filter((s) => apps.some((a) => a.status === s))
              .map((s) => {
                const count = apps.filter((a) => a.status === s).length;
                return (
                  <div key={s} style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <div style={{ width: 120, flexShrink: 0 }}>
                      <StatusTag status={s} />
                    </div>
                    <div
                      style={{
                        flex: 1,
                        height: 10,
                        borderRadius: "var(--radius-pill)",
                        background: "var(--bg-surface-sunken)",
                        overflow: "hidden",
                      }}
                    >
                      <div style={{ width: `${(count / total) * 100}%`, height: "100%", borderRadius: "var(--radius-pill)", background: "var(--blue-500)" }} />
                    </div>
                    <span style={{ width: 24, textAlign: "right", font: "15px var(--font-mono)", color: "var(--text-primary)" }}>
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
