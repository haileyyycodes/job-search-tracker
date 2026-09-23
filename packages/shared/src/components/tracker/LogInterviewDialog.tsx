"use client";

import { useRef, useState } from "react";
import { Dialog, DiscardChangesDialog, Select, MultiSelect, Input, Button, RichTextEditor } from "@/components/ds";
import type { SelectOption } from "@/components/ds";
import { interviewTypeOptions, interviewStyleOptions } from "@/lib/data";
import { formatDateInput, todayFormatted, toDateInputValue } from "@/lib/date";
import { ensureRichTextHtml, isRichTextEmpty, sanitizeRichTextHtml } from "@/lib/richTextEditorHtml";
import { useConfirmClose } from "@/lib/useConfirmClose";
import { ContactPicker } from "./ContactPicker";
import type { NewContact } from "@/lib/dataSource/types";
import type { Company, Contact, Interview } from "@/lib/types";

const typeSelectOptions: SelectOption[] = interviewTypeOptions;
const styleSelectOptions: SelectOption[] = [
  { value: "", label: "Not specified" },
  ...interviewStyleOptions,
];

interface LogInterviewDialogProps {
  interview?: Interview;
  interviewCategories: string[];
  onCreateCategory: (category: string) => void;
  contacts: Contact[];
  companies: Company[];
  onCreateContact: (contact: NewContact) => Promise<Contact>;
  defaultCompanyId?: string;
  onClose: () => void;
  onSave: (interview: Omit<Interview, "id">) => void;
}

/** Only ever rendered while the log/edit-interview flow is open; `interview` present means edit mode. */
export function LogInterviewDialog({
  interview,
  interviewCategories,
  onCreateCategory,
  contacts,
  companies,
  onCreateContact,
  defaultCompanyId,
  onClose,
  onSave,
}: LogInterviewDialogProps) {
  const [type, setType] = useState(interview?.type ?? typeSelectOptions[0].value);
  const [dateInput, setDateInput] = useState(interview ? toDateInputValue(interview.date) : "");
  const [style, setStyle] = useState<string>(interview?.style ?? "");
  const [categories, setCategories] = useState<string[]>(interview?.categories ?? []);
  const [contactId, setContactId] = useState(interview?.contactId != null ? String(interview.contactId) : "");
  const [questionsToAsk, setQuestionsToAsk] = useState(ensureRichTextHtml(interview?.questionsToAsk ?? ""));
  const [questionsAsked, setQuestionsAsked] = useState(ensureRichTextHtml(interview?.questionsAsked ?? ""));
  const [notes, setNotes] = useState(ensureRichTextHtml(interview?.notes ?? ""));

  const initial = useRef({ type, dateInput, style, categories, contactId, questionsToAsk, questionsAsked, notes }).current;
  const isDirty =
    type !== initial.type ||
    dateInput !== initial.dateInput ||
    style !== initial.style ||
    contactId !== initial.contactId ||
    questionsToAsk !== initial.questionsToAsk ||
    questionsAsked !== initial.questionsAsked ||
    notes !== initial.notes ||
    categories.length !== initial.categories.length ||
    categories.some((c, i) => c !== initial.categories[i]);
  const { requestClose, confirmOpen, confirmDiscard, cancelDiscard } = useConfirmClose(isDirty, onClose);

  const handleSave = () => {
    const date = dateInput ? formatDateInput(dateInput) : todayFormatted();
    onSave({
      type: type as Interview["type"],
      date,
      style: style ? (style as Interview["style"]) : undefined,
      categories: categories.length > 0 ? categories : undefined,
      contactId: contactId ? Number(contactId) : undefined,
      questionsToAsk: isRichTextEmpty(questionsToAsk) ? undefined : sanitizeRichTextHtml(questionsToAsk),
      questionsAsked: isRichTextEmpty(questionsAsked) ? undefined : sanitizeRichTextHtml(questionsAsked),
      notes: isRichTextEmpty(notes) ? "" : sanitizeRichTextHtml(notes),
    });
  };

  return (
    <>
    <Dialog
      open
      title={interview ? "Edit interview" : "Log interview"}
      onClose={requestClose}
      fullScreen
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
      <div
        style={{
          display: "flex",
          flex: 1,
          minHeight: 0,
          gap: 32,
          width: "100%",
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 14 }}>
            <div style={{ flex: 1 }}>
              <Select label="Interview type" value={type} options={typeSelectOptions} onChange={setType} />
            </div>
            <div style={{ flex: 1 }}>
              <Input label="Date" type="date" value={dateInput} onChange={setDateInput} hint="Defaults to today if left blank" />
            </div>
          </div>
          <div style={{ display: "flex", gap: 14 }}>
            <div style={{ flex: 1 }}>
              <Select
                label="Style"
                value={style}
                options={styleSelectOptions}
                onChange={setStyle}
                placeholder="Not specified"
              />
            </div>
            <div style={{ flex: 1 }}>
              <ContactPicker
                label="Interviewer"
                contacts={contacts}
                companies={companies}
                value={contactId}
                onChange={setContactId}
                onCreateContact={onCreateContact}
                defaultCompanyId={defaultCompanyId}
                placeholder="Connect a contact…"
              />
            </div>
          </div>
          <MultiSelect
            label="Categories"
            values={categories}
            options={interviewCategories}
            onChange={setCategories}
            onCreateOption={onCreateCategory}
            placeholder="Add or create a category…"
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ font: "var(--text-label)", color: "var(--text-secondary)" }}>Questions to ask</label>
            <RichTextEditor
              value={questionsToAsk}
              onChange={setQuestionsToAsk}
              ariaLabel="Questions to ask"
              placeholder="Questions to ask the interviewer…"
              minHeight={90}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ font: "var(--text-label)", color: "var(--text-secondary)" }}>Questions asked</label>
            <RichTextEditor
              value={questionsAsked}
              onChange={setQuestionsAsked}
              ariaLabel="Questions asked"
              placeholder="Jot down questions as you remember them…"
              minHeight={90}
            />
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6, minHeight: 0 }}>
          <label style={{ font: "var(--text-label)", color: "var(--text-secondary)" }}>Notes</label>
          <RichTextEditor
            value={notes}
            onChange={setNotes}
            ariaLabel="Notes"
            placeholder="How did it go? Next steps…"
            minHeight={400}
          />
        </div>
      </div>
    </Dialog>
    <DiscardChangesDialog open={confirmOpen} onKeepEditing={cancelDiscard} onDiscard={confirmDiscard} />
    </>
  );
}
