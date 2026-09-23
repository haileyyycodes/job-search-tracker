"use client";

import { useState } from "react";
import { Dialog, DiscardChangesDialog, Button } from "@/components/ds";
import { useConfirmClose } from "@/lib/useConfirmClose";
import { ContactFormFields, emptyContactForm, isContactFormValid } from "./ContactFormFields";
import type { ContactFormValues } from "./ContactFormFields";
import type { NewCompany, NewContact } from "@/lib/dataSource/types";
import type { Company, RelationshipTier } from "@/lib/types";

interface AddContactDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (contact: NewContact) => void;
  companies: Company[];
  onCreateCompany: (company: NewCompany) => Promise<Company>;
}

export function AddContactDialog({ open, onClose, onAdd, companies, onCreateCompany }: AddContactDialogProps) {
  const [form, setForm] = useState<ContactFormValues>(emptyContactForm);
  const [submitted, setSubmitted] = useState(false);

  const resetAndClose = () => {
    setForm(emptyContactForm);
    setSubmitted(false);
    onClose();
  };

  const isDirty = JSON.stringify(form) !== JSON.stringify(emptyContactForm);
  const { requestClose, confirmOpen, confirmDiscard, cancelDiscard } = useConfirmClose(isDirty, resetAndClose);

  const handleSave = () => {
    setSubmitted(true);
    if (!isContactFormValid(form)) return;

    onAdd({
      name: form.name.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      linkedInUrl: form.linkedInUrl.trim() || undefined,
      website: form.website.trim() || undefined,
      companyId: form.companyId ? Number(form.companyId) : undefined,
      role: form.role.trim() || undefined,
      relationshipTier: (form.relationshipTier || undefined) as RelationshipTier | undefined,
      notes: form.notes.trim(),
    });
    resetAndClose();
  };

  return (
    <>
    <Dialog
      open={open}
      title="Add contact"
      onClose={requestClose}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={requestClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            Save contact
          </Button>
        </>
      }
    >
      <ContactFormFields
        form={form}
        setForm={setForm}
        submitted={submitted}
        companies={companies}
        onCreateCompany={onCreateCompany}
      />
    </Dialog>
    <DiscardChangesDialog open={confirmOpen} onKeepEditing={cancelDiscard} onDiscard={confirmDiscard} />
    </>
  );
}
