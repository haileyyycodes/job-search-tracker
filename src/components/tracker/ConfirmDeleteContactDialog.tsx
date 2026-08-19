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

/**
 * FollowUp.contactId is required, so a follow-up still pointing at this contact blocks the
 * delete outright (same as company deletion). Referrals and networking-event attendance are
 * optional links, so those just degrade to "Unknown contact" and don't block anything.
 */
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

  if (followUpCount > 0) {
    return (
      <Dialog
        open
        title="Can't delete this contact"
        onClose={onClose}
        footer={
          <Button size="sm" onClick={onClose}>
            Close
          </Button>
        }
      >
        <div style={{ font: "var(--text-body-s)", color: "var(--text-secondary)" }}>
          <strong>{contact.name}</strong> is linked to {pluralize(followUpCount, "follow-up")}. Delete or reassign{" "}
          {followUpCount === 1 ? "it" : "those"} first, then you can delete this contact.
        </div>
      </Dialog>
    );
  }

  const parts = [
    referralCount > 0 ? pluralize(referralCount, "referral") : null,
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
