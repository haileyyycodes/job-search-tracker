import { Card } from "@/components/ds";
import { Button } from "@/components/ds";
import { StatusTag } from "@/components/ds";
import { statusOrder } from "@/lib/data";
import type { Application, Task } from "@/lib/types";

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

interface DashboardViewProps {
  apps: Application[];
  tasks: Task[];
  onDismissTask: (id: string) => void;
  onSelectApp: (app: Application) => void;
}

const reachedInterview = (a: Application) => a.statusHistory.some((s) => s.status === "interviewing");
const rateOf = (list: Application[]) =>
  list.length ? Math.round((list.filter(reachedInterview).length / list.length) * 100) : 0;

export function DashboardView({ apps, tasks, onDismissTask, onSelectApp }: DashboardViewProps) {
  const total = apps.length;
  const interviewedCount = apps.filter(reachedInterview).length;
  const interviewRate = total ? Math.round((interviewedCount / total) * 100) : 0;
  const offerCount = apps.filter((a) => ["offer_extended", "offer_accepted", "offer_declined"].includes(a.status)).length;
  const referred = apps.filter((a) => a.referral);
  const notReferred = apps.filter((a) => !a.referral);
  const activeTasks = tasks
    .filter((t) => t.status === "active")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return (
    <div style={{ padding: "24px 32px 32px", overflow: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        <StatCard label="Interview rate" value={`${interviewRate}%`} sub={`${interviewedCount} of ${total} applications`} />
        <StatCard label="Job offers" value={offerCount} sub="Offer extended or later" />
        <StatCard
          label="Interview rate by referral"
          value={`${rateOf(referred)}% / ${rateOf(notReferred)}%`}
          sub="Referred vs. non-referred"
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16, alignItems: "start" }}>
        <Card padding="md">
          <div style={{ font: "700 15px var(--font-display)", color: "var(--text-primary)", marginBottom: 14 }}>
            Status breakdown
          </div>
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
        <Card padding="md">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ font: "700 15px var(--font-display)", color: "var(--text-primary)" }}>Pending follow-ups</div>
            <span style={{ font: "var(--text-caption)", color: "var(--text-tertiary)" }}>{activeTasks.length}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {activeTasks.length === 0 && (
              <div style={{ font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>No pending follow-ups.</div>
            )}
            {activeTasks.map((t) => {
              const app = apps.find((a) => a.id === t.applicationId);
              return (
                <div
                  key={t.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 10,
                    paddingBottom: 10,
                    borderBottom: "1px solid var(--border-default)",
                  }}
                >
                  <div style={{ minWidth: 0, cursor: "pointer" }} onClick={() => app && onSelectApp(app)}>
                    <div
                      style={{
                        font: "700 13px var(--font-body)",
                        color: "var(--text-primary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {app ? `${app.company} — ${app.role}` : "—"}
                    </div>
                    <div style={{ font: "var(--text-caption)", color: "var(--text-tertiary)" }}>
                      {t.note} · due {t.dueDate}
                    </div>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => onDismissTask(t.id)}>
                    Dismiss
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
