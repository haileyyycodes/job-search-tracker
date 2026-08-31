"use client";

import { useState } from "react";
import { Dialog, Button } from "@/components/ds";
import { formatDateInput, toDateInputValue } from "@/lib/date";
import { ApplicationFormFields, isApplicationFormValid } from "./ApplicationFormFields";
import type { ApplicationFormValues } from "./ApplicationFormFields";
import { companyName } from "@/lib/companies";
import type { NewCompany, NewContact } from "@/lib/dataSource/types";
import type { Application, Company, Contact, ResumeFile } from "@/lib/types";

interface EditApplicationDialogProps {
  app: Application;
  onClose: () => void;
  onSave: (updated: Application) => void;
  onSetResumeFile: (applicationId: number, file: ResumeFile | null) => Promise<void>;
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
  onSetResumeFile,
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
    // Metadata only — no bytes until the user picks a new file.
    resumeFile: app.resumeFile ? { ...app.resumeFile, data: "" } : null,
    resumeFileError: "",
    coverLetterSubmitted: app.coverLetterSubmitted,
    notes: app.notes,
    salaryMin: app.salaryMin != null ? String(app.salaryMin) : "",
    salaryMax: app.salaryMax != null ? String(app.salaryMax) : "",
    workArrangement: app.workArrangement ?? "",
    city: app.city ?? "",
    state: app.state ?? "",
  });
  const [submitted, setSubmitted] = useState(false);
  const requireDateApplied = app.status !== "todo";

  const handleSave = async () => {
    setSubmitted(true);
    if (!isApplicationFormValid(form, requireDateApplied)) return;

    const dateApplied = form.dateApplied ? formatDateInput(form.dateApplied) : "";
    onSave({
      ...app,
      companyId: Number(form.companyId),
      role: form.role.trim(),
      dateApplied,
      link: form.link.trim(),
      jobDescription: form.description.trim(),
      referral: form.referral,
      referredByContactId: form.referral && form.referredByContactId ? Number(form.referredByContactId) : undefined,
      resumeType: form.resumeType as Application["resumeType"],
      coverLetterSubmitted: form.coverLetterSubmitted,
      notes: form.notes.trim(),
      salaryMin: form.salaryMin.trim() ? Number(form.salaryMin) : undefined,
      salaryMax: form.salaryMax.trim() ? Number(form.salaryMax) : undefined,
      workArrangement: form.workArrangement || undefined,
      city: form.city.trim() || undefined,
      state: form.state.trim() || undefined,
      logo: companyName(Number(form.companyId), companies).charAt(0).toUpperCase() || app.logo,
    });

    try {
      if (form.resumeFile?.data) {
        // A new file was picked this session.
        await onSetResumeFile(app.id, form.resumeFile);
      } else if (form.resumeFile === null && app.resumeFile) {
        // The existing file was removed.
        await onSetResumeFile(app.id, null);
      }
    } catch {
      // Scalar edits saved; only the file attachment failed.
    }
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
