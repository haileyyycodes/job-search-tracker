import { useState, type CSSProperties, type ReactNode } from "react";
import { Card, Dialog, IconButton, StatusTag } from "@/components/ds";
import { companyName } from "@/lib/companies";
import { bucketItemsByCalendarWeek, type WeekItemBucket } from "@/lib/date";
import { getResponseDays } from "@/lib/responseTime";
import {
  channelLabels,
  getChannelBreakdown,
  getInterviewRatio,
  getInterviewRatioTier,
  getOfferRatio,
  getResponseRate,
  interviewRatioTierLabel,
  reachedInterview,
  type ChannelBreakdownRow,
  type InterviewRatioTier,
} from "@/lib/funnel";
import type { Application, Company, Goals, NetworkingEvent } from "@/lib/types";

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
    <div style={{ display: "flex", alignItems: "center", gap: 16, ...ringPositionStyle(position) }}>
      <svg width="84" height="84" viewBox="0 0 104 104" style={{ flexShrink: 0 }}>
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
        <div style={{ font: "11px var(--font-body)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--blue-300)", marginBottom: 5 }}>
          {label}
        </div>
        <div style={{ font: "800 32px var(--font-display)", lineHeight: 1, letterSpacing: "-0.03em", color: valueColor }}>
          {value != null ? `${value}%` : "—"}
        </div>
        <div style={{ marginTop: 6 }}>{sub}</div>
      </div>
    </div>
  );
}

function RingCaption({ children }: { children: ReactNode }) {
  return <div style={{ font: "12.5px var(--font-body)", color: "rgba(255,255,255,0.68)" }}>{children}</div>;
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
  avgResponseDays: number | null;
  responseCount: number;
}

function FunnelHealth({
  responseRate,
  interviewRatio,
  interviewRatioTier,
  offerRatio,
  avgResponseDays,
  responseCount,
}: FunnelHealthProps) {
  const tierStyle = interviewRatioTier ? TIER_RING_STYLE[interviewRatioTier] : null;
  const offerFilled = offerRatio != null && offerRatio > 0;

  return (
    <section
      style={{
        background: "var(--blue-900)",
        borderRadius: "var(--radius-l)",
        padding: "22px 28px 24px",
        color: "var(--white)",
        boxShadow: "0 12px 32px -18px rgba(20,32,60,0.45)",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18 }}>
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
      <div
        style={{
          marginTop: 16,
          paddingTop: 14,
          borderTop: "1px solid rgba(255,255,255,0.14)",
          display: "flex",
          alignItems: "baseline",
          gap: 14,
        }}
      >
        <span style={{ font: "11px var(--font-body)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--blue-300)" }}>
          Avg. response time
        </span>
        <span style={{ font: "800 22px var(--font-display)", lineHeight: 1, letterSpacing: "-0.03em", color: "var(--white)" }}>
          {avgResponseDays != null ? (
            <>
              {avgResponseDays} <span style={{ font: "700 15px var(--font-display)", color: "rgba(255,255,255,0.68)" }}>days</span>
            </>
          ) : (
            "—"
          )}
        </span>
        <RingCaption>
          {avgResponseDays != null
            ? `Based on ${responseCount} application${responseCount === 1 ? "" : "s"}`
            : "No responses yet"}
        </RingCaption>
      </div>
    </section>
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
      <h2 style={{ ...sectionHeadingStyle, marginBottom: 14 }}>Channel breakdown</h2>
      <div style={{ flex: 1, display: "grid" }}>
        <Card padding="md">
          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            {channelBreakdown.map((row) => {
              const textColor = row.tier ? TIER_BAR_STYLE[row.tier].text : "var(--text-tertiary)";
              return (
                <div key={row.channel}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
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

type VelocityBucket = WeekItemBucket<Application>;

/** "Jul 13 – Jul 19" for the Monday-Sunday week beginning at `weekStart`. */
function weekRangeLabel(weekStart: Date): string {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const opts = { month: "short", day: "numeric" } as const;
  return `${weekStart.toLocaleDateString("en-US", opts)} – ${weekEnd.toLocaleDateString("en-US", opts)}`;
}

/** A round y-axis ceiling that sits just above the data, so bars never touch the top and their value labels have headroom. */
function velocityAxisMax(dataMax: number): number {
  if (dataMax <= 1) return 2;
  if (dataMax <= 4) return dataMax + 1;
  if (dataMax <= 10) return Math.ceil((dataMax + 1) / 2) * 2;
  return Math.ceil((dataMax + 1) / 5) * 5;
}

/** Evenly spaced whole-number gridline values from 0 to axisMax. */
function velocityTicks(axisMax: number): number[] {
  const step = axisMax <= 5 ? 1 : axisMax <= 10 ? 2 : 5;
  const ticks: number[] = [];
  for (let v = 0; v <= axisMax; v += step) ticks.push(v);
  return ticks;
}

/**
 * One column of the velocity chart. Weeks with applications render a clickable bar with hover
 * and press states that opens the drill-down; empty weeks render an inert stub.
 */
function VelocityBar({
  bucket,
  axisMax,
  onOpen,
}: {
  bucket: VelocityBucket;
  axisMax: number;
  onOpen: () => void;
}) {
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);
  const count = bucket.items.length;

  const wrap: CSSProperties = { flex: 1, display: "flex", justifyContent: "center", height: "100%" };
  const barBase: CSSProperties = {
    width: "100%",
    maxWidth: 38,
    alignSelf: "flex-end",
    height: `${(count / axisMax) * 100}%`,
    borderRadius: "8px 8px 3px 3px",
  };

  if (count === 0) {
    return (
      <div style={wrap}>
        <div style={{ ...barBase, minHeight: 1, background: "var(--ink-100)" }} />
      </div>
    );
  }

  return (
    <div style={wrap}>
      <button
        type="button"
        onClick={onOpen}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => {
          setHover(false);
          setActive(false);
        }}
        onMouseDown={() => setActive(true)}
        onMouseUp={() => setActive(false)}
        aria-label={`${count} application${count === 1 ? "" : "s"} the week of ${bucket.label} — view list`}
        style={{
          ...barBase,
          minHeight: 3,
          padding: 0,
          border: "none",
          cursor: "pointer",
          background: active ? "var(--blue-700)" : hover ? "var(--blue-600)" : "var(--blue-500)",
          boxShadow: hover && !active ? "0 0 0 3px var(--blue-100)" : "none",
          transform: active ? "translateY(1px)" : "none",
          transition:
            "background var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard), transform var(--duration-fast) var(--ease-standard)",
        }}
      />
    </div>
  );
}

interface VelocityChartProps {
  buckets: VelocityBucket[];
  companies: Company[];
  /** Applications-per-week goal; drawn as a reference line when set to a positive number. */
  weeklyTarget?: number;
}

function VelocityChart({ buckets, companies, weeklyTarget }: VelocityChartProps) {
  const chartHeight = 148;
  const axisWidth = 22;
  const target = weeklyTarget && weeklyTarget > 0 ? weeklyTarget : null;
  const dataMax = Math.max(0, target ?? 0, ...buckets.map((b) => b.items.length));
  const axisMax = velocityAxisMax(dataMax);
  const ticks = velocityTicks(axisMax);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const selected = selectedIndex != null ? buckets[selectedIndex] : null;
  const selectedApps = selected
    ? [...selected.items].sort((a, b) => new Date(a.dateApplied).getTime() - new Date(b.dateApplied).getTime())
    : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <h2 style={{ ...sectionHeadingStyle, marginBottom: 6 }}>Application velocity</h2>
      <div style={{ flex: 1, display: "grid" }}>
        <Card padding="md">
          <div style={{ display: "flex" }}>
            {/* y axis — one number per gridline, so bar heights read against real application counts */}
            <div style={{ position: "relative", width: axisWidth, height: chartHeight, flexShrink: 0 }}>
              {ticks.map((t) => (
                <span
                  key={t}
                  style={{
                    position: "absolute",
                    right: 6,
                    bottom: `${(t / axisMax) * 100}%`,
                    transform: "translateY(50%)",
                    font: "11px var(--font-mono)",
                    color: "var(--text-tertiary)",
                    lineHeight: 1,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
            <div style={{ position: "relative", height: chartHeight, flex: 1 }}>
              {ticks.map((t) => (
                <div
                  key={t}
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: `${(t / axisMax) * 100}%`,
                    height: 1,
                    background: t === 0 ? "var(--border-default)" : "var(--ink-100)",
                  }}
                />
              ))}
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", gap: 10 }}>
                {buckets.map((b, i) => (
                  <VelocityBar key={i} bucket={b} axisMax={axisMax} onOpen={() => setSelectedIndex(i)} />
                ))}
              </div>
              {target != null && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: `${(target / axisMax) * 100}%`,
                    borderTop: "2px dashed var(--green-600)",
                    pointerEvents: "none",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      right: 0,
                      bottom: 2,
                      padding: "1px 5px",
                      borderRadius: "var(--radius-pill)",
                      background: "var(--green-100)",
                      color: "var(--green-700)",
                      font: "10px var(--font-mono)",
                      lineHeight: 1.4,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Target {target}/wk
                  </span>
                </div>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 10, paddingLeft: axisWidth }}>
            {buckets.map((b, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  textAlign: "center",
                  font: `${b.items.length > 0 ? 500 : 400} 12px var(--font-mono)`,
                  color: b.items.length > 0 ? "var(--text-primary)" : "var(--text-tertiary)",
                }}
              >
                {b.label}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Dialog open={selectedIndex != null} title="Applications by week" onClose={() => setSelectedIndex(null)}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
          <IconButton
            icon={<span style={{ font: "16px var(--font-body)", lineHeight: 1 }}>‹</span>}
            aria-label="Previous week"
            variant="secondary"
            size="sm"
            disabled={selectedIndex == null || selectedIndex === 0}
            onClick={() => setSelectedIndex((i) => (i != null && i > 0 ? i - 1 : i))}
          />
          <div style={{ textAlign: "center", minWidth: 0 }}>
            <div style={{ font: "600 14px var(--font-body)", color: "var(--text-primary)" }}>
              {selected ? weekRangeLabel(selected.weekStart) : ""}
            </div>
            <div style={{ font: "var(--text-caption)", color: "var(--text-secondary)" }}>
              {selectedApps.length} application{selectedApps.length === 1 ? "" : "s"} sent
            </div>
          </div>
          <IconButton
            icon={<span style={{ font: "16px var(--font-body)", lineHeight: 1 }}>›</span>}
            aria-label="Next week"
            variant="secondary"
            size="sm"
            disabled={selectedIndex == null || selectedIndex === buckets.length - 1}
            onClick={() => setSelectedIndex((i) => (i != null && i < buckets.length - 1 ? i + 1 : i))}
          />
        </div>
        <div style={{ maxHeight: 340, overflowY: "auto", margin: "0 -4px" }}>
          {selectedApps.length === 0 && (
            <div style={{ font: "13px var(--font-body)", color: "var(--text-tertiary)", textAlign: "center", padding: "24px 0" }}>
              No applications this week.
            </div>
          )}
          {selectedApps.map((app, i) => (
            <div
              key={app.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 4px",
                borderTop: i === 0 ? "none" : "1px solid var(--border-default)",
              }}
            >
              <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1 }}>{app.logo}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    font: "600 13px var(--font-body)",
                    color: "var(--text-primary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {app.role}
                </div>
                <div
                  style={{
                    font: "var(--text-body-s)",
                    color: "var(--text-tertiary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {companyName(app.companyId, companies)}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
                <StatusTag status={app.status} />
                <span style={{ font: "var(--text-caption)", color: "var(--text-tertiary)" }}>{app.dateApplied}</span>
              </div>
            </div>
          ))}
        </div>
      </Dialog>
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
    <Card padding="md">
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ font: "11px var(--font-body)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>
          {label}
        </div>
        <div style={{ font: "800 30px var(--font-display)", lineHeight: 1, letterSpacing: "-0.03em", color: "var(--text-primary)" }}>
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

const rateOf = (list: Application[]) =>
  list.length ? Math.round((list.filter(reachedInterview).length / list.length) * 100) : 0;

interface DashboardViewProps {
  apps: Application[];
  companies: Company[];
  goals: Goals;
  networkingEvents: NetworkingEvent[];
}

export function DashboardView({ apps, companies, goals, networkingEvents }: DashboardViewProps) {
  const submittedApps = apps.filter((a) => a.status !== "todo");
  const tailoredRate = rateOf(submittedApps.filter((a) => a.resumeType === "tailored"));
  const untailoredRate = rateOf(submittedApps.filter((a) => a.resumeType === "untailored"));
  const withCoverLetterRate = rateOf(submittedApps.filter((a) => a.coverLetterSubmitted));
  const withoutCoverLetterRate = rateOf(submittedApps.filter((a) => !a.coverLetterSubmitted));

  const responseDaysList = apps.map(getResponseDays).filter((d): d is number => d != null);
  const avgResponseDays = responseDaysList.length
    ? Math.round(responseDaysList.reduce((sum, d) => sum + d, 0) / responseDaysList.length)
    : null;

  const velocityBuckets = bucketItemsByCalendarWeek(
    apps.filter((a) => a.dateApplied),
    (a) => a.dateApplied,
    VELOCITY_WEEKS
  );

  const responseRate = getResponseRate(apps);
  const interviewRatio = getInterviewRatio(apps);
  const interviewRatioTier = getInterviewRatioTier(interviewRatio);
  const offerRatio = getOfferRatio(apps);

  const channelBreakdown = getChannelBreakdown(apps, networkingEvents);

  return (
    <div style={{ padding: "18px 32px 28px", overflow: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      <FunnelHealth
        responseRate={responseRate}
        interviewRatio={interviewRatio}
        interviewRatioTier={interviewRatioTier}
        offerRatio={offerRatio}
        avgResponseDays={avgResponseDays}
        responseCount={responseDaysList.length}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 20 }}>
        <VelocityChart buckets={velocityBuckets} companies={companies} weeklyTarget={goals.applicationsPerWeekTarget} />
        <ChannelBreakdown channelBreakdown={channelBreakdown} />
      </div>

      <div>
        <h2 style={{ ...sectionHeadingStyle, marginBottom: 12 }}>Pipeline performance</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
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
        </div>
      </div>
    </div>
  );
}
