import { useEffect, useState, type ReactNode } from "react";
import { Button, Card, IconButton, StatusTag, statusDotColor, TextLink } from "@/components/ds";
import { groupInterviewsByDate, resumeTypeLabels, statusLabels } from "@/lib/data";
import { StatusChangeDialog } from "./StatusChangeDialog";
import { LogInterviewDialog } from "./LogInterviewDialog";
import { LogFollowUpDialog } from "./LogFollowUpDialog";
import { EditApplicationDialog } from "./EditApplicationDialog";
import { FeedbackDialog } from "./FeedbackDialog";
import { formatSalaryRange, getSalaryMatch, salaryMatchColor, salaryMatchLabel } from "@/lib/salary";
import { formatLocation } from "@/lib/location";
import { companyName } from "@/lib/companies";
import { formatResponseTime } from "@/lib/responseTime";
import { getDaysSinceActivity } from "@/lib/funnel";
import { todayFormatted } from "@/lib/date";
import { isValidUrl } from "@/lib/validation";
import { markdownToSafeHtml } from "@/lib/richText";
import type { NewCompany, NewContact } from "@/lib/dataSource/types";
import type {
  Application,
  ApplicationStatus,
  Company,
  Contact,
  Feedback,
  FollowUp,
  Goals,
  Interview,
  NetworkingEvent,
} from "@/lib/types";

const rejectionStatuses: ApplicationStatus[] = ["rejected_no_interview", "rejected_after_interview"];

/** Open statuses where a long-silent application can still be marked "ghosted". */
const ghostableStatuses: ApplicationStatus[] = ["applied", "interviewing"];
/** No reply or activity for this many days on an open application suggests it's been ghosted. */
const GHOST_SUGGESTION_DAYS = 90;

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

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        font: "var(--text-caption)",
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--text-tertiary)",
        margin: "20px 0 12px",
      }}
    >
      {children}
    </div>
  );
}

function ExternalLinkIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ marginLeft: 5, verticalAlign: "-1px" }}
    >
      <path d="M6.5 3H3.5A1.5 1.5 0 0 0 2 4.5v8A1.5 1.5 0 0 0 3.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-3" />
      <path d="M10 2h4v4M13.5 2.5 7 9" />
    </svg>
  );
}

/** One row in the plain "Links & materials" list: an external link (href), an
 * in-app opener (onOpen), or a muted placeholder when there's nothing yet. */
function MaterialLink({ label, href, onOpen }: { label: string; href?: string; onOpen?: () => void }) {
  return (
    <div style={{ font: "var(--text-body-s)" }}>
      {href ? (
        <TextLink href={href} external>
          {label}
          <ExternalLinkIcon />
        </TextLink>
      ) : onOpen ? (
        <TextLink onClick={onOpen}>{label}</TextLink>
      ) : (
        <TextLink disabled>{label} — not added</TextLink>
      )}
    </div>
  );
}

/** Styles for the sanitized Markdown-rendered body, scoped to `.rich-text`. */
const RICH_TEXT_CSS = `
.rich-text { line-height: 1.55; }
.rich-text > :first-child { margin-top: 0; }
.rich-text > :last-child { margin-bottom: 0; }
.rich-text h1, .rich-text h2, .rich-text h3, .rich-text h4 {
  font-family: var(--font-display); color: var(--text-primary); margin: 16px 0 8px; line-height: 1.3;
}
.rich-text h1 { font-size: 17px; }
.rich-text h2 { font-size: 15px; }
.rich-text h3, .rich-text h4 { font-size: 13px; }
.rich-text p { margin: 0 0 10px; }
.rich-text ul, .rich-text ol { margin: 0 0 10px; padding-left: 22px; }
.rich-text li { margin: 2px 0; }
.rich-text strong { color: var(--text-primary); }
.rich-text a { color: var(--accent-primary); text-decoration: underline; }
.rich-text a:hover { color: var(--blue-700); }
.rich-text code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.92em; background: var(--bg-surface-sunken); padding: 1px 4px; border-radius: 4px; }
.rich-text pre { background: var(--bg-surface-sunken); padding: 10px 12px; border-radius: var(--radius-s); overflow-x: auto; }
.rich-text pre code { background: none; padding: 0; }
.rich-text blockquote { margin: 0 0 10px; padding-left: 12px; border-left: 3px solid var(--border-default); color: var(--text-tertiary); }
.rich-text hr { border: none; border-top: 1px solid var(--border-default); margin: 14px 0; }
`;

const FLYOUT_CSS = `
@keyframes rt-flyout-scrim { from { opacity: 0 } to { opacity: 1 } }
@keyframes rt-flyout-panel { from { transform: translateX(100%) } to { transform: translateX(0) } }
`;

/** Right-side flyout showing a stored Markdown field (job description, resume,
 * cover letter), rendered to sanitized HTML client-side (plain-text fallback on
 * first paint). Closes on scrim click or Escape. */
function RichTextFlyout({ title, text, onClose }: { title: string; text: string; onClose: () => void }) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    const render = () => setHtml(markdownToSafeHtml(text));
    render();
  }, [text]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        justifyContent: "flex-end",
        background: "oklch(20% 0.02 250 / 0.35)",
        animation: "rt-flyout-scrim var(--duration-fast) var(--ease-out)",
      }}
    >
      <style>{FLYOUT_CSS}</style>
      <style>{RICH_TEXT_CSS}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 520,
          maxWidth: "92vw",
          height: "100%",
          background: "var(--bg-surface)",
          boxShadow: "var(--shadow-l)",
          display: "flex",
          flexDirection: "column",
          animation: "rt-flyout-panel var(--duration-base) var(--ease-out)",
        }}
      >
        <div
          style={{
            padding: "18px 20px",
            borderBottom: "1px solid var(--border-default)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <h3 style={{ font: "var(--text-heading-m)", margin: 0, color: "var(--text-primary)" }}>{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: "none", border: "none", fontSize: 16, color: "var(--text-tertiary)", cursor: "pointer" }}
          >
            ✕
          </button>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 20 }}>
          {html != null ? (
            <div
              className="rich-text"
              style={{ font: "var(--text-body-s)", color: "var(--text-secondary)" }}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <div style={{ font: "var(--text-body-s)", color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>
              {text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ApplicationDetailViewProps {
  app: Application | null;
  contacts: Contact[];
  companies: Company[];
  networkingEvents: NetworkingEvent[];
  goals: Goals;
  interviewCategories: string[];
  onCreateInterviewCategory: (category: string) => void;
  onCreateContact: (contact: NewContact) => Promise<Contact>;
  onCreateCompany: (company: NewCompany) => Promise<Company>;
  onSelectContact: (contact: Contact) => void;
  onSelectCompany: (company: Company) => void;
  onBack: () => void;
  onChangeStatus: (appId: number, status: ApplicationStatus, at: string) => void;
  onLogInterview: (appId: number, interview: Omit<Interview, "id">) => void;
  onEditInterview: (appId: number, interviewId: number, updates: Omit<Interview, "id">) => void;
  onLogFollowUp: (appId: number, followUp: Omit<FollowUp, "id">) => void;
  onEditApplication: (updated: Application) => void;
  onRequestDelete: (app: Application) => void;
  onDeleteInterview: (appId: number, interviewId: number) => void;
  onDeleteFollowUp: (appId: number, followUpId: number) => void;
  onSaveFeedback: (appId: number, feedback: Feedback) => void;
  onLogNetworkingEvent: () => void;
  onEditNetworkingEvent: (event: NetworkingEvent) => void;
  onDeleteNetworkingEvent: (id: number) => void;
}

export function ApplicationDetailView({
  app,
  contacts,
  companies,
  networkingEvents,
  goals,
  interviewCategories,
  onCreateInterviewCategory,
  onCreateContact,
  onCreateCompany,
  onSelectContact,
  onSelectCompany,
  onBack,
  onChangeStatus,
  onLogInterview,
  onEditInterview,
  onLogFollowUp,
  onEditApplication,
  onRequestDelete,
  onDeleteInterview,
  onDeleteFollowUp,
  onSaveFeedback,
  onLogNetworkingEvent,
  onEditNetworkingEvent,
  onDeleteNetworkingEvent,
}: ApplicationDetailViewProps) {
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [interviewDialogOpen, setInterviewDialogOpen] = useState(false);
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null);
  const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(false);
  const [jobDescOpen, setJobDescOpen] = useState(false);
  const [coverLetterOpen, setCoverLetterOpen] = useState(false);

  if (!app) return null;

  const daysSinceActivity = getDaysSinceActivity(app);
  const suggestGhosted =
    ghostableStatuses.includes(app.status) &&
    daysSinceActivity !== null &&
    daysSinceActivity >= GHOST_SUGGESTION_DAYS;

  const linkedNetworkingEvents = networkingEvents
    .filter((e) => e.applicationId === app.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <>
    <div style={{ padding: "20px 32px 40px", overflow: "auto", flex: 1 }}>
      <TextLink onClick={onBack} style={{ font: "700 13px var(--font-body)", display: "inline-block", marginBottom: 16 }}>
        ← Back to applications
      </TextLink>
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
            <TextLink
              onClick={() => {
                const company = companies.find((c) => c.id === app.companyId);
                if (company) onSelectCompany(company);
              }}
              style={{ font: "var(--text-body-m)", marginTop: 2, display: "inline-block", width: "fit-content" }}
            >
              {companyName(app.companyId, companies)}
            </TextLink>
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
      {suggestGhosted && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
            padding: 16,
            marginBottom: 20,
            borderRadius: "var(--radius-m)",
            background: "var(--status-ghosted-bg)",
            border: "1px solid var(--purple-200)",
          }}
        >
          <div>
            <div style={{ font: "700 14px var(--font-display)", color: "var(--status-ghosted-fg)", marginBottom: 4 }}>
              No response in {daysSinceActivity} days
            </div>
            <div style={{ font: "var(--text-body-s)", color: "var(--text-secondary)" }}>
              This application hasn&rsquo;t had a reply or any activity in over {GHOST_SUGGESTION_DAYS} days. If the
              company has gone quiet, mark it as ghosted to move it out of your active pipeline.
            </div>
          </div>
          <div style={{ flexShrink: 0 }}>
            <Button variant="secondary" size="sm" onClick={() => onChangeStatus(app.id, "ghosted", todayFormatted())}>
              Mark as ghosted
            </Button>
          </div>
        </div>
      )}
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 20, flex: "2 1 0%", minWidth: 0 }}>
        <Card padding="md">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                paddingBottom: 18,
                borderBottom: "1px solid var(--border-default)",
              }}
            >
              <Field label="Date applied" value={app.dateApplied} />
              <Field label="Response time" value={formatResponseTime(app)} />
            </div>

            <SectionLabel>Role details</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
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
              <Field label="Resume type" value={resumeTypeLabels[app.resumeType]} />
              <Field
                label="Referral"
                value={
                  app.referral ? (
                    (() => {
                      const referrer = contacts.find((c) => c.id === app.referredByContactId);
                      return referrer ? (
                        <>
                          Yes —{" "}
                          <TextLink onClick={() => onSelectContact(referrer)}>{referrer.name}</TextLink>
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
            </div>

            <SectionLabel>Links &amp; materials</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <MaterialLink label="Job posting" href={app.link && isValidUrl(app.link) ? app.link : undefined} />
              <MaterialLink
                label="Job description"
                onOpen={app.jobDescription ? () => setJobDescOpen(true) : undefined}
              />
              <MaterialLink label="Resume" onOpen={app.resumeText ? () => setResumeOpen(true) : undefined} />
              <MaterialLink
                label="Cover letter"
                onOpen={app.coverLetterText ? () => setCoverLetterOpen(true) : undefined}
              />
            </div>

            {app.notes && (
              <div style={{ marginTop: 20, paddingTop: 18, borderTop: "1px solid var(--border-default)" }}>
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
          <Card padding="md">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ font: "700 15px var(--font-display)", color: "var(--text-primary)" }}>
                Interviews{app.interviews.length > 0 ? ` (${app.interviews.length})` : ""}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingInterview(null);
                  setInterviewDialogOpen(true);
                }}
              >
                + Log interview
              </Button>
            </div>
            {app.interviews.length === 0 && (
              <div style={{ font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>No interviews logged yet.</div>
            )}
            {groupInterviewsByDate(app.interviews).map((group, gi, groups) => (
              <div
                key={group.date + gi}
                style={{ padding: "10px 0", borderBottom: gi < groups.length - 1 ? "1px solid var(--border-default)" : "none" }}
              >
                {group.interviews.length > 1 && (
                  <div style={{ font: "700 12px var(--font-body)", color: "var(--text-tertiary)", marginBottom: 8 }}>
                    Interview day: {group.date}
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {group.interviews.map((iv) => (
                    <div key={iv.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ font: "700 13px var(--font-body)", color: "var(--text-primary)" }}>
                          {iv.type}
                          {iv.style && (
                            <span style={{ font: "var(--text-body-s)", color: "var(--text-tertiary)", fontWeight: 400 }}>
                              {" "}
                              · {iv.style}
                            </span>
                          )}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {group.interviews.length === 1 && (
                            <span style={{ font: "var(--text-caption)", color: "var(--text-tertiary)" }}>{iv.date}</span>
                          )}
                          <IconButton
                            aria-label="Edit interview"
                            icon={<span>✎</span>}
                            size="sm"
                            onClick={() => {
                              setEditingInterview(iv);
                              setInterviewDialogOpen(true);
                            }}
                          />
                          <IconButton
                            aria-label="Delete interview"
                            icon={<span>✕</span>}
                            size="sm"
                            onClick={() => onDeleteInterview(app.id, iv.id)}
                          />
                        </div>
                      </div>
                      {iv.categories && iv.categories.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                          {iv.categories.map((c) => (
                            <span
                              key={c}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                height: 22,
                                padding: "0 8px",
                                borderRadius: "var(--radius-pill)",
                                background: "var(--blue-100)",
                                color: "var(--blue-700)",
                                font: "var(--text-caption)",
                                fontWeight: 700,
                              }}
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      )}
                      {iv.questionsAsked && (
                        <div style={{ font: "var(--text-body-s)", color: "var(--text-secondary)", marginTop: 6 }}>
                          <span style={{ color: "var(--text-tertiary)" }}>Questions: </span>
                          {iv.questionsAsked}
                        </div>
                      )}
                      {iv.notes && (
                        <div style={{ font: "var(--text-body-s)", color: "var(--text-secondary)", marginTop: 4 }}>{iv.notes}</div>
                      )}
                    </div>
                  ))}
                </div>
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
                    <TextLink
                      disabled={!c}
                      onClick={() => c && onSelectContact(c)}
                      style={{ font: "700 13px var(--font-body)" }}
                    >
                      {c?.name ?? "Unknown contact"}
                    </TextLink>
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
        <Card padding="md">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ font: "700 15px var(--font-display)", color: "var(--text-primary)" }}>
              Networking{linkedNetworkingEvents.length > 0 ? ` (${linkedNetworkingEvents.length})` : ""}
            </div>
            <Button variant="ghost" size="sm" onClick={onLogNetworkingEvent}>
              + Log event
            </Button>
          </div>
          {linkedNetworkingEvents.length === 0 ? (
            <div style={{ font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>
              No networking activity linked to this application yet.
            </div>
          ) : (
            linkedNetworkingEvents.map((e, i) => (
              <div
                key={e.id}
                style={{
                  padding: "10px 0",
                  borderBottom: i < linkedNetworkingEvents.length - 1 ? "1px solid var(--border-default)" : "none",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ font: "700 13px var(--font-body)", color: "var(--text-primary)" }}>{e.type}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ font: "var(--text-caption)", color: "var(--text-tertiary)" }}>{e.date}</span>
                    <IconButton
                      aria-label="Edit networking event"
                      icon={<span>✎</span>}
                      size="sm"
                      onClick={() => onEditNetworkingEvent(e)}
                    />
                    <IconButton
                      aria-label="Delete networking event"
                      icon={<span>✕</span>}
                      size="sm"
                      onClick={() => onDeleteNetworkingEvent(e.id)}
                    />
                  </div>
                </div>
                {e.contactIds.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", columnGap: 8, rowGap: 2, marginTop: 4 }}>
                    {e.contactIds.map((id, ci) => {
                      const c = contacts.find((contact) => contact.id === id);
                      return (
                        <span key={id} style={{ font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>
                          <TextLink
                            disabled={!c}
                            onClick={() => c && onSelectContact(c)}
                            style={{ font: "700 13px var(--font-body)" }}
                          >
                            {c?.name ?? "Unknown contact"}
                          </TextLink>
                          {ci < e.contactIds.length - 1 ? "," : ""}
                        </span>
                      );
                    })}
                  </div>
                )}
                {e.notes && (
                  <div style={{ font: "var(--text-body-s)", color: "var(--text-secondary)", marginTop: 4 }}>{e.notes}</div>
                )}
              </div>
            ))
          )}
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
        interview={editingInterview ?? undefined}
        interviewCategories={interviewCategories}
        onCreateCategory={onCreateInterviewCategory}
        onClose={() => setInterviewDialogOpen(false)}
        onSave={(interview) => {
          if (editingInterview) onEditInterview(app.id, editingInterview.id, interview);
          else onLogInterview(app.id, interview);
          setInterviewDialogOpen(false);
        }}
      />
    )}
    {followUpDialogOpen && (
      <LogFollowUpDialog
        contacts={contacts}
        companies={companies}
        onCreateContact={onCreateContact}
        defaultCompanyId={String(app.companyId)}
        onClose={() => setFollowUpDialogOpen(false)}
        onSave={(followUp) => {
          onLogFollowUp(app.id, followUp);
          setFollowUpDialogOpen(false);
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
    {jobDescOpen && app.jobDescription && (
      <RichTextFlyout title="Job description" text={app.jobDescription} onClose={() => setJobDescOpen(false)} />
    )}
    {resumeOpen && app.resumeText && (
      <RichTextFlyout title="Resume" text={app.resumeText} onClose={() => setResumeOpen(false)} />
    )}
    {coverLetterOpen && app.coverLetterText && (
      <RichTextFlyout title="Cover letter" text={app.coverLetterText} onClose={() => setCoverLetterOpen(false)} />
    )}
    </>
  );
}
