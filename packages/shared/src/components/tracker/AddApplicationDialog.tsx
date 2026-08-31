"use client";

import { useState } from "react";
import { Dialog, Button, Select } from "@/components/ds";
import { formatDateInput, todayFormatted } from "@/lib/date";
import { ApplicationFormFields, emptyApplicationForm, isApplicationFormValid } from "./ApplicationFormFields";
import type { ApplicationFormValues } from "./ApplicationFormFields";
import { companyName } from "@/lib/companies";
import type { NewApplication, NewCompany, NewContact } from "@/lib/dataSource/types";
import type { Application, Company, Contact } from "@/lib/types";

interface AddApplicationDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (app: NewApplication) => Promise<Application>;
  contacts: Contact[];
  onCreateContact: (contact: NewContact) => Promise<Contact>;
  companies: Company[];
  onCreateCompany: (company: NewCompany) => Promise<Company>;
}

const initialStatusOptions = [
  { value: "applied", label: "Applied" },
  { value: "todo", label: "To do — queue for later" },
];

export function AddApplicationDialog({
  open,
  onClose,
  onAdd,
  contacts,
  onCreateContact,
  companies,
  onCreateCompany,
}: AddApplicationDialogProps) {
  const [status, setStatus] = useState<"todo" | "applied">("applied");
  const [form, setForm] = useState<ApplicationFormValues>(emptyApplicationForm);
  const [submitted, setSubmitted] = useState(false);
  const requireDateApplied = status === "applied";

  const resetAndClose = () => {
    setStatus("applied");
    setForm(emptyApplicationForm);
    setSubmitted(false);
    onClose();
  };

  const handleSave = async () => {
    setSubmitted(true);
    if (!isApplicationFormValid(form, requireDateApplied)) return;

    const dateApplied = form.dateApplied ? formatDateInput(form.dateApplied) : "";
    const newApp: NewApplication = {
      companyId: Number(form.companyId),
      role: form.role.trim(),
      dateApplied,
      link: form.link.trim(),
      jobDescription: form.description.trim(),
      referral: form.referral,
      referredByContactId: form.referral && form.referredByContactId ? Number(form.referredByContactId) : undefined,
      resumeType: form.resumeType as NewApplication["resumeType"],
      resumeText: form.resumeText.trim() || undefined,
      coverLetterSubmitted: form.coverLetterSubmitted,
      notes: form.notes.trim(),
      salaryMin: form.salaryMin.trim() ? Number(form.salaryMin) : undefined,
      salaryMax: form.salaryMax.trim() ? Number(form.salaryMax) : undefined,
      workArrangement: form.workArrangement || undefined,
      city: form.city.trim() || undefined,
      state: form.state.trim() || undefined,
      status,
      logo: companyName(form.companyId ? Number(form.companyId) : undefined, companies).charAt(0).toUpperCase() || "?",
      statusHistory:
        status === "todo" ? [{ status: "todo", at: todayFormatted() }] : [{ status: "applied", at: dateApplied }],
    };

    await onAdd(newApp);
    resetAndClose();
  };

  return (
    <Dialog
      open={open}
      title="Log application"
      fullScreen
      disablePadding
      onClose={resetAndClose}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={resetAndClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            {status === "todo" ? "Add to queue" : "Save application"}
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
        leadingField={
          <Select
            label="Status"
            value={status}
            options={initialStatusOptions}
            onChange={(v) => setStatus(v as "todo" | "applied")}
          />
        }
      />
    </Dialog>
  );
}
