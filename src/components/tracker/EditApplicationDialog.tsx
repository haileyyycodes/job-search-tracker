"use client";

import { useState } from "react";
import { Dialog, Button } from "@/components/ds";
import { formatDateInput, toDateInputValue } from "@/lib/date";
import { ApplicationFormFields, isApplicationFormValid } from "./ApplicationFormFields";
import type { ApplicationFormValues } from "./ApplicationFormFields";
import type { Application } from "@/lib/types";

interface EditApplicationDialogProps {
  app: Application;
  onClose: () => void;
  onSave: (updated: Application) => void;
}

/** Only ever rendered while the edit flow is open, so form state starts fresh from `app` every time. */
export function EditApplicationDialog({ app, onClose, onSave }: EditApplicationDialogProps) {
  const [form, setForm] = useState<ApplicationFormValues>({
    company: app.company,
    role: app.role,
    dateApplied: toDateInputValue(app.dateApplied),
    link: app.link,
    description: app.jobDescription ?? "",
    referral: app.referral,
    referredBy: app.referredBy ?? "",
    notes: app.notes,
  });
  const [submitted, setSubmitted] = useState(false);
  const requireDateApplied = app.status !== "todo";

  const handleSave = () => {
    setSubmitted(true);
    if (!isApplicationFormValid(form, requireDateApplied)) return;

    const dateApplied = form.dateApplied ? formatDateInput(form.dateApplied) : "";
    onSave({
      ...app,
      company: form.company.trim(),
      role: form.role.trim(),
      dateApplied,
      link: form.link.trim(),
      jobDescription: form.description.trim(),
      referral: form.referral,
      referredBy: form.referral ? form.referredBy.trim() || undefined : undefined,
      notes: form.notes.trim(),
      logo: form.company.trim().charAt(0).toUpperCase() || app.logo,
    });
  };

  return (
    <Dialog
      open
      title="Edit application"
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
      <ApplicationFormFields form={form} setForm={setForm} submitted={submitted} requireDateApplied={requireDateApplied} />
    </Dialog>
  );
}
