"use client";

import { Dialog, Button } from "@/components/ds";
import type { Application, Company, Contact } from "@/lib/types";

interface ConfirmDeleteCompanyDialogProps {
  company: Company;
  apps: Application[];
  contacts: Contact[];
  onClose: () => void;
  onConfirm: () => void;
}

function joinWithAnd(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? "";
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

function pluralize(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

/**
 * Unlike every other delete in this app, a Company can't be deleted while anything still
 * references it — Application.companyId is a required field, so a dangling reference would
 * have nowhere sensible to resolve to (unlike an optional FK, which just degrades to "Unknown").
 */
export function ConfirmDeleteCompanyDialog({ company, apps, contacts, onClose, onConfirm }: ConfirmDeleteCompanyDialogProps) {
  const linkedApps = apps.filter((a) => a.companyId === company.id);
  const linkedContacts = contacts.filter((c) => c.companyId === company.id);

  const parts = [
    linkedApps.length > 0 ? pluralize(linkedApps.length, "application") : null,
    linkedContacts.length > 0 ? pluralize(linkedContacts.length, "contact") : null,
  ].filter((p): p is string => p !== null);

  if (parts.length > 0) {
    return (
      <Dialog open title="Can't delete this company" onClose={onClose} footer={<Button size="sm" onClick={onClose}>Close</Button>}>
        <div style={{ font: "var(--text-body-s)", color: "var(--text-secondary)" }}>
          <strong>{company.name}</strong> is linked to {joinWithAnd(parts)}. Reassign or remove those first, then you can
          delete this company.
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog
      open
      title="Delete company?"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={onConfirm}>
            Delete
          </Button>
        </>
      }
    >
      <div style={{ font: "var(--text-body-s)", color: "var(--text-secondary)" }}>
        Delete <strong>{company.name}</strong>? This can&rsquo;t be undone.
      </div>
    </Dialog>
  );
}
