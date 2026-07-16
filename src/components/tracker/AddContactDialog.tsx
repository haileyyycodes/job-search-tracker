"use client";

import { useState } from "react";
import { Dialog, Button } from "@/components/ds";
import { ContactFormFields, emptyContactForm, isContactFormValid } from "./ContactFormFields";
import type { ContactFormValues } from "./ContactFormFields";
import type { Contact } from "@/lib/types";

interface AddContactDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (contact: Contact) => void;
}

export function AddContactDialog({ open, onClose, onAdd }: AddContactDialogProps) {
  const [form, setForm] = useState<ContactFormValues>(emptyContactForm);
  const [submitted, setSubmitted] = useState(false);

  const resetAndClose = () => {
    setForm(emptyContactForm);
    setSubmitted(false);
    onClose();
  };

  const handleSave = () => {
    setSubmitted(true);
    if (!isContactFormValid(form)) return;

    onAdd({
      id: crypto.randomUUID(),
      name: form.name.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      linkedInUrl: form.linkedInUrl.trim() || undefined,
      website: form.website.trim() || undefined,
      employer: form.employer.trim() || undefined,
      role: form.role.trim() || undefined,
      notes: form.notes.trim(),
    });
    resetAndClose();
  };

  return (
    <Dialog
      open={open}
      title="Add contact"
      onClose={resetAndClose}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={resetAndClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            Save contact
          </Button>
        </>
      }
    >
      <ContactFormFields form={form} setForm={setForm} submitted={submitted} />
    </Dialog>
  );
}
