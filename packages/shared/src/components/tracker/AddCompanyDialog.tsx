"use client";

import { useState } from "react";
import { Dialog, DiscardChangesDialog, Button } from "@/components/ds";
import { useConfirmClose } from "@/lib/useConfirmClose";
import { CompanyFormFields, emptyCompanyForm, isCompanyFormValid } from "./CompanyFormFields";
import type { CompanyFormValues } from "./CompanyFormFields";
import type { NewCompany } from "@/lib/dataSource/types";

interface AddCompanyDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (company: NewCompany) => void;
}

/** Defaults to creating a target — quick-created companies (from an Application/Contact form) are not. */
export function AddCompanyDialog({ open, onClose, onAdd }: AddCompanyDialogProps) {
  const [form, setForm] = useState<CompanyFormValues>(emptyCompanyForm);
  const [submitted, setSubmitted] = useState(false);

  const resetAndClose = () => {
    setForm(emptyCompanyForm);
    setSubmitted(false);
    onClose();
  };

  const isDirty = JSON.stringify(form) !== JSON.stringify(emptyCompanyForm);
  const { requestClose, confirmOpen, confirmDiscard, cancelDiscard } = useConfirmClose(isDirty, resetAndClose);

  const handleSave = () => {
    setSubmitted(true);
    if (!isCompanyFormValid(form)) return;

    onAdd({
      name: form.name.trim(),
      isTarget: form.isTarget,
      status: form.status,
      industry: form.industry.trim() || undefined,
      website: form.website.trim() || undefined,
      locations: form.locations.filter((l) => l.city.trim() || l.state.trim()),
      notes: form.notes.trim(),
    });
    resetAndClose();
  };

  return (
    <>
    <Dialog
      open={open}
      title="Add company"
      onClose={requestClose}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={requestClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            Save company
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
