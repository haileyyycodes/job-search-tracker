"use client";

import { Dialog, Button } from "@/components/ds";

interface ConfirmResetDemoDataDialogProps {
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmResetDemoDataDialog({ onClose, onConfirm }: ConfirmResetDemoDataDialogProps) {
  return (
    <Dialog
      open
      title="Reset demo data?"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={onConfirm}>
            Reset
          </Button>
        </>
      }
    >
      <div style={{ font: "var(--text-body-s)", color: "var(--text-secondary)" }}>
        This replaces every application, task, goal, contact, and networking event with the original demo data. Any
        changes you&rsquo;ve made will be lost. This can&rsquo;t be undone.
      </div>
    </Dialog>
  );
}
