"use client";

import { useState } from "react";
import { Dialog, Input, Button } from "@/components/ds";
import { formatDateInput, todayFormatted } from "@/lib/date";
import { ContactPicker } from "./ContactPicker";
import type { Contact, FollowUp } from "@/lib/types";

interface LogFollowUpDialogProps {
  contacts: Contact[];
  onCreateContact: (contact: Contact) => void;
  defaultCompany?: string;
  onClose: () => void;
  onSave: (followUp: Omit<FollowUp, "id">) => void;
}

/** Only ever rendered while the log-follow-up flow is open. */
export function LogFollowUpDialog({ contacts, onCreateContact, defaultCompany, onClose, onSave }: LogFollowUpDialogProps) {
  const [contactId, setContactId] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSave = () => {
    setSubmitted(true);
    if (!contactId) return;

    const date = dateInput ? formatDateInput(dateInput) : todayFormatted();
    onSave({ date, contactId, notes: notes.trim() });
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
        <ContactPicker
          label="Contacted person"
          contacts={contacts}
          value={contactId}
          onChange={setContactId}
          onCreateContact={onCreateContact}
          defaultCompany={defaultCompany}
          error={submitted && !contactId ? "Required" : undefined}
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
