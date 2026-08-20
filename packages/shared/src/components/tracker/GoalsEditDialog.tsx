"use client";

import { useState } from "react";
import { Dialog, Input, Button } from "@/components/ds";
import { formatDateInput, toDateInputValue } from "@/lib/date";
import type { Goals } from "@/lib/types";

interface GoalsEditDialogProps {
  goals: Goals;
  onClose: () => void;
  onSave: (goals: Goals) => void;
}

/** Only ever rendered while the edit-goals flow is open, so state starts fresh from `goals` every time. */
export function GoalsEditDialog({ goals, onClose, onSave }: GoalsEditDialogProps) {
  const [salaryMin, setSalaryMin] = useState(goals.salaryMin != null ? String(goals.salaryMin) : "");
  const [salaryMax, setSalaryMax] = useState(goals.salaryMax != null ? String(goals.salaryMax) : "");
  const [weeklyTarget, setWeeklyTarget] = useState(
    goals.applicationsPerWeekTarget != null ? String(goals.applicationsPerWeekTarget) : ""
  );
  const [targetDateInput, setTargetDateInput] = useState(
    goals.targetOfferDate ? toDateInputValue(goals.targetOfferDate) : ""
  );
  const [submitted, setSubmitted] = useState(false);

  const min = salaryMin.trim() ? Number(salaryMin) : undefined;
  const max = salaryMax.trim() ? Number(salaryMax) : undefined;
  const maxWithoutMin = max != null && min == null;
  const minAboveMax = min != null && max != null && min > max;

  const handleSave = () => {
    setSubmitted(true);
    if (maxWithoutMin || minAboveMax) return;

    onSave({
      salaryMin: min,
      salaryMax: max,
      applicationsPerWeekTarget: weeklyTarget.trim() ? Number(weeklyTarget) : undefined,
      targetOfferDate: targetDateInput ? formatDateInput(targetDateInput) : undefined,
    });
  };

  return (
    <Dialog
      open
      title="Edit goals"
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
        <div style={{ display: "flex", gap: 12 }}>
          <Input
            label="Minimum salary"
            type="number"
            placeholder="e.g. 120000"
            value={salaryMin}
            onChange={setSalaryMin}
            error={submitted && minAboveMax ? "Must be ≤ maximum" : undefined}
          />
          <Input
            label="Maximum salary (optional)"
            type="number"
            placeholder="e.g. 150000"
            value={salaryMax}
            onChange={setSalaryMax}
            error={submitted && maxWithoutMin ? "Enter a minimum first" : undefined}
          />
        </div>
        <Input
          label="Applications per week target"
          type="number"
          placeholder="e.g. 5"
          value={weeklyTarget}
          onChange={setWeeklyTarget}
        />
        <Input label="Target offer date" type="date" value={targetDateInput} onChange={setTargetDateInput} />
      </div>
    </Dialog>
  );
}
