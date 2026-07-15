"use client";

import { useState } from "react";
import { Dialog, Select, Input, Button } from "@/components/ds";
import type { SelectOption } from "@/components/ds";
import { statusLabels, statusOrder } from "@/lib/data";
import { formatDateInput, todayFormatted } from "@/lib/date";
import type { ApplicationStatus } from "@/lib/types";

const statusOptions: SelectOption[] = statusOrder.map((s) => ({ value: s, label: statusLabels[s] }));

interface StatusChangeDialogProps {
  currentStatus: ApplicationStatus;
  onClose: () => void;
  onSave: (status: ApplicationStatus, at: string) => void;
}

/** Only ever rendered while the change-status flow is open, so state starts fresh from `currentStatus` every time. */
export function StatusChangeDialog({ currentStatus, onClose, onSave }: StatusChangeDialogProps) {
  const [status, setStatus] = useState<ApplicationStatus>(currentStatus);
  const [dateInput, setDateInput] = useState("");

  const handleSave = () => {
    const at = dateInput ? formatDateInput(dateInput) : todayFormatted();
    onSave(status, at);
  };

  return (
    <Dialog
      open
      title="Change status"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            Save
          </Button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Select
          label="New status"
          value={status}
          options={statusOptions}
          onChange={(v) => setStatus(v as ApplicationStatus)}
        />
        <Input label="Date" type="date" value={dateInput} onChange={setDateInput} hint="Defaults to today if left blank" />
      </div>
    </Dialog>
  );
}
