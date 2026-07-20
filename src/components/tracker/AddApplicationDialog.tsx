"use client";

import { useState } from "react";
import { Dialog, Button, Select } from "@/components/ds";
import { formatDateInput, todayFormatted } from "@/lib/date";
import { ApplicationFormFields, emptyApplicationForm, isApplicationFormValid } from "./ApplicationFormFields";
import type { ApplicationFormValues } from "./ApplicationFormFields";
import { companyName } from "@/lib/companies";
import type { Application, Company, Contact } from "@/lib/types";

interface AddApplicationDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (app: Application) => void;
  contacts: Contact[];
  onCreateContact: (contact: Contact) => void;
  companies: Company[];
  onCreateCompany: (company: Company) => void;
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

  const handleSave = () => {
    setSubmitted(true);
    if (!isApplicationFormValid(form, requireDateApplied)) return;

    const dateApplied = form.dateApplied ? formatDateInput(form.dateApplied) : "";
    const newApp: Application = {
      id: crypto.randomUUID(),
      companyId: form.companyId,
      role: form.role.trim(),
      dateApplied,
      link: form.link.trim(),
      jobDescription: form.description.trim(),
      referral: form.referral,
      referredByContactId: form.referral ? form.referredByContactId || undefined : undefined,
      resumeType: form.resumeType as Application["resumeType"],
      coverLetterSubmitted: form.coverLetterSubmitted === "yes",
      notes: form.notes.trim(),
      salaryMin: form.salaryMin.trim() ? Number(form.salaryMin) : undefined,
      salaryMax: form.salaryMax.trim() ? Number(form.salaryMax) : undefined,
      workArrangement: form.workArrangement || undefined,
      city: form.city.trim() || undefined,
      state: form.state.trim() || undefined,
      status,
      logo: companyName(form.companyId, companies).charAt(0).toUpperCase() || "?",
      statusHistory:
        status === "todo" ? [{ status: "todo", at: todayFormatted() }] : [{ status: "applied", at: dateApplied }],
      interviews: [],
      followUps: [],
    };

    onAdd(newApp);
    resetAndClose();
  };

  return (
    <Dialog
      open={open}
      title="Log application"
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
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Select
          label="Status"
          value={status}
          options={initialStatusOptions}
          onChange={(v) => setStatus(v as "todo" | "applied")}
        />
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
      </div>
    </Dialog>
  );
}
