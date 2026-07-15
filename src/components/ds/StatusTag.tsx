import type { ApplicationStatus } from "@/lib/types";

interface StatusConfig {
  fg: string;
  bg: string;
  dot: string;
  label: string;
}

const config: Record<ApplicationStatus, StatusConfig> = {
  applied: { fg: "var(--status-applied-fg)", bg: "var(--status-applied-bg)", dot: "var(--blue-600)", label: "Applied" },
  interviewing: { fg: "var(--status-interview-fg)", bg: "var(--status-interview-bg)", dot: "var(--yellow-600)", label: "Interviewing" },
  rejected_no_interview: { fg: "var(--status-rejected-fg)", bg: "var(--status-rejected-bg)", dot: "var(--red-600)", label: "Rejected" },
  rejected_after_interview: { fg: "var(--status-rejected-fg)", bg: "var(--status-rejected-bg)", dot: "var(--red-600)", label: "Rejected" },
  offer_extended: { fg: "var(--status-offer-fg)", bg: "var(--status-offer-bg)", dot: "var(--green-600)", label: "Offer extended" },
  offer_accepted: { fg: "var(--status-offer-fg)", bg: "var(--status-offer-bg)", dot: "var(--green-600)", label: "Offer accepted" },
  offer_declined: { fg: "var(--status-saved-fg)", bg: "var(--status-saved-bg)", dot: "var(--ink-500)", label: "Offer declined" },
  withdrawn: { fg: "var(--status-saved-fg)", bg: "var(--status-saved-bg)", dot: "var(--ink-500)", label: "Withdrawn" },
};

interface StatusTagProps {
  status: ApplicationStatus;
  label?: string;
}

export function StatusTag({ status, label }: StatusTagProps) {
  const c = config[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 24,
        padding: "0 10px",
        borderRadius: "var(--radius-pill)",
        background: c.bg,
        color: c.fg,
        font: "var(--text-caption)",
        fontWeight: 700,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot, flexShrink: 0 }} />
      {label || c.label}
    </span>
  );
}
