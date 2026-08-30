"use client";

import { useState, type ReactNode } from "react";
import { Button, Card, TextLink, ListRow } from "@/components/ds";
import { EditCompanyDialog } from "./EditCompanyDialog";
import { TargetStar } from "./TargetStar";
import { companyStatusLabels, companyStatusColor, displayedCompanyStatus, formatCompanyLocations } from "@/lib/companies";
import { isValidUrl } from "@/lib/validation";
import type { Application, Company, Contact } from "@/lib/types";

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

interface CompanyDetailViewProps {
  company: Company | null;
  apps: Application[];
  contacts: Contact[];
  onBack: () => void;
  onEditCompany: (updated: Company) => void;
  onRequestDelete: (company: Company) => void;
  onToggleTarget: (companyId: number) => void;
  onSelectApp: (app: Application) => void;
  onSelectContact: (contact: Contact) => void;
}

export function CompanyDetailView({
  company,
  apps,
  contacts,
  onBack,
  onEditCompany,
  onRequestDelete,
  onToggleTarget,
  onSelectApp,
  onSelectContact,
}: CompanyDetailViewProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  if (!company) return null;

  const shownStatus = displayedCompanyStatus(company);
  const linkedApps = apps.filter((a) => a.companyId === company.id);
  const linkedContacts = contacts.filter((c) => c.companyId === company.id);

  return (
    <>
      <div style={{ padding: "20px 32px 40px", overflow: "auto", flex: 1 }}>
        <TextLink onClick={onBack} style={{ font: "700 13px var(--font-body)", display: "inline-block", marginBottom: 16 }}>
          ← Back to companies
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
              {company.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h1 style={{ font: "var(--text-heading-l)", margin: 0, color: "var(--text-primary)" }}>{company.name}</h1>
                <TargetStar isTarget={company.isTarget} onToggle={() => onToggleTarget(company.id)} size={20} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                {company.industry && (
                  <span style={{ font: "var(--text-body-m)", color: "var(--text-secondary)" }}>{company.industry}</span>
                )}
                {shownStatus && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      height: 22,
                      padding: "0 8px",
                      borderRadius: "var(--radius-pill)",
                      background: "var(--ink-100)",
                      color: companyStatusColor(shownStatus),
                      font: "var(--text-caption)",
                      fontWeight: 700,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: companyStatusColor(shownStatus),
                        flexShrink: 0,
                      }}
                    />
                    {companyStatusLabels[shownStatus]}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Button variant="secondary" size="sm" onClick={() => setEditDialogOpen(true)}>
              Edit
            </Button>
            <Button variant="danger" size="sm" onClick={() => onRequestDelete(company)}>
              Delete
            </Button>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card padding="md">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Industry" value={company.industry} />
              <Field label="Locations" value={formatCompanyLocations(company) || undefined} />
              <Field
                label="Website"
                value={
                  company.website ? (
                    isValidUrl(company.website) ? (
                      <TextLink href={company.website} external>
                        {company.website}
                      </TextLink>
                    ) : (
                      company.website
                    )
                  ) : undefined
                }
              />
            </div>
            {company.notes && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border-default)" }}>
                <Field label="Notes" value={company.notes} />
              </div>
            )}
          </Card>

          <Card padding="md">
            <div style={{ font: "700 15px var(--font-display)", color: "var(--text-primary)", marginBottom: 14 }}>
              Applications
            </div>
            {linkedApps.length === 0 && (
              <div style={{ font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>No applications yet.</div>
            )}
            {linkedApps.map((a, i) => (
              <ListRow
                key={a.id}
                onClick={() => onSelectApp(a)}
                padding="10px 8px"
                divider={i < linkedApps.length - 1}
              >
                <span style={{ font: "700 13px var(--font-body)", color: "var(--text-link)" }}>{a.role}</span>
                <span style={{ font: "var(--text-caption)", color: "var(--text-tertiary)" }}>
                  {a.dateApplied ? ` — applied ${a.dateApplied}` : " — not yet applied"}
                </span>
              </ListRow>
            ))}
          </Card>

          <Card padding="md">
            <div style={{ font: "700 15px var(--font-display)", color: "var(--text-primary)", marginBottom: 14 }}>
              Contacts
            </div>
            {linkedContacts.length === 0 && (
              <div style={{ font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>No contacts yet.</div>
            )}
            {linkedContacts.map((c, i) => (
              <ListRow
                key={c.id}
                onClick={() => onSelectContact(c)}
                padding="10px 8px"
                divider={i < linkedContacts.length - 1}
              >
                <span style={{ font: "700 13px var(--font-body)", color: "var(--text-link)" }}>{c.name}</span>
                {c.role && <span style={{ font: "var(--text-caption)", color: "var(--text-tertiary)" }}>{` — ${c.role}`}</span>}
              </ListRow>
            ))}
          </Card>
        </div>
      </div>
      {editDialogOpen && (
        <EditCompanyDialog
          company={company}
          onClose={() => setEditDialogOpen(false)}
          onSave={(updated) => {
            onEditCompany(updated);
            setEditDialogOpen(false);
          }}
        />
      )}
    </>
  );
}
