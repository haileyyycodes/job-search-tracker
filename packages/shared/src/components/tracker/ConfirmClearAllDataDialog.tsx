"use client";

import { Dialog, Button } from "@/components/ds";

interface ConfirmClearAllDataDialogProps {
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmClearAllDataDialog({ onClose, onConfirm }: ConfirmClearAllDataDialogProps) {
  return (
    <Dialog
      open
      title="Clear all data?"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={onConfirm}>
            Clear everything
          </Button>
        </>
      }
    >
      <div style={{ font: "var(--text-body-s)", color: "var(--text-secondary)" }}>
        This permanently deletes every application, task, goal, contact, networking event, and company — leaving a
        completely empty tracker. Unlike resetting, this doesn&rsquo;t bring back the demo data. This can&rsquo;t be
        undone.
      </div>
    </Dialog>
  );
}
