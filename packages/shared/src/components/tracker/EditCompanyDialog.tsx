"use client";

import { useState } from "react";
import { Dialog, DiscardChangesDialog, Button } from "@/components/ds";
import { useConfirmClose } from "@/lib/useConfirmClose";
import { CompanyFormFields, isCompanyFormValid } from "./CompanyFormFields";
import type { CompanyFormValues } from "./CompanyFormFields";
import type { Company } from "@/lib/types";

interface EditCompanyDialogProps {
  company: Company;
  onClose: () => void;
  onSave: (updated: Company) => void;
}

/** Only ever rendered while the edit flow is open, so form state starts fresh from `company` every time. */
export function EditCompanyDialog({ company, onClose, onSave }: EditCompanyDialogProps) {
  const [form, setForm] = useState<CompanyFormValues>({
    name: company.name,
    industry: company.industry ?? "",
    website: company.website ?? "",
    notes: company.notes,
    isTarget: company.isTarget,
    status: company.status,
    locations: company.locations,
  });
  const [submitted, setSubmitted] = useState(false);

  const [initialForm] = useState(form);
  const isDirty = JSON.stringify(form) !== JSON.stringify(initialForm);
  const { requestClose, confirmOpen, confirmDiscard, cancelDiscard } = useConfirmClose(isDirty, onClose);

  const handleSave = () => {
    setSubmitted(true);
    if (!isCompanyFormValid(form)) return;

    onSave({
      ...company,
      name: form.name.trim(),
      industry: form.industry.trim() || undefined,
      website: form.website.trim() || undefined,
      locations: form.locations.filter((l) => l.city.trim() || l.state.trim()),
      notes: form.notes.trim(),
      isTarget: form.isTarget,
      status: form.status,
    });
  };

  return (
    <>
    <Dialog
      open
      title="Edit company"
      onClose={requestClose}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={requestClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            Save changes
          </Button>
        </>
      }
    >
      <CompanyFormFields form={form} setForm={setForm} submitted={submitted} />
    </Dialog>
    <DiscardChangesDialog open={confirmOpen} onKeepEditing={cancelDiscard} onDiscard={confirmDiscard} />
    </>
  );
}
