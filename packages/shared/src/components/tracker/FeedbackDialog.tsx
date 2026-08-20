"use client";

import { useState } from "react";
import { Dialog, Input, Button } from "@/components/ds";
import { formatDateInput, todayFormatted, toDateInputValue } from "@/lib/date";
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

  const handleSave = () => {
    setSubmitted(true);
    if (!text.trim()) return;

    const date = dateInput ? formatDateInput(dateInput) : todayFormatted();
    onSave({ text: text.trim(), date });
  };

  return (
    <Dialog
      open
      title={feedback ? "Edit feedback" : "Add feedback"}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
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
          <label style={{ font: "var(--text-label)", color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
            Feedback
          </label>
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
  );
}
