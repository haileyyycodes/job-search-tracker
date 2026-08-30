"use client";

import { useState, type ReactNode } from "react";
import { Button, Card, IconButton, TextLink, ListRow } from "@/components/ds";
import { EditContactDialog } from "./EditContactDialog";
import { OutreachTag } from "./OutreachTag";
import { companyName } from "@/lib/companies";
import { isValidUrl } from "@/lib/validation";
import { RELATIONSHIP_TIERS, outreachInfo, outreachTiming } from "@/lib/outreach";
import type { NewCompany } from "@/lib/dataSource/types";
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
  onCreateCompany: (company: NewCompany) => Promise<Company>;
  onRequestDelete: (contact: Contact) => void;
  onSelectApp: (app: Application) => void;
  onSelectContact: (contact: Contact) => void;
  onSelectCompany: (company: Company) => void;
  onEditNetworkingEvent: (event: NetworkingEvent) => void;
  onDeleteNetworkingEvent: (id: number) => void;
  onOpenLogNetworkingEvent: (initialContactId: number) => void;
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
  onEditNetworkingEvent,
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
  const outreach = outreachInfo(contact, networkingEvents);
  const cadence = outreach.tier ? RELATIONSHIP_TIERS[outreach.tier] : null;

  return (
    <>
      <div style={{ padding: "20px 32px 40px", overflow: "auto", flex: 1 }}>
        <TextLink onClick={onBack} style={{ font: "700 13px var(--font-body)", display: "inline-block", marginBottom: 16 }}>
          ← Back to contacts
        </TextLink>
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
                    <TextLink
                      onClick={() => {
                        const company = companies.find((c) => c.id === contact.companyId);
                        if (company) onSelectCompany(company);
                      }}
                    >
                      {companyName(contact.companyId, companies)}
                    </TextLink>
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
                    isValidUrl(contact.linkedInUrl) ? (
                      <TextLink href={contact.linkedInUrl} external>
                        View profile
                      </TextLink>
                    ) : (
                      contact.linkedInUrl
                    )
                  ) : undefined
                }
              />
              <Field
                label="Website"
                value={
                  contact.website ? (
                    isValidUrl(contact.website) ? (
                      <TextLink href={contact.website} external>
                        {contact.website}
                      </TextLink>
                    ) : (
                      contact.website
                    )
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ font: "700 15px var(--font-display)", color: "var(--text-primary)" }}>Staying in touch</div>
              {outreach.status !== "untracked" && <OutreachTag info={outreach} />}
            </div>
            {cadence ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                  <Field label="Tier" value={`${cadence.label} · ${cadence.cadence}`} />
                  <Field label="Last contacted" value={outreach.lastContactedOn ?? "None yet"} />
                  <Field
                    label="Reach out by"
                    value={outreach.reachOutBy ? `${outreach.reachOutBy} (${outreachTiming(outreach)})` : outreachTiming(outreach)}
                  />
                </div>
                <p style={{ font: "var(--text-body-s)", color: "var(--text-secondary)", margin: "14px 0 0" }}>
                  {cadence.tip}
                </p>
              </>
            ) : (
              <div style={{ font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>
                No relationship tier set.{" "}
                {outreach.lastContactedOn
                  ? `Last contacted ${outreach.lastContactedOn}. `
                  : "No networking events logged yet. "}
                Edit this contact to set a tier and track how often to reach out.
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
              <ListRow
                key={a.id}
                onClick={() => onSelectApp(a)}
                padding="10px 8px"
                divider={i < referredApps.length - 1}
              >
                <span style={{ font: "700 13px var(--font-body)", color: "var(--text-link)" }}>{a.role}</span>
                <span style={{ font: "var(--text-caption)", color: "var(--text-tertiary)" }}>{` — ${companyName(a.companyId, companies)}`}</span>
              </ListRow>
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
                  <TextLink onClick={() => onSelectApp(f.app)} style={{ font: "700 13px var(--font-body)" }}>
                    {companyName(f.app.companyId, companies)} — {f.app.role}
                  </TextLink>
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
                  {others.length > 0 && (
                    <div style={{ font: "var(--text-caption)", color: "var(--text-tertiary)" }}>
                      Also with{" "}
                      {others.map((other, oi) => (
                        <span key={other?.id ?? oi}>
                          {oi > 0 && ", "}
                          <TextLink disabled={!other} onClick={() => other && onSelectContact(other)}>
                            {other?.name ?? "Unknown contact"}
                          </TextLink>
                        </span>
                      ))}
                    </div>
                  )}
                  {linkedApp && (
                    <div style={{ font: "var(--text-caption)", color: "var(--text-tertiary)" }}>
                      Re:{" "}
                      <TextLink onClick={() => onSelectApp(linkedApp)}>
                        {companyName(linkedApp.companyId, companies)} — {linkedApp.role}
                      </TextLink>
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
