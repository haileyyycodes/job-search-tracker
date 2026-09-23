"use client";

import { Dialog } from "./Dialog";
import { Button } from "./Button";

interface DiscardChangesDialogProps {
  open: boolean;
  onKeepEditing: () => void;
  onDiscard: () => void;
}

/** Confirms discarding unsaved edits before a dialog closes. Pair with `useConfirmClose` —
 * render this as a sibling right after the dialog it guards, so it stacks on top instead of
 * nesting inside it. */
export function DiscardChangesDialog({ open, onKeepEditing, onDiscard }: DiscardChangesDialogProps) {
  return (
    <Dialog
      open={open}
      title="Discard changes?"
      onClose={onKeepEditing}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onKeepEditing}>
            Keep editing
          </Button>
          <Button variant="danger" size="sm" onClick={onDiscard}>
            Discard
          </Button>
        </>
      }
    >
      <div style={{ font: "var(--text-body-s)", color: "var(--text-secondary)" }}>
        You have unsaved changes. They will be lost if you close now.
      </div>
    </Dialog>
  );
}
