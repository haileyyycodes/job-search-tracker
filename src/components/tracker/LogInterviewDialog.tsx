"use client";

import { useState } from "react";
import { Dialog, Select, Input, Button } from "@/components/ds";
import type { SelectOption } from "@/components/ds";
import { formatDateInput, todayFormatted } from "@/lib/date";
import type { Interview } from "@/lib/types";

const interviewTypeOptions: SelectOption[] = [
  { value: "Screening Call", label: "Screening Call" },
  { value: "Technical Interview", label: "Technical Interview" },
  { value: "Onsite/Panel", label: "Onsite/Panel" },
  { value: "Behavioral", label: "Behavioral" },
  { value: "Other", label: "Other" },
];

interface LogInterviewDialogProps {
  onClose: () => void;
  onSave: (interview: Omit<Interview, "id">) => void;
}

/** Only ever rendered while the log-interview flow is open. */
export function LogInterviewDialog({ onClose, onSave }: LogInterviewDialogProps) {
  const [type, setType] = useState(interviewTypeOptions[0].value);
  const [dateInput, setDateInput] = useState("");
  const [notes, setNotes] = useState("");

  const handleSave = () => {
    const date = dateInput ? formatDateInput(dateInput) : todayFormatted();
    onSave({ type, date, notes: notes.trim() });
  };

  return (
    <Dialog
      open
      title="Log interview"
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
        <Select label="Interview type" value={type} options={interviewTypeOptions} onChange={setType} />
        <Input label="Date" type="date" value={dateInput} onChange={setDateInput} hint="Defaults to today if left blank" />
        <div>
          <label style={{ font: "var(--text-label)", color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
            Notes
          </label>
          <textarea
            placeholder="How did it go? Questions asked, next steps…"
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
