import { useState } from "react";
import { Card } from "@/components/ds";
import { Button } from "@/components/ds";
import { StatusTag } from "@/components/ds";
import { statusOrder } from "@/lib/data";
import { daysUntil, isInCurrentCalendarWeek } from "@/lib/date";
import { GoalsEditDialog } from "./GoalsEditDialog";
import type { Application, Goals, Task } from "@/lib/types";

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
  goals: Goals;
  onDismissTask: (id: string) => void;
  onSelectApp: (app: Application) => void;
  onSaveGoals: (goals: Goals) => void;
}

const reachedInterview = (a: Application) => a.statusHistory.some((s) => s.status === "interviewing");
const rateOf = (list: Application[]) =>
  list.length ? Math.round((list.filter(reachedInterview).length / list.length) * 100) : 0;

export function DashboardView({ apps, tasks, goals, onDismissTask, onSelectApp, onSaveGoals }: DashboardViewProps) {
  const [goalsDialogOpen, setGoalsDialogOpen] = useState(false);
  const total = apps.length;
  const todoCount = apps.filter((a) => a.status === "todo").length;
  const submittedApps = apps.filter((a) => a.status !== "todo");
  const interviewedCount = submittedApps.filter(reachedInterview).length;
  const interviewRate = submittedApps.length ? Math.round((interviewedCount / submittedApps.length) * 100) : 0;
  const offerCount = apps.filter((a) => ["offer_extended", "offer_accepted", "offer_declined"].includes(a.status)).length;
  const referred = submittedApps.filter((a) => a.referral);
  const notReferred = submittedApps.filter((a) => !a.referral);
  const activeTasks = tasks
    .filter((t) => t.status === "active")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const salaryText = salaryGoalText(goals);
  const weeklyCount = apps.filter((a) => isInCurrentCalendarWeek(a.dateApplied)).length;
  const acceptedOfferDate = earliestAcceptedOfferDate(apps);
  const overdue = !acceptedOfferDate && goals.targetOfferDate != null && daysUntil(goals.targetOfferDate) < 0;

  return (
    <>
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
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
        <StatCard label="Applications to submit" value={todoCount} sub="Queued and ready to go" />
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
