"use client";

import { useRef, useState } from "react";
import { Dialog, DiscardChangesDialog, Button, Input, FieldLabel, RichTextEditor } from "@/components/ds";
import { formatDateInput, toDateInputValue } from "@/lib/date";
import { ensureRichTextHtml, sanitizeRichTextHtml } from "@/lib/richTextEditorHtml";
import { useConfirmClose } from "@/lib/useConfirmClose";
import type { Story } from "@/lib/types";

interface StoryFields {
  title: string;
  content: string;
  tags: string[];
  date?: string;
  toDate?: string;
}

interface StoryDialogProps {
  /** Omit to open in "create" mode; pass a story to edit it. */
  story?: Story;
  onClose: () => void;
  onSubmit: (fields: StoryFields) => void;
}

function parseTags(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(",")) {
    const t = part.trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

/** Fresh state each open — the parent only mounts this while the flow is active. */
export function StoryDialog({ story, onClose, onSubmit }: StoryDialogProps) {
  const [title, setTitle] = useState(story?.title ?? "");
  const [tags, setTags] = useState((story?.tags ?? []).join(", "));
  const [content, setContent] = useState(ensureRichTextHtml(story?.content ?? ""));
  const [dateInput, setDateInput] = useState(toDateInputValue(story?.date ?? ""));
  const [toDateInput, setToDateInput] = useState(toDateInputValue(story?.toDate ?? ""));
  const [submitted, setSubmitted] = useState(false);

  const initial = useRef({ title, tags, content, dateInput, toDateInput }).current;
  const isDirty =
    title !== initial.title ||
    tags !== initial.tags ||
    content !== initial.content ||
    dateInput !== initial.dateInput ||
    toDateInput !== initial.toDateInput;
  const { requestClose, confirmOpen, confirmDiscard, cancelDiscard } = useConfirmClose(isDirty, onClose);

  const handleSave = () => {
    setSubmitted(true);
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      content: sanitizeRichTextHtml(content),
      tags: parseTags(tags),
      date: dateInput ? formatDateInput(dateInput) : undefined,
      toDate: toDateInput ? formatDateInput(toDateInput) : undefined,
    });
    onClose();
  };

  return (
    <>
    <Dialog
      open
      title={story ? "Edit achievement" : "Add achievement"}
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
          width: "100%",
          maxWidth: 1040,
          margin: "0 auto",
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "row",
          gap: 32,
        }}
      >
        <div style={{ width: 300, flex: "none", display: "flex", flexDirection: "column", gap: 16 }}>
          <Input
            label="Title"
            required
            placeholder="e.g. Rebuilt the checkout flow, cut drop-off 22%"
            value={title}
            onChange={setTitle}
            error={submitted && !title.trim() ? "Required" : undefined}
          />
          <Input
            label="Tags"
            placeholder="Comma-separated, e.g. resume, conflict, leadership"
            value={tags}
            onChange={setTags}
            hint="Used to group and filter achievements."
          />
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Input label="Date" type="date" value={dateInput} onChange={setDateInput} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Input label="To date" type="date" value={toDateInput} onChange={setToDateInput} />
            </div>
          </div>
          <span style={{ font: "var(--text-caption)", color: "var(--text-tertiary)", marginTop: -10 }}>
            Add a to date for an achievement spanning a project or ongoing effort.
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minHeight: 0 }}>
          <FieldLabel>Achievement</FieldLabel>
          <RichTextEditor
            value={content}
            onChange={setContent}
            ariaLabel="Achievement"
            placeholder="The situation, what you did, and how it landed. Keep it reusable."
            minHeight={240}
          />
        </div>
      </div>
    </Dialog>
    <DiscardChangesDialog open={confirmOpen} onKeepEditing={cancelDiscard} onDiscard={confirmDiscard} />
    </>
  );
}
