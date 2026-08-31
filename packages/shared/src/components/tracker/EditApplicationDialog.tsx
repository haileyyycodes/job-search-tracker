"use client";

import { useState } from "react";
import { Dialog, Button } from "@/components/ds";
import { formatDateInput, toDateInputValue } from "@/lib/date";
import { MAX_RICH_TEXT_CHARS } from "@/lib/richText";
import { ApplicationFormFields, isApplicationFormValid } from "./ApplicationFormFields";
import type { ApplicationFormValues } from "./ApplicationFormFields";
import { companyName } from "@/lib/companies";
import type { NewCompany, NewContact } from "@/lib/dataSource/types";
import type { Application, Company, Contact } from "@/lib/types";

interface EditApplicationDialogProps {
  app: Application;
  onClose: () => void;
  onSave: (updated: Application) => void;
  contacts: Contact[];
  onCreateContact: (contact: NewContact) => Promise<Contact>;
  companies: Company[];
  onCreateCompany: (company: NewCompany) => Promise<Company>;
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
    companyId: String(app.companyId),
    role: app.role,
    dateApplied: toDateInputValue(app.dateApplied),
    link: app.link,
    description: app.jobDescription ?? "",
    referral: app.referral,
    referredByContactId: app.referredByContactId != null ? String(app.referredByContactId) : "",
    resumeType: app.resumeType,
    resumeText: app.resumeText ?? "",
    coverLetterText: app.coverLetterText ?? "",
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
    // "Cover letter submitted" is derived from whether a cover letter was written.
    const coverLetterText = form.coverLetterText.trim().slice(0, MAX_RICH_TEXT_CHARS);
    onSave({
      ...app,
      companyId: Number(form.companyId),
      role: form.role.trim(),
      dateApplied,
      link: form.link.trim(),
      jobDescription: form.description.trim().slice(0, MAX_RICH_TEXT_CHARS),
      referral: form.referral,
      referredByContactId: form.referral && form.referredByContactId ? Number(form.referredByContactId) : undefined,
      resumeType: form.resumeType as Application["resumeType"],
      resumeText: form.resumeText.trim().slice(0, MAX_RICH_TEXT_CHARS) || undefined,
      coverLetterText: coverLetterText || undefined,
      coverLetterSubmitted: coverLetterText.length > 0,
      notes: form.notes.trim(),
      salaryMin: form.salaryMin.trim() ? Number(form.salaryMin) : undefined,
      salaryMax: form.salaryMax.trim() ? Number(form.salaryMax) : undefined,
      workArrangement: form.workArrangement || undefined,
      city: form.city.trim() || undefined,
      state: form.state.trim() || undefined,
      logo: companyName(Number(form.companyId), companies).charAt(0).toUpperCase() || app.logo,
    });
  };

  return (
    <Dialog
      open
      title="Edit application"
      fullScreen
      disablePadding
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
