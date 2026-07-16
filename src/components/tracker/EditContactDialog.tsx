"use client";

import { useState } from "react";
import { Dialog, Button } from "@/components/ds";
import { ContactFormFields, isContactFormValid } from "./ContactFormFields";
import type { ContactFormValues } from "./ContactFormFields";
import type { Contact } from "@/lib/types";

interface EditContactDialogProps {
  contact: Contact;
  onClose: () => void;
  onSave: (updated: Contact) => void;
}

/** Only ever rendered while the edit flow is open, so form state starts fresh from `contact` every time. */
export function EditContactDialog({ contact, onClose, onSave }: EditContactDialogProps) {
  const [form, setForm] = useState<ContactFormValues>({
    name: contact.name,
    email: contact.email ?? "",
    phone: contact.phone ?? "",
    linkedInUrl: contact.linkedInUrl ?? "",
    website: contact.website ?? "",
    employer: contact.employer ?? "",
    role: contact.role ?? "",
    notes: contact.notes,
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSave = () => {
    setSubmitted(true);
    if (!isContactFormValid(form)) return;

    onSave({
      ...contact,
      name: form.name.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      linkedInUrl: form.linkedInUrl.trim() || undefined,
      website: form.website.trim() || undefined,
      employer: form.employer.trim() || undefined,
      role: form.role.trim() || undefined,
      notes: form.notes.trim(),
    });
  };

  return (
    <Dialog
      open
      title="Edit contact"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            Save changes
          </Button>
        </>
      }
    >
      <ContactFormFields form={form} setForm={setForm} submitted={submitted} />
    </Dialog>
  );
}
