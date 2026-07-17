import { useState, type ReactNode } from "react";
import { Button, Card, IconButton, StatusTag, statusDotColor } from "@/components/ds";
import { statusLabels } from "@/lib/data";
import { StatusChangeDialog } from "./StatusChangeDialog";
import { LogInterviewDialog } from "./LogInterviewDialog";
import { LogFollowUpDialog } from "./LogFollowUpDialog";
import { AddTaskDialog } from "./AddTaskDialog";
import { EditApplicationDialog } from "./EditApplicationDialog";
import { FeedbackDialog } from "./FeedbackDialog";
import { formatSalaryRange, getSalaryMatch, salaryMatchColor, salaryMatchLabel } from "@/lib/salary";
import { formatLocation } from "@/lib/location";
import { companyName } from "@/lib/companies";
import { formatResponseTime } from "@/lib/responseTime";
import type {
  Application,
  ApplicationStatus,
  Company,
  Contact,
  Feedback,
  FollowUp,
  Goals,
  Interview,
  ReminderRule,
  Task,
} from "@/lib/types";

const rejectionStatuses: ApplicationStatus[] = ["rejected_no_interview", "rejected_after_interview"];

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
  contacts: Contact[];
  companies: Company[];
  goals: Goals;
  onCreateContact: (contact: Contact) => void;
  onCreateCompany: (company: Company) => void;
  onSelectContact: (contact: Contact) => void;
  onSelectCompany: (company: Company) => void;
  onBack: () => void;
  onDismissTask: (id: string) => void;
  onChangeStatus: (appId: string, status: ApplicationStatus, at: string) => void;
  onLogInterview: (appId: string, interview: Omit<Interview, "id">) => void;
  onLogFollowUp: (appId: string, followUp: Omit<FollowUp, "id">) => void;
  onAddTask: (appId: string, note: string, dueDate: string, reminderRule: ReminderRule) => void;
  onEditApplication: (updated: Application) => void;
  onRequestDelete: (app: Application) => void;
  onDeleteInterview: (appId: string, interviewId: string) => void;
  onDeleteFollowUp: (appId: string, followUpId: string) => void;
  onSaveFeedback: (appId: string, feedback: Feedback) => void;
}

export function ApplicationDetailView({
  app,
  tasks,
  contacts,
  companies,
  goals,
  onCreateContact,
  onCreateCompany,
  onSelectContact,
  onSelectCompany,
  onBack,
  onDismissTask,
  onChangeStatus,
  onLogInterview,
  onLogFollowUp,
  onAddTask,
  onEditApplication,
  onRequestDelete,
  onDeleteInterview,
  onDeleteFollowUp,
  onSaveFeedback,
}: ApplicationDetailViewProps) {
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [interviewDialogOpen, setInterviewDialogOpen] = useState(false);
  const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);

  if (!app) return null;
  const myTasks = tasks.filter((t) => t.applicationId === app.id);

  return (
    <>
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
            <div
              onClick={() => {
                const company = companies.find((c) => c.id === app.companyId);
                if (company) onSelectCompany(company);
              }}
              style={{
                font: "var(--text-body-m)",
                color: "var(--text-link)",
                marginTop: 2,
                cursor: "pointer",
                width: "fit-content",
              }}
            >
              {companyName(app.companyId, companies)}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <StatusTag status={app.status} />
          <Button variant="secondary" size="sm" onClick={() => setStatusDialogOpen(true)}>
            Change status
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setEditDialogOpen(true)}>
            Edit
          </Button>
          <Button variant="danger" size="sm" onClick={() => onRequestDelete(app)}>
            Delete
          </Button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 20, flex: "2 1 0%", minWidth: 0 }}>
        <Card padding="md">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Date applied" value={app.dateApplied} />
              <Field label="Response time" value={formatResponseTime(app)} />
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
              <Field
                label="Referral"
                value={
                  app.referral ? (
                    (() => {
                      const referrer = contacts.find((c) => c.id === app.referredByContactId);
                      return referrer ? (
                        <>
                          Yes —{" "}
                          <span
                            onClick={() => onSelectContact(referrer)}
                            style={{ color: "var(--text-link)", cursor: "pointer" }}
                          >
                            {referrer.name}
                          </span>
                        </>
                      ) : (
                        "Yes — Unknown contact"
                      );
                    })()
                  ) : (
                    "No"
                  )
                }
              />
              <Field
                label="Resume used"
                value={`resume_${companyName(app.companyId, companies).split(" ")[0].toLowerCase()}.pdf`}
              />
              <Field label="Location" value={formatLocation(app) || undefined} />
              <Field
                label="Salary band"
                value={
                  formatSalaryRange(app.salaryMin, app.salaryMax) ? (
                    (() => {
                      const match = getSalaryMatch(app, goals);
                      const color = salaryMatchColor(match);
                      const label = salaryMatchLabel(match);
                      return (
                        <span style={{ color }}>
                          {formatSalaryRange(app.salaryMin, app.salaryMax)}
                          {label ? ` — ${label}` : ""}
                        </span>
                      );
                    })()
                  ) : undefined
                }
              />
            </div>
            {app.notes && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border-default)" }}>
                <Field label="Notes" value={app.notes} />
              </div>
            )}
          </Card>
          {rejectionStatuses.includes(app.status) && (
            <Card padding="md">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ font: "700 15px var(--font-display)", color: "var(--text-primary)" }}>Feedback</div>
                <Button variant="ghost" size="sm" onClick={() => setFeedbackDialogOpen(true)}>
                  {app.feedback ? "Edit feedback" : "Add feedback"}
                </Button>
              </div>
              {app.feedback ? (
                <>
                  <div style={{ font: "var(--text-body-s)", color: "var(--text-secondary)" }}>{app.feedback.text}</div>
                  <div style={{ font: "var(--text-caption)", color: "var(--text-tertiary)", marginTop: 8 }}>
                    Received {app.feedback.date}
                  </div>
                </>
              ) : (
                <div style={{ font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>No feedback yet.</div>
              )}
            </Card>
          )}
          {app.jobDescription && (
            <Card padding="md">
              <div style={{ font: "700 15px var(--font-display)", color: "var(--text-primary)", marginBottom: 14 }}>
                Job description
              </div>
              <div style={{ font: "var(--text-body-s)", color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>
                {app.jobDescription}
              </div>
            </Card>
          )}
          <Card padding="md">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ font: "700 15px var(--font-display)", color: "var(--text-primary)" }}>Interviews</div>
              <Button variant="ghost" size="sm" onClick={() => setInterviewDialogOpen(true)}>
                + Log interview
              </Button>
            </div>
            {app.interviews.length === 0 && (
              <div style={{ font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>No interviews logged yet.</div>
            )}
            {app.interviews.map((iv, i) => (
              <div
                key={iv.id ?? i}
                style={{ padding: "10px 0", borderBottom: i < app.interviews.length - 1 ? "1px solid var(--border-default)" : "none" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ font: "700 13px var(--font-body)", color: "var(--text-primary)" }}>{iv.type}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ font: "var(--text-caption)", color: "var(--text-tertiary)" }}>{iv.date}</span>
                    {iv.id && (
                      <IconButton
                        aria-label="Delete interview"
                        icon={<span>✕</span>}
                        size="sm"
                        onClick={() => onDeleteInterview(app.id, iv.id)}
                      />
                    )}
                  </div>
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
              <Button variant="ghost" size="sm" onClick={() => setFollowUpDialogOpen(true)}>
                + Log follow-up
              </Button>
            </div>
            {app.followUps.length === 0 && (
              <div style={{ font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>No follow-ups logged yet.</div>
            )}
            {app.followUps.map((f, i) => {
              const c = contacts.find((contact) => contact.id === f.contactId);
              return (
                <div
                  key={f.id ?? i}
                  style={{ padding: "10px 0", borderBottom: i < app.followUps.length - 1 ? "1px solid var(--border-default)" : "none" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span
                      onClick={() => c && onSelectContact(c)}
                      style={{
                        font: "700 13px var(--font-body)",
                        color: c ? "var(--text-link)" : "var(--text-primary)",
                        cursor: c ? "pointer" : "default",
                      }}
                    >
                      {c?.name ?? "Unknown contact"}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ font: "var(--text-caption)", color: "var(--text-tertiary)" }}>{f.date}</span>
                      {f.id && (
                        <IconButton
                          aria-label="Delete follow-up"
                          icon={<span>✕</span>}
                          size="sm"
                          onClick={() => onDeleteFollowUp(app.id, f.id)}
                        />
                      )}
                    </div>
                  </div>
                  {(c?.email || c?.phone) && (
                    <div style={{ font: "var(--text-mono-s)", color: "var(--text-tertiary)" }}>
                      {[c?.email, c?.phone].filter(Boolean).join(" · ")}
                    </div>
                  )}
                  {f.notes && (
                    <div style={{ font: "var(--text-body-s)", color: "var(--text-secondary)", marginTop: 4 }}>{f.notes}</div>
                  )}
                </div>
              );
            })}
          </Card>
          <Card padding="md">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ font: "700 15px var(--font-display)", color: "var(--text-primary)" }}>Open follow-up tasks</div>
              <Button variant="ghost" size="sm" onClick={() => setTaskDialogOpen(true)}>
                + Add task
              </Button>
            </div>
            {myTasks.length === 0 && (
              <div style={{ font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>No follow-up tasks yet.</div>
            )}
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
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20, flex: "1 1 0%", minWidth: 0 }}>
        <Card padding="md">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ font: "700 15px var(--font-display)", color: "var(--text-primary)" }}>Status history</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {app.statusHistory.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 12 }}>
                <div style={{ position: "relative", width: 8 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: statusDotColor(s.status),
                      marginTop: 4,
                      position: "relative",
                      zIndex: 1,
                    }}
                  />
                  {i < app.statusHistory.length - 1 && (
                    <div
                      style={{
                        position: "absolute",
                        top: 12,
                        bottom: -8,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: 1,
                        background: "var(--border-default)",
                      }}
                    />
                  )}
                </div>
                <div style={{ paddingBottom: 14 }}>
                  <div style={{ font: "700 13px var(--font-body)", color: "var(--text-primary)" }}>
                    {statusLabels[s.status]}
                  </div>
                  <div style={{ font: "var(--text-caption)", color: "var(--text-tertiary)" }}>{s.at}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      </div>
    </div>
    {statusDialogOpen && (
      <StatusChangeDialog
        currentStatus={app.status}
        onClose={() => setStatusDialogOpen(false)}
        onSave={(status, at) => {
          onChangeStatus(app.id, status, at);
          setStatusDialogOpen(false);
        }}
      />
    )}
    {interviewDialogOpen && (
      <LogInterviewDialog
        onClose={() => setInterviewDialogOpen(false)}
        onSave={(interview) => {
          onLogInterview(app.id, interview);
          setInterviewDialogOpen(false);
        }}
      />
    )}
    {followUpDialogOpen && (
      <LogFollowUpDialog
        contacts={contacts}
        companies={companies}
        onCreateContact={onCreateContact}
        defaultCompanyId={app.companyId}
        onClose={() => setFollowUpDialogOpen(false)}
        onSave={(followUp) => {
          onLogFollowUp(app.id, followUp);
          setFollowUpDialogOpen(false);
        }}
      />
    )}
    {taskDialogOpen && (
      <AddTaskDialog
        dateApplied={app.dateApplied}
        onClose={() => setTaskDialogOpen(false)}
        onSave={(note, dueDate, reminderRule) => {
          onAddTask(app.id, note, dueDate, reminderRule);
          setTaskDialogOpen(false);
        }}
      />
    )}
    {editDialogOpen && (
      <EditApplicationDialog
        app={app}
        contacts={contacts}
        onCreateContact={onCreateContact}
        companies={companies}
        onCreateCompany={onCreateCompany}
        onClose={() => setEditDialogOpen(false)}
        onSave={(updated) => {
          onEditApplication(updated);
          setEditDialogOpen(false);
        }}
      />
    )}
    {feedbackDialogOpen && (
      <FeedbackDialog
        feedback={app.feedback}
        onClose={() => setFeedbackDialogOpen(false)}
        onSave={(feedback) => {
          onSaveFeedback(app.id, feedback);
          setFeedbackDialogOpen(false);
        }}
      />
    )}
    </>
  );
}
