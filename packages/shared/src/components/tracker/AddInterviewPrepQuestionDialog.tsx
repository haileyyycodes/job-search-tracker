"use client";

import { useState } from "react";
import { Dialog, Button, Input } from "@/components/ds";
import type { NewInterviewPrepQuestion } from "@/lib/dataSource/types";

interface AddInterviewPrepQuestionDialogProps {
  categorySlug: string;
  onClose: () => void;
  onSave: (question: NewInterviewPrepQuestion) => void;
}

/** Only ever rendered while the add-question flow is open, so state starts fresh each time. */
export function AddInterviewPrepQuestionDialog({ categorySlug, onClose, onSave }: AddInterviewPrepQuestionDialogProps) {
  const [question, setQuestion] = useState("");
  const [section, setSection] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSave = () => {
    setSubmitted(true);
    if (!question.trim()) return;
    onSave({ category: categorySlug, section: section.trim() || undefined, question: question.trim(), answer: "", starred: false });
    onClose();
  };

  return (
    <Dialog
      open
      title="Add question"
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
          label="Question"
          placeholder="e.g. Tell me about a time…"
          value={question}
          onChange={setQuestion}
          error={submitted && !question.trim() ? "Required" : undefined}
        />
        <Input
          label="Section (optional)"
          placeholder="e.g. Conflict & Disagreement"
          value={section}
          onChange={setSection}
          hint="Groups this question under a heading on the category page."
        />
      </div>
    </Dialog>
  );
}
