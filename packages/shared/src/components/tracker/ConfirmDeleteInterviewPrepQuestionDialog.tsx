"use client";

import { Dialog, Button } from "@/components/ds";
import { isRichTextEmpty } from "@/lib/richTextEditorHtml";
import type { InterviewPrepQuestion } from "@/lib/types";

interface ConfirmDeleteInterviewPrepQuestionDialogProps {
  question: InterviewPrepQuestion;
  onClose: () => void;
  onConfirm: () => void;
}

/** Questions stand alone (no foreign keys), so deleting one never cascades — just confirm. */
export function ConfirmDeleteInterviewPrepQuestionDialog({
  question,
  onClose,
  onConfirm,
}: ConfirmDeleteInterviewPrepQuestionDialogProps) {
  return (
    <Dialog
      open
      title="Remove question?"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={onConfirm}>
            Remove
          </Button>
        </>
      }
    >
      <div style={{ font: "var(--text-body-s)", color: "var(--text-secondary)" }}>
        Remove <strong>&ldquo;{question.question}&rdquo;</strong>
        {!isRichTextEmpty(question.answer) ? " and your drafted answer" : ""}? This can&rsquo;t be undone.
      </div>
    </Dialog>
  );
}
