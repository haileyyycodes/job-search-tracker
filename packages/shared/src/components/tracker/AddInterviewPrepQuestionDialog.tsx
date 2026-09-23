"use client";

import { useState } from "react";
import { Dialog, DiscardChangesDialog, Button, Input } from "@/components/ds";
import { useConfirmClose } from "@/lib/useConfirmClose";
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

  const isDirty = question !== "" || section !== "";
  const { requestClose, confirmOpen, confirmDiscard, cancelDiscard } = useConfirmClose(isDirty, onClose);

  const handleSave = () => {
    setSubmitted(true);
    if (!question.trim()) return;
    onSave({ category: categorySlug, section: section.trim() || undefined, question: question.trim(), answer: "", starred: false });
    onClose();
  };

  return (
    <>
    <Dialog
      open
      title="Add question"
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
        <Input
          label="Question"
          required
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
    <DiscardChangesDialog open={confirmOpen} onKeepEditing={cancelDiscard} onDiscard={confirmDiscard} />
    </>
  );
}

interface EditInterviewPrepQuestionDialogProps {
  initialQuestion: string;
  initialSection: string;
  onClose: () => void;
  onSave: (question: string, section: string | undefined) => void;
}

/** Only ever rendered while the edit flow is open, so state starts fresh each time. */
export function EditInterviewPrepQuestionDialog({
  initialQuestion,
  initialSection,
  onClose,
  onSave,
}: EditInterviewPrepQuestionDialogProps) {
  const [question, setQuestion] = useState(initialQuestion);
  const [section, setSection] = useState(initialSection);
  const [submitted, setSubmitted] = useState(false);

  const isDirty = question !== initialQuestion || section !== initialSection;
  const { requestClose, confirmOpen, confirmDiscard, cancelDiscard } = useConfirmClose(isDirty, onClose);

  const handleSave = () => {
    setSubmitted(true);
    if (!question.trim()) return;
    onSave(question.trim(), section.trim() || undefined);
    onClose();
  };

  return (
    <>
    <Dialog
      open
      title="Edit question"
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
        <Input
          label="Question"
          required
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
    <DiscardChangesDialog open={confirmOpen} onKeepEditing={cancelDiscard} onDiscard={confirmDiscard} />
    </>
  );
}
