"use client";

import { useState } from "react";
import { Dialog, Button } from "@/components/ds";
import { formatDateInput, toDateInputValue } from "@/lib/date";
import { ApplicationFormFields, isApplicationFormValid } from "./ApplicationFormFields";
import type { ApplicationFormValues } from "./ApplicationFormFields";
import { companyName } from "@/lib/companies";
import type { Application, Company, Contact } from "@/lib/types";

interface EditApplicationDialogProps {
  app: Application;
  onClose: () => void;
  onSave: (updated: Application) => void;
  contacts: Contact[];
  onCreateContact: (contact: Contact) => void;
  companies: Company[];
  onCreateCompany: (company: Company) => void;
}

/** Only ever rendered while the edit flow is open, so form state starts fresh from `app` every time. */
export function EditApplicationDialog({
  app,
  onClose,
  onSave,
  contacts,
  onCreateContact,
  companies,
  onCreateCompany,
}: EditApplicationDialogProps) {
  const [form, setForm] = useState<ApplicationFormValues>({
    companyId: app.companyId,
    role: app.role,
    dateApplied: toDateInputValue(app.dateApplied),
    link: app.link,
    description: app.jobDescription ?? "",
    referral: app.referral,
    referredByContactId: app.referredByContactId ?? "",
    notes: app.notes,
    salaryMin: app.salaryMin != null ? String(app.salaryMin) : "",
    salaryMax: app.salaryMax != null ? String(app.salaryMax) : "",
    workArrangement: app.workArrangement ?? "",
    city: app.city ?? "",
    state: app.state ?? "",
  });
  const [submitted, setSubmitted] = useState(false);
  const requireDateApplied = app.status !== "todo";

  const handleSave = () => {
    setSubmitted(true);
    if (!isApplicationFormValid(form, requireDateApplied)) return;

    const dateApplied = form.dateApplied ? formatDateInput(form.dateApplied) : "";
    onSave({
      ...app,
      companyId: form.companyId,
      role: form.role.trim(),
      dateApplied,
      link: form.link.trim(),
      jobDescription: form.description.trim(),
      referral: form.referral,
      referredByContactId: form.referral ? form.referredByContactId || undefined : undefined,
      notes: form.notes.trim(),
      salaryMin: form.salaryMin.trim() ? Number(form.salaryMin) : undefined,
      salaryMax: form.salaryMax.trim() ? Number(form.salaryMax) : undefined,
      workArrangement: form.workArrangement || undefined,
      city: form.city.trim() || undefined,
      state: form.state.trim() || undefined,
      logo: companyName(form.companyId, companies).charAt(0).toUpperCase() || app.logo,
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
      <ApplicationFormFields
        form={form}
        setForm={setForm}
        submitted={submitted}
        requireDateApplied={requireDateApplied}
        contacts={contacts}
        onCreateContact={onCreateContact}
        companies={companies}
        onCreateCompany={onCreateCompany}
      />
    </Dialog>
  );
}
