"use client";

import { Dialog, Button } from "@/components/ds";
import type { Interview } from "@/lib/types";

interface ConfirmDeleteInterviewDialogProps {
  interview: Interview;
  onClose: () => void;
  onConfirm: () => void;
}

/** Interviews stand alone (no foreign keys), so deleting one never cascades — just confirm. */
export function ConfirmDeleteInterviewDialog({ interview, onClose, onConfirm }: ConfirmDeleteInterviewDialogProps) {
  return (
    <Dialog
      open
      title="Delete interview?"
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
        Delete this <strong>{interview.type}</strong> interview from <strong>{interview.date}</strong>? Its notes and
        questions will be lost. This can&rsquo;t be undone.
      </div>
    </Dialog>
  );
}
