"use client";

import { useRef, useState } from "react";
import { Dialog, DiscardChangesDialog, Input, Button, FieldLabel } from "@/components/ds";
import { formatDateInput, todayFormatted, toDateInputValue } from "@/lib/date";
import { useConfirmClose } from "@/lib/useConfirmClose";
import type { Feedback } from "@/lib/types";

interface FeedbackDialogProps {
  feedback?: Feedback;
  onClose: () => void;
  onSave: (feedback: Feedback) => void;
}

/** Only ever rendered while the add/edit-feedback flow is open, so state starts fresh each time. */
export function FeedbackDialog({ feedback, onClose, onSave }: FeedbackDialogProps) {
  const [text, setText] = useState(feedback?.text ?? "");
  const [dateInput, setDateInput] = useState(feedback ? toDateInputValue(feedback.date) : "");
  const [submitted, setSubmitted] = useState(false);

  const initial = useRef({ text, dateInput }).current;
  const isDirty = text !== initial.text || dateInput !== initial.dateInput;
  const { requestClose, confirmOpen, confirmDiscard, cancelDiscard } = useConfirmClose(isDirty, onClose);

  const handleSave = () => {
    setSubmitted(true);
    if (!text.trim()) return;

    const date = dateInput ? formatDateInput(dateInput) : todayFormatted();
    onSave({ text: text.trim(), date });
  };

  return (
    <>
    <Dialog
      open
      title={feedback ? "Edit feedback" : "Add feedback"}
      onClose={requestClose}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={requestClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            Save
          </Button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <FieldLabel required block>
            Feedback
          </FieldLabel>
          <textarea
            placeholder="What did they say?"
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{
              width: "100%",
              padding: 10,
              border: `1.5px solid ${submitted && !text.trim() ? "var(--red-500)" : "var(--border-default)"}`,
              borderRadius: "var(--radius-s)",
              font: "var(--text-body-s)",
              color: "var(--text-primary)",
              resize: "vertical",
            }}
          />
          {submitted && !text.trim() && (
            <span style={{ font: "var(--text-caption)", color: "var(--red-600)" }}>Required</span>
          )}
        </div>
        <Input
          label="Date received"
          type="date"
          value={dateInput}
          onChange={setDateInput}
          hint="Defaults to today if left blank"
        />
      </div>
    </Dialog>
    <DiscardChangesDialog open={confirmOpen} onKeepEditing={cancelDiscard} onDiscard={confirmDiscard} />
    </>
  );
}
