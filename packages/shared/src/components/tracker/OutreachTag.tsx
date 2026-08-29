import { OUTREACH_STATUS_META, type OutreachInfo } from "@/lib/outreach";

const TONE: Record<string, { bg: string; fg: string; dot: string }> = {
  danger: { bg: "var(--status-rejected-bg)", fg: "var(--status-rejected-fg)", dot: "var(--red-600)" },
  warn: { bg: "var(--status-interview-bg)", fg: "var(--status-interview-fg)", dot: "var(--yellow-600)" },
  ok: { bg: "var(--status-offer-bg)", fg: "var(--status-offer-fg)", dot: "var(--green-600)" },
  muted: { bg: "var(--status-saved-bg)", fg: "var(--status-saved-fg)", dot: "var(--ink-400)" },
};

interface OutreachTagProps {
  info: OutreachInfo;
  /** Override the default status label (e.g. "No touchpoints yet"). */
  label?: string;
}

/** Pill showing where a contact sits in its reach-out cycle, colored by urgency. */
export function OutreachTag({ info, label }: OutreachTagProps) {
  const meta = OUTREACH_STATUS_META[info.status];
  const tone = TONE[meta.tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 22,
        padding: "0 9px",
        borderRadius: "var(--radius-pill)",
        background: tone.bg,
        color: tone.fg,
        font: "var(--text-caption)",
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: tone.dot, flexShrink: 0 }} />
      {label ?? meta.label}
    </span>
  );
}
