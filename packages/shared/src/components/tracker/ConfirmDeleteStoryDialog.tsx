"use client";

import { Dialog, Button } from "@/components/ds";
import type { Story } from "@/lib/types";

interface ConfirmDeleteStoryDialogProps {
  story: Story;
  onClose: () => void;
  onConfirm: () => void;
}

/** Stories stand alone (no foreign keys), so deleting one never cascades — just confirm. */
export function ConfirmDeleteStoryDialog({ story, onClose, onConfirm }: ConfirmDeleteStoryDialogProps) {
  return (
    <Dialog
      open
      title="Delete story?"
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
        Delete <strong>{story.title || "this story"}</strong>? This can&rsquo;t be undone.
      </div>
    </Dialog>
  );
}
