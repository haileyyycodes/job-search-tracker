"use client";

import { useState } from "react";
import { Dialog, Button } from "@/components/ds";
import { CompanyFormFields, emptyCompanyForm, isCompanyFormValid } from "./CompanyFormFields";
import type { CompanyFormValues } from "./CompanyFormFields";
import type { Company } from "@/lib/types";

interface AddCompanyDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (company: Company) => void;
}

/** Companies added here are real targets by default — quick-created companies (from an Application/Contact form) are not. */
export function AddCompanyDialog({ open, onClose, onAdd }: AddCompanyDialogProps) {
  const [form, setForm] = useState<CompanyFormValues>(emptyCompanyForm);
  const [submitted, setSubmitted] = useState(false);

  const resetAndClose = () => {
    setForm(emptyCompanyForm);
    setSubmitted(false);
    onClose();
  };

  const handleSave = () => {
    setSubmitted(true);
    if (!isCompanyFormValid(form)) return;

    onAdd({
      id: crypto.randomUUID(),
      name: form.name.trim(),
      isTarget: true,
      status: form.status,
      industry: form.industry.trim() || undefined,
      website: form.website.trim() || undefined,
      locations: form.locations.filter((l) => l.city.trim() || l.state.trim()),
      notes: form.notes.trim(),
    });
    resetAndClose();
  };

  return (
    <Dialog
      open={open}
      title="Add target company"
      onClose={resetAndClose}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={resetAndClose}>
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
  );
}
