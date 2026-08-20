"use client";

import { useState } from "react";
import { Dialog, Select, Input, Button } from "@/components/ds";
import type { SelectOption } from "@/components/ds";
import { addDays, formatDateInput, todayFormatted } from "@/lib/date";
import type { ReminderRule } from "@/lib/types";

const reminderOptions: SelectOption[] = [
  { value: "3", label: "3 days after applying" },
  { value: "7", label: "7 days after applying" },
  { value: "14", label: "14 days after applying" },
  { value: "custom", label: "Custom date" },
];

interface AddTaskDialogProps {
  dateApplied: string;
  onClose: () => void;
  onSave: (note: string, dueDate: string, reminderRule: ReminderRule) => void;
}

/** Only ever rendered while the add-task flow is open. */
export function AddTaskDialog({ dateApplied, onClose, onSave }: AddTaskDialogProps) {
  const [reminder, setReminder] = useState(reminderOptions[1].value);
  const [customDate, setCustomDate] = useState("");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSave = () => {
    setSubmitted(true);
    if (!note.trim()) return;

    let reminderRule: ReminderRule;
    let dueDate: string;
    if (reminder === "custom") {
      reminderRule = { type: "manual" };
      dueDate = customDate ? formatDateInput(customDate) : todayFormatted();
    } else {
      const days = Number(reminder);
      reminderRule = { type: "days_after_applied", days };
      dueDate = addDays(dateApplied, days);
    }

    onSave(note.trim(), dueDate, reminderRule);
  };

  return (
    <Dialog
      open
      title="Add task"
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
          label="Task"
          placeholder="e.g. Follow up on application status"
          value={note}
          onChange={setNote}
          error={submitted && !note.trim() ? "Required" : undefined}
        />
        <Select label="Remind me" value={reminder} options={reminderOptions} onChange={setReminder} />
        {reminder === "custom" && (
          <Input label="Due date" type="date" value={customDate} onChange={setCustomDate} hint="Defaults to today if left blank" />
        )}
      </div>
    </Dialog>
  );
}
