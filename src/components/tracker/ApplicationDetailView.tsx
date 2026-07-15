import type { ReactNode } from "react";
import { Button, Card, StatusTag } from "@/components/ds";
import { statusLabels } from "@/lib/data";
import type { Application, Task } from "@/lib/types";

interface FieldProps {
  label: string;
  value?: ReactNode;
}

function Field({ label, value }: FieldProps) {
  return (
    <div>
      <div style={{ font: "var(--text-caption)", color: "var(--text-tertiary)", marginBottom: 2 }}>{label}</div>
      <div style={{ font: "var(--text-body-s)", fontWeight: 600, color: "var(--text-primary)" }}>{value || "—"}</div>
    </div>
  );
}

interface ApplicationDetailViewProps {
  app: Application | null;
  tasks: Task[];
  onBack: () => void;
  onDismissTask: (id: string) => void;
}

export function ApplicationDetailView({ app, tasks, onBack, onDismissTask }: ApplicationDetailViewProps) {
  if (!app) return null;
  const myTasks = tasks.filter((t) => t.applicationId === app.id);

  return (
    <div style={{ padding: "20px 32px 40px", overflow: "auto", flex: 1 }}>
      <button
        onClick={onBack}
        style={{
          background: "none",
          border: "none",
          color: "var(--text-link)",
          font: "700 13px var(--font-body)",
          cursor: "pointer",
          padding: 0,
          marginBottom: 16,
        }}
      >
        ← Back to applications
      </button>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "var(--radius-m)",
              background: "var(--blue-100)",
              color: "var(--blue-700)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              font: "700 20px var(--font-display)",
              flexShrink: 0,
            }}
          >
            {app.logo}
          </div>
          <div>
            <h1 style={{ font: "var(--text-heading-l)", margin: 0, color: "var(--text-primary)" }}>{app.role}</h1>
            <div style={{ font: "var(--text-body-m)", color: "var(--text-secondary)", marginTop: 2 }}>{app.company}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <StatusTag status={app.status} />
          <Button variant="secondary" size="sm">
            Edit
          </Button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, alignItems: "start" }}>
        <Card padding="md">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Date applied" value={app.dateApplied} />
              <Field
                label="Application link"
                value={
                  app.link ? (
                    <a href={app.link} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-link)" }}>
                      View posting
                    </a>
                  ) : (
                    "—"
                  )
                }
              />
              <Field label="Referral" value={app.referral ? `Yes — ${app.referredBy}` : "No"} />
              <Field label="Resume used" value={`resume_${app.company.split(" ")[0].toLowerCase()}.pdf`} />
            </div>
            {app.notes && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border-default)" }}>
                <Field label="Notes" value={app.notes} />
              </div>
            )}
          </Card>
          <Card padding="md">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ font: "700 15px var(--font-display)", color: "var(--text-primary)" }}>Status history</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {app.statusHistory.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 12, paddingBottom: 14 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--blue-500)", marginTop: 4 }} />
                    {i < app.statusHistory.length - 1 && (
                      <div style={{ width: 1, flex: 1, background: "var(--border-default)", marginTop: 2 }} />
                    )}
                  </div>
                  <div>
                    <div style={{ font: "700 13px var(--font-body)", color: "var(--text-primary)" }}>
                      {statusLabels[s.status]}
                    </div>
                    <div style={{ font: "var(--text-caption)", color: "var(--text-tertiary)" }}>{s.at}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card padding="md">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ font: "700 15px var(--font-display)", color: "var(--text-primary)" }}>Interviews</div>
              <Button variant="ghost" size="sm">
                + Log interview
              </Button>
            </div>
            {app.interviews.length === 0 && (
              <div style={{ font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>No interviews logged yet.</div>
            )}
            {app.interviews.map((iv, i) => (
              <div
                key={i}
                style={{ padding: "10px 0", borderBottom: i < app.interviews.length - 1 ? "1px solid var(--border-default)" : "none" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ font: "700 13px var(--font-body)", color: "var(--text-primary)" }}>{iv.type}</span>
                  <span style={{ font: "var(--text-caption)", color: "var(--text-tertiary)" }}>{iv.date}</span>
                </div>
                {iv.notes && (
                  <div style={{ font: "var(--text-body-s)", color: "var(--text-secondary)", marginTop: 4 }}>{iv.notes}</div>
                )}
              </div>
            ))}
          </Card>
          <Card padding="md">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ font: "700 15px var(--font-display)", color: "var(--text-primary)" }}>Follow-ups</div>
              <Button variant="ghost" size="sm">
                + Log follow-up
              </Button>
            </div>
            {app.followUps.length === 0 && (
              <div style={{ font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>No follow-ups logged yet.</div>
            )}
            {app.followUps.map((f, i) => (
              <div
                key={i}
                style={{ padding: "10px 0", borderBottom: i < app.followUps.length - 1 ? "1px solid var(--border-default)" : "none" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ font: "700 13px var(--font-body)", color: "var(--text-primary)" }}>{f.contact}</span>
                  <span style={{ font: "var(--text-caption)", color: "var(--text-tertiary)" }}>{f.date}</span>
                </div>
                <div style={{ font: "var(--text-mono-s)", color: "var(--text-tertiary)" }}>{f.info}</div>
                {f.notes && (
                  <div style={{ font: "var(--text-body-s)", color: "var(--text-secondary)", marginTop: 4 }}>{f.notes}</div>
                )}
              </div>
            ))}
          </Card>
          {myTasks.length > 0 && (
            <Card padding="md">
              <div style={{ font: "700 15px var(--font-display)", color: "var(--text-primary)", marginBottom: 14 }}>
                Open follow-up tasks
              </div>
              {myTasks.map((t) => (
                <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 10 }}>
                  <div>
                    <div style={{ font: "var(--text-body-s)", color: "var(--text-primary)" }}>{t.note}</div>
                    <div style={{ font: "var(--text-caption)", color: "var(--text-tertiary)" }}>
                      Due {t.dueDate} · {t.status}
                    </div>
                  </div>
                  {t.status === "active" && (
                    <Button size="sm" variant="secondary" onClick={() => onDismissTask(t.id)}>
                      Dismiss
                    </Button>
                  )}
                </div>
              ))}
            </Card>
          )}
      </div>
    </div>
  );
}
