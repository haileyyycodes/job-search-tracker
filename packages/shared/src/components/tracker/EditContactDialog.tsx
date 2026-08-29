"use client";

import { useState } from "react";
import { Dialog, Button } from "@/components/ds";
import { ContactFormFields, isContactFormValid } from "./ContactFormFields";
import type { ContactFormValues } from "./ContactFormFields";
import type { NewCompany } from "@/lib/dataSource/types";
import type { Company, Contact, RelationshipTier } from "@/lib/types";

interface EditContactDialogProps {
  contact: Contact;
  onClose: () => void;
  onSave: (updated: Contact) => void;
  companies: Company[];
  onCreateCompany: (company: NewCompany) => Promise<Company>;
}

/** Only ever rendered while the edit flow is open, so form state starts fresh from `contact` every time. */
export function EditContactDialog({ contact, onClose, onSave, companies, onCreateCompany }: EditContactDialogProps) {
  const [form, setForm] = useState<ContactFormValues>({
    name: contact.name,
    email: contact.email ?? "",
    phone: contact.phone ?? "",
    linkedInUrl: contact.linkedInUrl ?? "",
    website: contact.website ?? "",
    companyId: contact.companyId != null ? String(contact.companyId) : "",
    role: contact.role ?? "",
    relationshipTier: contact.relationshipTier ?? "",
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
      companyId: form.companyId ? Number(form.companyId) : undefined,
      role: form.role.trim() || undefined,
      relationshipTier: (form.relationshipTier || undefined) as RelationshipTier | undefined,
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
      <ContactFormFields
        form={form}
        setForm={setForm}
        submitted={submitted}
        companies={companies}
        onCreateCompany={onCreateCompany}
      />
    </Dialog>
  );
}
