"use client";

import { Dialog, Button } from "@/components/ds";
import type { Application, Task } from "@/lib/types";

interface ConfirmDeleteApplicationDialogProps {
  app: Application;
  tasks: Task[];
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

/** Only ever rendered while a delete is pending, so there's no internal state to reset between opens. */
export function ConfirmDeleteApplicationDialog({ app, tasks, onClose, onConfirm }: ConfirmDeleteApplicationDialogProps) {
  const taskCount = tasks.filter((t) => t.applicationId === app.id).length;
  const cascadeParts = [
    app.interviews.length > 0 ? pluralize(app.interviews.length, "interview") : null,
    app.followUps.length > 0 ? pluralize(app.followUps.length, "follow-up") : null,
    taskCount > 0 ? pluralize(taskCount, "task") : null,
  ].filter((p): p is string => p !== null);

  const cascadeSentence =
    cascadeParts.length > 0 ? ` This will also permanently delete ${joinWithAnd(cascadeParts)}. ` : " ";

  return (
    <Dialog
      open
      title="Delete application?"
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
        Delete <strong>{app.role}</strong> at <strong>{app.company}</strong>?{cascadeSentence}This can&rsquo;t be undone.
      </div>
    </Dialog>
  );
}
