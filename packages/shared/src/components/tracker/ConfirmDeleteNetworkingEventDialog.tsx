"use client";

import { Dialog, Button } from "@/components/ds";
import type { NetworkingEvent } from "@/lib/types";

interface ConfirmDeleteNetworkingEventDialogProps {
  event: NetworkingEvent;
  onClose: () => void;
  onConfirm: () => void;
}

/** Networking events stand alone (no foreign keys), so deleting one never cascades — just confirm. */
export function ConfirmDeleteNetworkingEventDialog({ event, onClose, onConfirm }: ConfirmDeleteNetworkingEventDialogProps) {
  return (
    <Dialog
      open
      title="Delete networking event?"
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
        Delete this <strong>{event.type}</strong> event from <strong>{event.date}</strong>? This can&rsquo;t be undone.
      </div>
    </Dialog>
  );
}
