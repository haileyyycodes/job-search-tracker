"use client";

import { useState } from "react";
import { Dialog, Select, MultiSelect, Input, Button } from "@/components/ds";
import type { SelectOption } from "@/components/ds";
import { interviewTypeOptions, interviewStyleOptions } from "@/lib/data";
import { formatDateInput, todayFormatted, toDateInputValue } from "@/lib/date";
import type { Interview } from "@/lib/types";

const typeSelectOptions: SelectOption[] = interviewTypeOptions;
const styleSelectOptions: SelectOption[] = [
  { value: "", label: "Not specified" },
  ...interviewStyleOptions,
];

interface LogInterviewDialogProps {
  interview?: Interview;
  interviewCategories: string[];
  onCreateCategory: (category: string) => void;
  onClose: () => void;
  onSave: (interview: Omit<Interview, "id">) => void;
}

/** Only ever rendered while the log/edit-interview flow is open; `interview` present means edit mode. */
export function LogInterviewDialog({
  interview,
  interviewCategories,
  onCreateCategory,
  onClose,
  onSave,
}: LogInterviewDialogProps) {
  const [type, setType] = useState(interview?.type ?? typeSelectOptions[0].value);
  const [dateInput, setDateInput] = useState(interview ? toDateInputValue(interview.date) : "");
  const [style, setStyle] = useState<string>(interview?.style ?? "");
  const [categories, setCategories] = useState<string[]>(interview?.categories ?? []);
  const [questionsAsked, setQuestionsAsked] = useState(interview?.questionsAsked ?? "");
  const [notes, setNotes] = useState(interview?.notes ?? "");

  const handleSave = () => {
    const date = dateInput ? formatDateInput(dateInput) : todayFormatted();
    onSave({
      type: type as Interview["type"],
      date,
      style: style ? (style as Interview["style"]) : undefined,
      categories: categories.length > 0 ? categories : undefined,
      questionsAsked: questionsAsked.trim() || undefined,
      notes: notes.trim(),
    });
  };

  return (
    <Dialog
      open
      title={interview ? "Edit interview" : "Log interview"}
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
        <Select label="Interview type" value={type} options={typeSelectOptions} onChange={setType} />
        <Input label="Date" type="date" value={dateInput} onChange={setDateInput} hint="Defaults to today if left blank" />
        <Select
          label="Style"
          value={style}
          options={styleSelectOptions}
          onChange={setStyle}
          placeholder="Not specified"
        />
        <MultiSelect
          label="Categories"
          values={categories}
          options={interviewCategories}
          onChange={setCategories}
          onCreateOption={onCreateCategory}
          placeholder="Add or create a category…"
        />
        <div>
          <label style={{ font: "var(--text-label)", color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
            Questions asked
          </label>
          <textarea
            placeholder="Jot down questions as you remember them…"
            rows={3}
            value={questionsAsked}
            onChange={(e) => setQuestionsAsked(e.target.value)}
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
        <div>
          <label style={{ font: "var(--text-label)", color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
            Notes
          </label>
          <textarea
            placeholder="How did it go? Next steps…"
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
