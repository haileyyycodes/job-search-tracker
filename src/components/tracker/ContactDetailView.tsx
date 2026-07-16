"use client";

import { useState, type ReactNode } from "react";
import { Button, Card, IconButton } from "@/components/ds";
import { EditContactDialog } from "./EditContactDialog";
import { companyName } from "@/lib/companies";
import type { Application, Company, Contact, NetworkingEvent } from "@/lib/types";

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

interface ContactDetailViewProps {
  contact: Contact | null;
  apps: Application[];
  contacts: Contact[];
  companies: Company[];
  networkingEvents: NetworkingEvent[];
  onBack: () => void;
  onEditContact: (updated: Contact) => void;
  onCreateCompany: (company: Company) => void;
  onRequestDelete: (contact: Contact) => void;
  onSelectApp: (app: Application) => void;
  onSelectContact: (contact: Contact) => void;
  onSelectCompany: (company: Company) => void;
  onDeleteNetworkingEvent: (id: string) => void;
  onOpenLogNetworkingEvent: (initialContactId: string) => void;
}

export function ContactDetailView({
  contact,
  apps,
  contacts,
  companies,
  networkingEvents,
  onBack,
  onEditContact,
  onCreateCompany,
  onRequestDelete,
  onSelectApp,
  onSelectContact,
  onSelectCompany,
  onDeleteNetworkingEvent,
  onOpenLogNetworkingEvent,
}: ContactDetailViewProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  if (!contact) return null;

  const referredApps = apps.filter((a) => a.referredByContactId === contact.id);
  const followUps = apps.flatMap((a) =>
    a.followUps.filter((f) => f.contactId === contact.id).map((f) => ({ ...f, app: a }))
  );
  const events = networkingEvents.filter((e) => e.contactIds.includes(contact.id));

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
          ← Back to contacts
        </button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "var(--blue-100)",
                color: "var(--blue-700)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                font: "700 20px var(--font-display)",
                flexShrink: 0,
              }}
            >
              {contact.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 style={{ font: "var(--text-heading-l)", margin: 0, color: "var(--text-primary)" }}>{contact.name}</h1>
              {(contact.companyId || contact.role) && (
                <div style={{ font: "var(--text-body-m)", color: "var(--text-secondary)", marginTop: 2 }}>
                  {contact.role}
                  {contact.role && contact.companyId && " at "}
                  {contact.companyId && (
                    <span
                      onClick={() => {
                        const company = companies.find((c) => c.id === contact.companyId);
                        if (company) onSelectCompany(company);
                      }}
                      style={{ color: "var(--text-link)", cursor: "pointer" }}
                    >
                      {companyName(contact.companyId, companies)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Button variant="secondary" size="sm" onClick={() => setEditDialogOpen(true)}>
              Edit
            </Button>
            <Button variant="danger" size="sm" onClick={() => onRequestDelete(contact)}>
              Delete
            </Button>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card padding="md">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Email" value={contact.email} />
              <Field label="Phone" value={contact.phone} />
              <Field
                label="LinkedIn"
                value={
                  contact.linkedInUrl ? (
                    <a href={contact.linkedInUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-link)" }}>
                      View profile
                    </a>
                  ) : undefined
                }
              />
              <Field
                label="Website"
                value={
                  contact.website ? (
                    <a href={contact.website} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-link)" }}>
                      {contact.website}
                    </a>
                  ) : undefined
                }
              />
            </div>
            {contact.notes && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border-default)" }}>
                <Field label="Notes" value={contact.notes} />
              </div>
            )}
          </Card>

          <Card padding="md">
            <div style={{ font: "700 15px var(--font-display)", color: "var(--text-primary)", marginBottom: 14 }}>
              Applications referred
            </div>
            {referredApps.length === 0 && (
              <div style={{ font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>No referrals yet.</div>
            )}
            {referredApps.map((a, i) => (
              <div
                key={a.id}
                onClick={() => onSelectApp(a)}
                style={{
                  padding: "10px 0",
                  borderBottom: i < referredApps.length - 1 ? "1px solid var(--border-default)" : "none",
                  cursor: "pointer",
                }}
              >
                <span style={{ font: "700 13px var(--font-body)", color: "var(--text-primary)" }}>{a.role}</span>
                <span style={{ font: "var(--text-caption)", color: "var(--text-tertiary)" }}>{` — ${companyName(a.companyId, companies)}`}</span>
              </div>
            ))}
          </Card>

          <Card padding="md">
            <div style={{ font: "700 15px var(--font-display)", color: "var(--text-primary)", marginBottom: 14 }}>
              Follow-ups
            </div>
            {followUps.length === 0 && (
              <div style={{ font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>No follow-ups yet.</div>
            )}
            {followUps.map((f, i) => (
              <div
                key={f.id}
                style={{ padding: "10px 0", borderBottom: i < followUps.length - 1 ? "1px solid var(--border-default)" : "none" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span
                    onClick={() => onSelectApp(f.app)}
                    style={{ font: "700 13px var(--font-body)", color: "var(--text-link)", cursor: "pointer" }}
                  >
                    {companyName(f.app.companyId, companies)} — {f.app.role}
                  </span>
                  <span style={{ font: "var(--text-caption)", color: "var(--text-tertiary)" }}>{f.date}</span>
                </div>
                {f.notes && (
                  <div style={{ font: "var(--text-body-s)", color: "var(--text-secondary)", marginTop: 4 }}>{f.notes}</div>
                )}
              </div>
            ))}
          </Card>

          <Card padding="md">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ font: "700 15px var(--font-display)", color: "var(--text-primary)" }}>Networking events</div>
              <Button variant="ghost" size="sm" onClick={() => onOpenLogNetworkingEvent(contact.id)}>
                + Log event
              </Button>
            </div>
            {events.length === 0 && (
              <div style={{ font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>No networking events yet.</div>
            )}
            {events.map((e, i) => {
              const others = e.contactIds.filter((id) => id !== contact.id).map((id) => contacts.find((c) => c.id === id));
              const linkedApp = e.applicationId ? apps.find((a) => a.id === e.applicationId) : undefined;
              return (
                <div
                  key={e.id}
                  style={{ padding: "10px 0", borderBottom: i < events.length - 1 ? "1px solid var(--border-default)" : "none" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ font: "700 13px var(--font-body)", color: "var(--text-primary)" }}>{e.type}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ font: "var(--text-caption)", color: "var(--text-tertiary)" }}>{e.date}</span>
                      <IconButton
                        aria-label="Delete networking event"
                        icon={<span>✕</span>}
                        size="sm"
                        onClick={() => onDeleteNetworkingEvent(e.id)}
                      />
                    </div>
                  </div>
                  {others.length > 0 && (
                    <div style={{ font: "var(--text-caption)", color: "var(--text-tertiary)" }}>
                      Also with{" "}
                      {others.map((other, oi) => (
                        <span key={other?.id ?? oi}>
                          {oi > 0 && ", "}
                          <span
                            onClick={() => other && onSelectContact(other)}
                            style={{ color: other ? "var(--text-link)" : "var(--text-tertiary)", cursor: other ? "pointer" : "default" }}
                          >
                            {other?.name ?? "Unknown contact"}
                          </span>
                        </span>
                      ))}
                    </div>
                  )}
                  {linkedApp && (
                    <div style={{ font: "var(--text-caption)", color: "var(--text-tertiary)" }}>
                      Re:{" "}
                      <span onClick={() => onSelectApp(linkedApp)} style={{ color: "var(--text-link)", cursor: "pointer" }}>
                        {companyName(linkedApp.companyId, companies)} — {linkedApp.role}
                      </span>
                    </div>
                  )}
                  {e.notes && (
                    <div style={{ font: "var(--text-body-s)", color: "var(--text-secondary)", marginTop: 4 }}>{e.notes}</div>
                  )}
                </div>
              );
            })}
          </Card>
        </div>
      </div>
      {editDialogOpen && (
        <EditContactDialog
          contact={contact}
          companies={companies}
          onCreateCompany={onCreateCompany}
          onClose={() => setEditDialogOpen(false)}
          onSave={(updated) => {
            onEditContact(updated);
            setEditDialogOpen(false);
          }}
        />
      )}
    </>
  );
}
