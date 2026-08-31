"use client";

import { useState } from "react";
import { Dialog, Select, Input, Button } from "@/components/ds";
import type { SelectOption } from "@/components/ds";
import { formatDateInput, todayFormatted, toDateInputValue } from "@/lib/date";
import { networkingEventTypes } from "@/lib/data";
import { companyName } from "@/lib/companies";
import { ContactMultiPicker } from "./ContactMultiPicker";
import type { NewContact } from "@/lib/dataSource/types";
import type { Application, Company, Contact, NetworkingEvent } from "@/lib/types";

const typeOptions: SelectOption[] = networkingEventTypes.map((t) => ({ value: t, label: t }));

interface LogNetworkingEventDialogProps {
  contacts: Contact[];
  apps: Application[];
  companies: Company[];
  initialContactId?: string;
  initialApplicationId?: string;
  /** When present, the dialog edits this event instead of logging a new one. */
  event?: NetworkingEvent;
  onClose: () => void;
  onCreateContact: (contact: NewContact) => Promise<Contact>;
  onSave: (event: Omit<NetworkingEvent, "id">) => void;
}

/** Only ever rendered while the log/edit-networking-event flow is open; `event` present means edit mode. */
export function LogNetworkingEventDialog({
  contacts,
  apps,
  companies,
  initialContactId,
  initialApplicationId,
  event,
  onClose,
  onCreateContact,
  onSave,
}: LogNetworkingEventDialogProps) {
  const [contactIds, setContactIds] = useState<string[]>(
    event ? event.contactIds.map(String) : initialContactId ? [initialContactId] : []
  );
  const [type, setType] = useState(event?.type ?? typeOptions[0].value);
  const [dateInput, setDateInput] = useState(event ? toDateInputValue(event.date) : "");
  const [applicationId, setApplicationId] = useState(
    event?.applicationId != null ? String(event.applicationId) : (initialApplicationId ?? "")
  );
  const [notes, setNotes] = useState(event?.notes ?? "");
  const [submitted, setSubmitted] = useState(false);

  const applicationOptions: SelectOption[] = [
    { value: "", label: "No application" },
    ...apps.map((a) => ({ value: String(a.id), label: `${companyName(a.companyId, companies)} — ${a.role}` })),
  ];

  const handleSave = () => {
    setSubmitted(true);
    if (contactIds.length === 0) return;

    const date = dateInput ? formatDateInput(dateInput) : todayFormatted();
    onSave({
      contactIds: contactIds.map(Number),
      type,
      date,
      applicationId: applicationId ? Number(applicationId) : undefined,
      notes: notes.trim(),
    });
  };

  return (
    <Dialog
      open
      title={event ? "Edit networking event" : "Log networking event"}
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
        <ContactMultiPicker
          label="Who did you meet with?"
          required
          contacts={contacts}
          companies={companies}
          value={contactIds}
          onChange={setContactIds}
          onCreateContact={onCreateContact}
          error={submitted && contactIds.length === 0 ? "Pick at least one contact" : undefined}
        />
        <Select label="Type" value={type} options={typeOptions} onChange={setType} />
        <Input label="Date" type="date" value={dateInput} onChange={setDateInput} hint="Defaults to today if left blank" />
        <Select
          label="Related application"
          value={applicationId}
          options={applicationOptions}
          onChange={setApplicationId}
          placeholder="No application"
        />
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
