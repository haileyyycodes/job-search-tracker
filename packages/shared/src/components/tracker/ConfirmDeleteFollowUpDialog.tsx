"use client";

import { Dialog, Button } from "@/components/ds";
import type { Contact, FollowUp } from "@/lib/types";

interface ConfirmDeleteFollowUpDialogProps {
  followUp: FollowUp;
  contact?: Contact;
  onClose: () => void;
  onConfirm: () => void;
}

/** Follow-ups stand alone (no foreign keys), so deleting one never cascades — just confirm. */
export function ConfirmDeleteFollowUpDialog({ followUp, contact, onClose, onConfirm }: ConfirmDeleteFollowUpDialogProps) {
  return (
    <Dialog
      open
      title="Delete follow-up?"
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
        Delete the follow-up with <strong>{contact?.name ?? "this contact"}</strong> from{" "}
        <strong>{followUp.date}</strong>? This can&rsquo;t be undone.
      </div>
    </Dialog>
  );
}
