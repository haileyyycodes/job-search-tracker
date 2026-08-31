import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Card, IconButton, Input, StatusTag } from "@/components/ds";
import { companyName } from "@/lib/companies";
import {
  bucketItemsByCalendarWeek,
  bucketItemsByPeriod,
  toDateInputString,
  type BucketUnit,
  type PeriodItemBucket,
} from "@/lib/date";
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

/** Uniform gap between a section heading and the card(s) it labels. */
const CARD_HEADER_GAP = 14;

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
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: CARD_HEADER_GAP }}>
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
      <h2 style={{ ...sectionHeadingStyle, marginBottom: CARD_HEADER_GAP }}>Channel breakdown</h2>
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

function ExpandGlyph() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 2H2v4M10 2h4v4M6 14H2v-4M10 14h4v-4" />
    </svg>
  );
}

/** Y-axis numbers, gridlines and an optional dashed goal line. `children` are the bar columns. */
function VelocityPlot({
  ticks,
  axisMax,
  height,
  axisWidth,
  target,
  targetLabel,
  children,
}: {
  ticks: number[];
  axisMax: number;
  /** A fixed pixel height, or "100%" to fill a flex parent that has a definite height. */
  height: number | string;
  axisWidth: number;
  target: number | null;
  targetLabel: string;
  children: ReactNode;
}) {
  return (
    <div style={{ display: "flex", width: "100%", height, minHeight: 0 }}>
      {/* y axis — one number per gridline, so bar heights read against real application counts */}
      <div style={{ position: "relative", width: axisWidth, height: "100%", flexShrink: 0 }}>
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
      <div style={{ position: "relative", height: "100%", flex: 1 }}>
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
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", gap: 10 }}>{children}</div>
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
              {targetLabel}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

interface VelocityChartProps {
  apps: Application[];
  companies: Company[];
  /** Applications-per-week goal; drawn as a reference line when set to a positive number. */
  weeklyTarget?: number;
  onSelectApplication?: (app: Application) => void;
}

/** Compact dashboard chart: the last 8 weeks, plus an Expand action for the full history. */
function VelocityChart({ apps, companies, weeklyTarget, onSelectApplication }: VelocityChartProps) {
  const chartHeight = 148;
  const axisWidth = 22;
  const [expanded, setExpanded] = useState(false);

  const buckets = useMemo(
    () => bucketItemsByCalendarWeek(apps.filter((a) => a.dateApplied), (a) => a.dateApplied, VELOCITY_WEEKS),
    [apps]
  );
  const target = weeklyTarget && weeklyTarget > 0 ? weeklyTarget : null;
  const dataMax = Math.max(0, target ?? 0, ...buckets.map((b) => b.items.length));
  const axisMax = velocityAxisMax(dataMax);
  const ticks = velocityTicks(axisMax);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <h2 style={{ ...sectionHeadingStyle, marginBottom: CARD_HEADER_GAP }}>Application velocity</h2>
      <div style={{ flex: 1, display: "grid" }}>
        <Card padding="md">
          {/* action bar sits above the chart's top gridline — it acts on the chart, it isn't part of it */}
          <div style={{ display: "flex", justifyContent: "flex-end", height: 28, marginBottom: 6 }}>
            <IconButton
              icon={<ExpandGlyph />}
              aria-label="Expand application velocity chart"
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(true)}
            />
          </div>
          <VelocityPlot
            ticks={ticks}
            axisMax={axisMax}
            height={chartHeight}
            axisWidth={axisWidth}
            target={target}
            targetLabel={target != null ? `Target ${target}/wk` : ""}
          >
            {buckets.map((b, i) => {
              const count = b.items.length;
              return (
                <div key={i} style={{ flex: 1, display: "flex", justifyContent: "center", height: "100%" }}>
                  <div
                    style={{
                      width: "100%",
                      maxWidth: 38,
                      alignSelf: "flex-end",
                      height: `${(count / axisMax) * 100}%`,
                      minHeight: count > 0 ? 3 : 1,
                      background: count > 0 ? "var(--blue-500)" : "var(--ink-100)",
                      borderRadius: "8px 8px 3px 3px",
                    }}
                  />
                </div>
              );
            })}
          </VelocityPlot>
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

      {expanded && (
        <VelocityExpandedModal
          apps={apps}
          companies={companies}
          weeklyTarget={target}
          onSelectApplication={onSelectApplication}
          onClose={() => setExpanded(false)}
        />
      )}
    </div>
  );
}

// ---- Expanded velocity view ----

type RangePreset = "3m" | "6m" | "1y" | "all";
const PRESET_LABELS: Record<RangePreset, string> = { "3m": "3M", "6m": "6M", "1y": "1Y", all: "All" };

function subtractMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() - months);
  return d;
}

function RangePresetButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  const [hover, setHover] = useState(false);
  const [pressed, setPressed] = useState(false);
  const background = active
    ? "var(--bg-surface)"
    : pressed
      ? "var(--ink-200)"
      : hover
        ? "var(--bg-surface-hover)"
        : "transparent";
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setPressed(false);
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        border: "none",
        background,
        color: active ? "var(--text-primary)" : "var(--text-secondary)",
        font: "700 12px var(--font-body)",
        padding: "5px 12px",
        borderRadius: "var(--radius-xs)",
        cursor: "pointer",
        boxShadow: active ? "var(--shadow-s)" : "none",
        transition: "background var(--duration-fast) var(--ease-standard)",
      }}
    >
      {children}
    </button>
  );
}

interface VelocityExpandedModalProps {
  apps: Application[];
  companies: Company[];
  weeklyTarget: number | null;
  onSelectApplication?: (app: Application) => void;
  onClose: () => void;
}

function VelocityExpandedModal({ apps, companies, weeklyTarget, onSelectApplication, onClose }: VelocityExpandedModalProps) {
  const axisWidth = 30;

  const appliedApps = useMemo(() => apps.filter((a) => a.dateApplied), [apps]);
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const earliest = useMemo(() => {
    const times = appliedApps
      .map((a) => new Date(a.dateApplied).getTime())
      .filter((t) => !Number.isNaN(t));
    return times.length ? new Date(Math.min(...times)) : null;
  }, [appliedApps]);

  /** Default window: the past 6 months, or the first application — whichever starts later. */
  const defaultFrom = useMemo(() => {
    const sixMonthsAgo = subtractMonths(today, 6);
    return earliest && earliest.getTime() > sixMonthsAgo.getTime() ? earliest : sixMonthsAgo;
  }, [today, earliest]);

  const [preset, setPreset] = useState<RangePreset>("6m");
  const [customFrom, setCustomFrom] = useState<string | null>(null);
  const [customTo, setCustomTo] = useState<string | null>(null);
  const [selectedStart, setSelectedStart] = useState<number | null>(null);
  const isCustom = customFrom != null || customTo != null;

  const presetFrom = useMemo(() => {
    if (preset === "3m") return subtractMonths(today, 3);
    if (preset === "1y") return subtractMonths(today, 12);
    if (preset === "all") return earliest ?? subtractMonths(today, 6);
    return defaultFrom;
  }, [preset, today, earliest, defaultFrom]);

  const from = useMemo(
    () => (customFrom ? new Date(`${customFrom}T00:00:00`) : presetFrom),
    [customFrom, presetFrom]
  );
  const to = useMemo(() => (customTo ? new Date(`${customTo}T00:00:00`) : today), [customTo, today]);

  const spanDays = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86_400_000));
  const unit: BucketUnit = spanDays > 100 ? "month" : "week";

  const buckets = useMemo(
    () => bucketItemsByPeriod(appliedApps, (a) => a.dateApplied, from, to, unit),
    [appliedApps, from, to, unit]
  );
  // A selection whose bar falls outside a newly-chosen range simply resolves to null here,
  // which shows the sidebar's empty state — no need to clear the stored start.
  const selectedBucket =
    selectedStart != null ? (buckets.find((b) => b.start.getTime() === selectedStart) ?? null) : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // The goal is per-week; when bars are monthly, scale it up so the line still means something.
  const targetPerBucket =
    weeklyTarget != null && weeklyTarget > 0
      ? unit === "month"
        ? Math.round(weeklyTarget * (52 / 12))
        : weeklyTarget
      : null;
  const dataMax = Math.max(0, targetPerBucket ?? 0, ...buckets.map((b) => b.items.length));
  const axisMax = velocityAxisMax(dataMax);
  const ticks = velocityTicks(axisMax);

  const applyPreset = (p: RangePreset) => {
    setPreset(p);
    setCustomFrom(null);
    setCustomTo(null);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "var(--bg-surface)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 14px 14px 24px",
          borderBottom: "1px solid var(--border-default)",
          flexShrink: 0,
        }}
      >
        <h3 style={{ font: "var(--text-heading-m)", margin: 0, color: "var(--text-primary)" }}>Application velocity</h3>
        <IconButton
          icon={<span style={{ fontSize: 15, lineHeight: 1 }}>✕</span>}
          aria-label="Close expanded chart"
          variant="ghost"
          size="sm"
          onClick={onClose}
        />
      </div>

      <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", padding: "20px 24px", overflow: "auto" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 16, flexShrink: 0 }}>
            <div
              style={{
                display: "inline-flex",
                gap: 2,
                padding: 3,
                background: "var(--bg-surface-sunken)",
                borderRadius: "var(--radius-s)",
              }}
            >
              {(Object.keys(PRESET_LABELS) as RangePreset[]).map((p) => (
                <RangePresetButton key={p} active={!isCustom && preset === p} onClick={() => applyPreset(p)}>
                  {PRESET_LABELS[p]}
                </RangePresetButton>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
              <div style={{ width: 150 }}>
                <Input
                  type="date"
                  size="sm"
                  label="From"
                  value={toDateInputString(from)}
                  onChange={(v) => setCustomFrom(v || null)}
                />
              </div>
              <div style={{ width: 150 }}>
                <Input
                  type="date"
                  size="sm"
                  label="To"
                  value={toDateInputString(to)}
                  onChange={(v) => setCustomTo(v || null)}
                />
              </div>
            </div>
          </div>

          {buckets.length === 0 ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                font: "13px var(--font-body)",
                color: "var(--text-tertiary)",
              }}
            >
              No applications in this range.
            </div>
          ) : (
            <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", paddingTop: 20 }}>
              <div style={{ flex: 1, minHeight: 260, display: "flex", flexDirection: "column" }}>
                <VelocityPlot
                  ticks={ticks}
                  axisMax={axisMax}
                  height="100%"
                  axisWidth={axisWidth}
                  target={targetPerBucket}
                  targetLabel={
                    targetPerBucket != null ? `Target ${targetPerBucket}/${unit === "month" ? "mo" : "wk"}` : ""
                  }
                >
                  {buckets.map((b) => (
                    <ExpandedBar
                      key={b.start.getTime()}
                      bucket={b}
                      axisMax={axisMax}
                      selected={selectedStart === b.start.getTime()}
                      onSelect={() => setSelectedStart(b.start.getTime())}
                    />
                  ))}
                </VelocityPlot>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 10, paddingLeft: axisWidth, flexShrink: 0 }}>
                {buckets.map((b) => (
                  <div
                    key={b.start.getTime()}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      textAlign: "center",
                      font: `${b.items.length > 0 ? 500 : 400} 11px var(--font-mono)`,
                      color: b.items.length > 0 ? "var(--text-primary)" : "var(--text-tertiary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {b.label}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            width: 340,
            flexShrink: 0,
            borderLeft: "1px solid var(--border-default)",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <ExpandedSidebar
            bucket={selectedBucket}
            unit={unit}
            companies={companies}
            onSelectApplication={onSelectApplication}
          />
        </div>
      </div>
    </div>
  );
}

interface ExpandedBarProps {
  bucket: PeriodItemBucket<Application>;
  axisMax: number;
  selected: boolean;
  onSelect: () => void;
}

/** A clickable bar: hover states signal it opens the sidebar; the selected bar keeps a ring. */
function ExpandedBar({ bucket, axisMax, selected, onSelect }: ExpandedBarProps) {
  const [hover, setHover] = useState(false);
  const count = bucket.items.length;
  const pct = count / axisMax;

  if (count === 0) {
    return (
      <div style={{ flex: 1, display: "flex", justifyContent: "center", height: "100%" }}>
        <div
          style={{
            width: "100%",
            maxWidth: 36,
            alignSelf: "flex-end",
            height: `${pct * 100}%`,
            minHeight: 1,
            background: "var(--ink-100)",
            borderRadius: "8px 8px 3px 3px",
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", justifyContent: "center", height: "100%" }}>
      <button
        type="button"
        onClick={onSelect}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        aria-label={`${count} application${count === 1 ? "" : "s"} — ${bucket.label}`}
        aria-pressed={selected}
        style={{
          width: "100%",
          maxWidth: 36,
          alignSelf: "flex-end",
          height: `${pct * 100}%`,
          minHeight: 3,
          padding: 0,
          border: "none",
          cursor: "pointer",
          background: selected ? "var(--blue-700)" : hover ? "var(--blue-600)" : "var(--blue-500)",
          boxShadow: selected
            ? "0 0 0 3px var(--blue-300)"
            : hover
              ? "0 0 0 3px var(--blue-100)"
              : "none",
          borderRadius: "8px 8px 3px 3px",
          transition:
            "background var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard)",
        }}
      />
    </div>
  );
}

interface ExpandedSidebarProps {
  bucket: PeriodItemBucket<Application> | null;
  unit: BucketUnit;
  companies: Company[];
  onSelectApplication?: (app: Application) => void;
}

function ExpandedSidebar({ bucket, unit, companies, onSelectApplication }: ExpandedSidebarProps) {
  const periodNoun = unit === "month" ? "month" : "week";

  if (!bucket) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <p style={{ font: "13px var(--font-body)", color: "var(--text-tertiary)", textAlign: "center", maxWidth: 220, lineHeight: 1.5 }}>
          Select a bar to see the applications from that {periodNoun}.
        </p>
      </div>
    );
  }

  const sortedApps = [...bucket.items].sort(
    (a, b) => new Date(a.dateApplied).getTime() - new Date(b.dateApplied).getTime()
  );
  const periodLabel =
    unit === "week"
      ? weekRangeLabel(bucket.start)
      : bucket.start.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-default)", flexShrink: 0 }}>
        <div style={{ font: "700 15px var(--font-display)", letterSpacing: "-0.01em", color: "var(--text-primary)" }}>
          {periodLabel}
        </div>
        <div style={{ font: "var(--text-caption)", color: "var(--text-secondary)", marginTop: 3 }}>
          {sortedApps.length} application{sortedApps.length === 1 ? "" : "s"}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>
        {sortedApps.length === 0 ? (
          <p style={{ font: "13px var(--font-body)", color: "var(--text-tertiary)", textAlign: "center", padding: "24px 12px" }}>
            No applications this {periodNoun}.
          </p>
        ) : (
          sortedApps.map((app) => (
            <SidebarAppRow
              key={app.id}
              app={app}
              company={companyName(app.companyId, companies)}
              onSelect={onSelectApplication ? () => onSelectApplication(app) : undefined}
            />
          ))
        )}
      </div>
    </>
  );
}

function SidebarAppRow({ app, company, onSelect }: { app: Application; company: string; onSelect?: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!onSelect}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        padding: "8px",
        border: "none",
        borderRadius: "var(--radius-s)",
        background: hover && onSelect ? "var(--bg-surface-hover)" : "transparent",
        cursor: onSelect ? "pointer" : "default",
        textAlign: "left",
        transition: "background var(--duration-fast) var(--ease-standard)",
      }}
    >
      <span style={{ fontSize: 17, flexShrink: 0, lineHeight: 1 }}>{app.logo}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: "block",
            font: "600 13px var(--font-body)",
            color: "var(--text-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {app.role}
        </span>
        <span
          style={{
            display: "block",
            font: "var(--text-body-s)",
            color: "var(--text-tertiary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {company}
        </span>
      </span>
      <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
        <StatusTag status={app.status} />
        <span style={{ font: "var(--text-caption)", color: "var(--text-tertiary)" }}>{app.dateApplied}</span>
      </span>
    </button>
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
  onSelectApplication?: (app: Application) => void;
}

export function DashboardView({ apps, companies, goals, networkingEvents, onSelectApplication }: DashboardViewProps) {
  const submittedApps = apps.filter((a) => a.status !== "todo");
  const tailoredRate = rateOf(submittedApps.filter((a) => a.resumeType === "tailored"));
  const untailoredRate = rateOf(submittedApps.filter((a) => a.resumeType === "untailored"));
  const withCoverLetterRate = rateOf(submittedApps.filter((a) => a.coverLetterSubmitted));
  const withoutCoverLetterRate = rateOf(submittedApps.filter((a) => !a.coverLetterSubmitted));

  const responseDaysList = apps.map(getResponseDays).filter((d): d is number => d != null);
  const avgResponseDays = responseDaysList.length
    ? Math.round(responseDaysList.reduce((sum, d) => sum + d, 0) / responseDaysList.length)
    : null;

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
        <VelocityChart
          apps={apps}
          companies={companies}
          weeklyTarget={goals.applicationsPerWeekTarget}
          onSelectApplication={onSelectApplication}
        />
        <ChannelBreakdown channelBreakdown={channelBreakdown} />
      </div>

      <div>
        <h2 style={{ ...sectionHeadingStyle, marginBottom: CARD_HEADER_GAP }}>Pipeline performance</h2>
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
