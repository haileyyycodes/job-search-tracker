"use client";

import { useState } from "react";
import { Dialog, Input, Button } from "@/components/ds";
import { formatDateInput, todayFormatted } from "@/lib/date";
import type { FollowUp } from "@/lib/types";

interface LogFollowUpDialogProps {
  onClose: () => void;
  onSave: (followUp: Omit<FollowUp, "id">) => void;
}

/** Only ever rendered while the log-follow-up flow is open. */
export function LogFollowUpDialog({ onClose, onSave }: LogFollowUpDialogProps) {
  const [contact, setContact] = useState("");
  const [info, setInfo] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSave = () => {
    setSubmitted(true);
    if (!contact.trim()) return;

    const date = dateInput ? formatDateInput(dateInput) : todayFormatted();
    onSave({ date, contact: contact.trim(), info: info.trim(), notes: notes.trim() });
  };

  return (
    <Dialog
      open
      title="Log follow-up"
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
        <Input
          label="Contacted person"
          placeholder="e.g. Alex Chen"
          value={contact}
          onChange={setContact}
          error={submitted && !contact.trim() ? "Required" : undefined}
        />
        <Input
          label="Contact info"
          placeholder="Email or phone"
          value={info}
          onChange={setInfo}
        />
        <Input label="Date" type="date" value={dateInput} onChange={setDateInput} hint="Defaults to today if left blank" />
        <div>
          <label style={{ font: "var(--text-label)", color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
            Notes
          </label>
          <textarea
            placeholder="What did you talk about?"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{
              width: "100%",
              padding: 10,
              border: "1.5px solid var(--border-default)",
              borderRadius: "var(--radius-s)",
              font: "var(--text-body-s)",
              color: "var(--text-primary)",
              resize: "vertical",
            }}
          />
        </div>
      </div>
    </Dialog>
  );
}
