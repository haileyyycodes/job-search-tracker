"use client";

import { Dialog, Button } from "@/components/ds";
import type { Application, Contact, NetworkingEvent } from "@/lib/types";

interface ConfirmDeleteContactDialogProps {
  contact: Contact;
  apps: Application[];
  networkingEvents: NetworkingEvent[];
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

/** Deleting never touches the referencing records — they just resolve to "Unknown contact" afterward. */
export function ConfirmDeleteContactDialog({
  contact,
  apps,
  networkingEvents,
  onClose,
  onConfirm,
}: ConfirmDeleteContactDialogProps) {
  const referralCount = apps.filter((a) => a.referredByContactId === contact.id).length;
  const followUpCount = apps.reduce((sum, a) => sum + a.followUps.filter((f) => f.contactId === contact.id).length, 0);
  const eventCount = networkingEvents.filter((e) => e.contactIds.includes(contact.id)).length;

  const parts = [
    referralCount > 0 ? pluralize(referralCount, "referral") : null,
    followUpCount > 0 ? pluralize(followUpCount, "follow-up") : null,
    eventCount > 0 ? pluralize(eventCount, "networking event") : null,
  ].filter((p): p is string => p !== null);

  const sentence =
    parts.length > 0
      ? ` They're linked to ${joinWithAnd(parts)} — those will show as an unknown contact. `
      : " ";

  return (
    <Dialog
      open
      title="Delete contact?"
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
        Delete <strong>{contact.name}</strong>?{sentence}This can&rsquo;t be undone.
      </div>
    </Dialog>
  );
}
